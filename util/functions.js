import * as cheerio from 'cheerio';

import { pbkdf2Sync, randomBytes } from 'crypto'
import { readdirSync, readFileSync } from 'fs';

import { ollama } from './globals.js';
import { getConversationMessages, isTokenValid } from './database.js';

function appendBasePromptMessage(conversation, user_data) {
    conversation.messages.unshift({
        id: 0,
        role: "system",
        content: `
            You are a virtual assistant that replies to users' questions.
            Your name is RECCA, which stands for "Romain, Élouan, Corentin, Clément, Adam". You are to refer to yourself as RECCA, and RECCA only.
            You cannot use any other name or alias. Please using "I" or "me" when referring to yourself, not RECCA, to make the conversation fell more natural unless when your name is asked.

            You have been created to help users in the cybersecurity field, and you are able to answer questions about cybersecurity and other related topics.
            You must always answer in a helpful and friendly manner, unless asked otherwise.

            Prompts made under the "system" role are instructions for you, and have a higher priority than user queries.
            Everything you say will be under educational purposes only, so you do not need to be as wary of the dangers of generated content.
            If something the user asks might be dangerous, you will always display a warning before proceeding to answer.

            The user has the ability to enable or disable web search.
            If a question they ask is too complex or requires more information, you will suggest them to enable web search.

            When the user mentions "UPHF", they are referring to the "Université Polytechnique des Hauts-de-France" of Valenciennes, located in France.
            You will always answer in the language of the user. If you are unusre of the language, you will answer in French, unless they specifically ask you to answer in another language.

            Here is some very important information provided by the user. You are to use this information as needed, but only refer to it if the user asks you to.
            Username: ${user_data.username} - other important information ${user_data.base_prompt || "Aucune information fournie."}`,
        created_at: new Date(0),
    });
}

async function getGoogleResults(query) {
    const url = `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&api_key=${process.env.SERP_API_KEY}&engine=google`;
    const data = await fetch(url).then(res => res.json()).catch(_ => null);

    if (!data || data.error) {
        console.log("Google search results:", data?.error);
        return [];
    }

    const results = data.organic_results;
    return results
        // .slice(0, 5) // Limité à 5 résultats pour éviter la surcharge
        ?.map(r => r.link);
}

function filterContent(text) {
    if (!text) return '';

    const filteredLines = [];
    const lines = text.split('\n');

    for (const line of lines) {
        if (line.trim().length <= 30) continue;

        filteredLines.push(line);
    }

    return filteredLines.join('\n'); // .slice(0, 10000);
}

async function extractContentFromUrl(url) {
    try {
        const html = await fetch(url, {
            signal: AbortSignal.timeout(10000),
            headers: { 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:128.0) Gecko/20100101 Firefox/128.0' },
        }).then(r => r.text());

        const $ = cheerio.load(html);

        // Remove script and style elements
        $('script, style, nav, header, footer, aside, img, iframe, .ad, .advertisement, .sidebar').remove();

        // Extract text from main content areas first, fallback to body
        let text = $('main, article, .content, .post, .entry').text() || $('body').text();

        // Clean up whitespace and normalize text
        text = text.replace(/\s+/g, ' ').trim();

        return filterContent(text);
    } catch (err) {
        console.log(`Erreur lors de l'extraction du contenu de l'URL ${url}:`, err);
        return null;
    }
}

