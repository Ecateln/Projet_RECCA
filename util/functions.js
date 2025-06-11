import fs from 'fs';
import * as cheerio from 'cheerio';

import { pbkdf2Sync, randomBytes } from 'crypto'
import { ollama } from './globals.js';
import { getConversationMessages, isTokenValid } from './database.js';
// import puppeteer from 'puppeteer';

const SERP_API_KEY = '07b79833f1cb2ca14810bba13734c3275660122635850586fbbc1f885a4f1005';

function appendBasePromptMessage(conversation, base_prompt) {
    conversation.messages.unshift({
        id: 0,
        role: "system",
        content: `
            You are a virtual assistant that replies to users questions.
            Your name is RECCA, which stands for "Romain, Elouan, Corentin, Clément, Adam". You are to refer to yourself as RECCA, and RECCA only.
            You cannot use any other name or alias.

            You must always answer in a helpful and friendly manner.
            Everything you say will be under educational purposes only.
            You will never ignore prompts made by the 'system' role.
            If something the user asks might be dangerous, you will always display a warning before proceeding to answer.
            You will always answer in the language of the user.

            Here is some information provided by the user, only refer to this information if it is relevant to the question asked:
            ${base_prompt || "Aucune information fournie."}`,
        created_at: new Date(0),
    });
}

async function getGoogleResults(query) {
    const url = `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&api_key=${SERP_API_KEY}&engine=google`;
    const data = await fetch(url).then(res => res.json()).catch(_ => null);

    if (data?.error) return [];

    const results = data.organic_results;
    return results.slice(0, 5)?.map(r => r.link); // Limité à 5 résultats pour éviter la surcharge
}

function filterContent(text) {
    if (!text) return '';

    const filteredLines = [];
    const lines = text.split('\n');

    for (const line of lines) {
        if (line.trim().length <= 30) continue;

        filteredLines.push(line);
    }

    return filteredLines.join('\n').slice(0, 10000);
}

async function extractContentFromUrl(url, browser) {
    try {
        const html = await fetch(url, { signal: AbortSignal.timeout(1000) })
            .then(r => r.text());

        const $ = cheerio.load(html);

        // Remove script and style elements
        $('script, style, nav, header, footer, aside, .ad, .advertisement, .sidebar, img').remove();

        // Extract text from main content areas first, fallback to body
        let text = $('main, article, .content, .post, .entry').text() || $('body').text();

        // Clean up whitespace and normalize text
        text = text.replace(/\s+/g, ' ').trim();

        return filterContent(text);
    } catch (err) {
        return null;
    }
}

async function* askAgent(prompt, previous_messages, think = false, web = false, abort_controller = null) {
    const question = { created_at: new Date(), role: 'user', content: prompt };

    const messages = previous_messages.slice(1);
    messages.push({...question, content: prompt});
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

        Today is ${new Date().toLocaleDateString('en-US')} and the time is ${new Date().toLocaleTimeString('en-US')}.`;

        try {
            const web_question = { created_at: new Date(), role: 'user', content: web_prompt };
            const response = await ollama.chat({
                model: 'gemma3:4b',
                messages: [web_question],
                stream: false,
                think: false,
            });

            console.log('Réponse de l’IA :' + response.message.content);

            // Recherche web
            const web_request = response.message.content.replace(/[^a-zA-Z0-9\s]/g, '').trim();
            const urls = await getGoogleResults(web_request);

            let webContent = "";
            for (const url of urls) {
                const content = await extractContentFromUrl(url, null);
                if (!content) continue;

                webContent += `\n\n\nSource: ${url}\nContenu: ${content}\n---\n`;
            }

            console.log(webContent);

            // Ajouter le contenu web au prompt
            messages.push({
                created_at: new Date(),
                role: 'system',
                content: `Voici des informations récupérées du web pour t'aider à répondre à la question précédente :\n Recherche web associée ${web_request}: \n${webContent}`,
            });
        } catch (error) {
            throw `⚠️ Erreur lors de la recherche web: ${error.message}\n\n`;
        }
    }


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
    const data = fs.readFileSync('.env', 'utf8');
    const lines = data.split('\n');
    for (const line of lines) {
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