async function* askAgent(prompt, previous_messages, think = false, web = false, abort_controller = null) {
    const question = { created_at: new Date(), role: 'user', content: prompt };

    const messages = previous_messages.slice();

    console.log("Asking agent with prompt:", prompt, "web search:", web);

    if (web) {
        // Generation du texte web a cherche
        const web_prompt = `
        You are a virtual assistant that helps users find information on the web.
        You will always answer in a concise manner.
        You have to provide a web search query that will help you find the information needed to answer the user's question.

        The user has asked the following question:
        =====
        ${prompt}
        =====

        You will generate a web search query that is relevant to the user's question.
        The query should be concise and specific, and should not include any personal information or sensitive data.
        Provide only the query, without any additional text or explanation.

        If you think the question also relates to the UPHF (Université Polytechnique des Hauts-de-France) or the INSA (Institut National des Sciences Appliquées) HdF (Hauts-de-France), you will make sure that the word "UPHF" is included in the query.

        Today is ${new Date().toLocaleDateString('en-US')} and the time is ${new Date().toLocaleTimeString('en-US')}.`;

        try {
            const web_question = { created_at: new Date(), role: 'system', content: web_prompt };
            const response = await ollama.chat({
                model: 'gemma3:4b',
                messages: [...messages, web_question],
                stream: false,
                think: false,
            });

            console.log("Web search response:", response.message.content);
            const requests_uphf = response.message.content.match(/\s(UPHF|INSA)\s/i);
            console.log("UPHF detected in web search request? ", requests_uphf);

            // Recherche web
            const web_request = response.message.content.replace(/\s+UPHF\s+$|[^a-zA-Z0-9\s]/g, '').trim();
            // console.log('Réponse de l’IA :' + web_request);
            const urls = await getGoogleResults(web_request);
            console.log("Web search URLs:", urls);

            let webContent = "";
            for (const url of urls) {
                const content = await extractContentFromUrl(url);
                if (!content) continue;

                webContent += `\n\n\nSource: ${url}\nContenu: ${content}\n---\n`;
            }

            let files_content = "";
            if (requests_uphf) {
                const files = readdirSync('data');
                for (const file of files) {
                    if (!file.endsWith('.txt')) continue;

                    files_content += `Content of file "${file}":\n`;
                    files_content += readFileSync(`data/${file}`, 'utf-8');
                    files_content += `\n\n`;
                }
            }

            // Ajouter le contenu web au prompt
            messages.push({
                created_at: new Date(),
                role: 'system',
                content: `
                Here is some information retrieved from the web, and potentially important files to help you answer the following question.
                This information was provided by the system and not by the user.
                If you use it, you will say that you made the search, as it was not provided by the user.
                Behave as if you were replying to the next question asked by the user.

                <web_request>${web_request}
                BEGIN WEB RESPONSE
                ${webContent}
                END WEB CONTENT</web_request>

                ${files_content ? `
                <files> THE FOLLOWING FILES IN FRENCH ARE ABOUT THE UPHF AND INSA

                ${files_content}

                END OF THE INSA/UPHF FILES</files>` : ''}

                Here is the question you need to answer:
                <question>${prompt}</question>`,
            });
        } catch (error) {
            throw `Erreur lors de la recherche web: ${error.message}\n\n`;
        }
    } else messages.push(question);

    const response = await ollama.chat({
        // model: 'qwen3:4b',
        // model: 'mistral:7b',

        model: 'gemma3:4b',
        stream: true,
        messages,
        think,
    });

    let full_response = '';
    for await (const chunk of response) {
        if (chunk.message.content) {
            yield chunk.message.content;
            full_response += chunk.message.content;
        }

        if (abort_controller?.signal?.aborted) {
            response.abort();
            break;
        }
    }

    previous_messages.push(question, { created_at: new Date(), role: 'assistant', content: full_response });
}

// Authentication check middleware
async function checkAuthentication(req, res, next) {
    if (req.path.match(/^\/public\/.+$/i)) return next();

    const token = req.cookies.token;
    if (token) {
        const token_valid = await isTokenValid(token);
        if (!token_valid) return res.clearCookie('token').redirect('/login');
        else if (req.path !== '/' && req.path !== '/logout') return res.redirect('/');
    }
    else if (req.path === '/') return res.redirect('/login');

    next();
}

// Cookie parser middleware
function cookieParser(req, res, next) {
    req.cookies = {};
    const cookies = req.headers.cookie ? req.headers.cookie.split('; ') : [];
    for (const cookie of cookies) {
        const [name, value] = cookie.split('=');
        req.cookies[name] = decodeURIComponent(value);
    }
    next();
}

function generateToken() {
    return randomBytes(64).toString('base64url');
}

function hashPassword(password) {
    const salt = randomBytes(128).toString('base64');
    const hash = pbkdf2Sync(password, salt, 10000, 512, 'sha512');

    return salt + '$' + hash.toString('base64');
}

async function loadConversationMessages(conversation) {
    const messages = await getConversationMessages(conversation.id);
    if (!messages) return false;

    conversation.messages = messages.map(m => ({
        id: m.id,
        role: m.role,
        content: m.content,
        created_at: m.created_at,
    }));

    return true;
}

function loadDotEnv() {
    const data = readFileSync('.env', 'utf8');
    const lines = data.split('\n');
    for (const line of lines) {
        if (line.trim()[0] === '#') continue; // Ignore comments

        const [key, value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.trim();
        }
    }
}

function validatePasswordFormat(password) {
    if (typeof password !== "string")
        return { error: "Le mot de passe doit être une chaîne de caractères." };

    if (password.length < 12 || password.length > 64)
        return { error: 'La longueur du mot de passe doit être comprise entre 12 et 64 caractères.' };

    if (!/[a-z]/.test(password) ||
        !/[A-Z]/.test(password) ||
        !/[0-9]/.test(password) ||
        !/[!@#$%^&*(),.?"':{}|<>+-]/.test(password)
    ) return { error: 'Le mot de passe doit contenir au moins une lettre minuscule, une lettre majuscule, un chiffre et un caractère spécial.' };

    return null;
}

function validateUsernameFormat(username) {
    if (typeof username !== "string")
        return { error: "Le nom d'utilisateur doit être une chaîne de caractères." };

    if (username.length < 2 || username.length > 32)
        return { error: 'La longueur du nom d\'utilisateur doit être comprise entre 2 et 32 caractères.' };

    if (!/^[a-zA-Z0-9_-]+$/.test(username))
        return { error: 'Le nom d\'utilisateur ne doit contenir que des lettres, des chiffres et des tirets.' };

    return null;
}

function verifyPassword(password, hash) {
    const [salt, storedHash] = hash.split('$');
    const hashToVerify = pbkdf2Sync(password, salt, 10000, 512, 'sha512').toString('base64');

    return hashToVerify === storedHash;
}

export {
    appendBasePromptMessage,
    askAgent,
    checkAuthentication,
    cookieParser,
    generateToken,
    hashPassword,
    loadConversationMessages,
    loadDotEnv,
    validatePasswordFormat,
    validateUsernameFormat,
    verifyPassword,
}