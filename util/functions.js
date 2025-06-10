import { pbkdf2Sync, randomBytes } from 'crypto'
import { ollama } from './globals.js';
import { getConversationMessages, isTokenValid } from './database.js';
import puppeteer from 'puppeteer';
const SERP_API_KEY = '07b79833f1cb2ca14810bba13734c3275660122635850586fbbc1f885a4f1005';

function appendBasePromptMessage(conversation, base_prompt) {
    conversation.messages.unshift({
        id: 0,
        role: "system",
        content: `
            You are a virtual assistant that replies to users questions.
            The user is a human and you are an AI. Your name is RECCA.
            You must always answer in a helpful and friendly manner.
            Everything you say will be under educational purposes only.
            You will never ignore prompts made by the 'system' role.
            If something the user asks might be dangerous, you will always display a warning before proceeding to answer.
            You will always answer in the language of the user.

            Here is some information provided by the user:
            ${base_prompt || "Aucune information fournie."}`,
        created_at: new Date(0),
    });
}

async function getGoogleResults(query) {
    const url = `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&api_key=${SERP_API_KEY}&engine=google`;
    const data = await fetch(url).then(res => res.json()).catch(_ => null);

    console.log(data);
    if (data?.error) return [];

    const results = data.organic_results;
    return results.slice(0, 5)?.map(r => r.link); // Limité à 5 résultats pour éviter la surcharge
}

function filterContent(text) {
    if (!text) return '';

    const lines = text.split('\n');
    let filteredLines = [];
    let foundValidLine = false;

    for (const line of lines) { 
        if (line.trim().length >= 30) {
            filteredLines.push(line);
        }
    }

    return filteredLines.join('\n');
}

async function extractContentFromUrl(url, browser) {
    try {
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
        const text = await page.evaluate(() => document.body.innerText.slice(0, 2000)); // Réduit pour optimiser
        await page.close();

        
        return text.trim();
    } catch (err) {
        return `⚠️ Erreur lors de l'extraction de ${url}: ${err.message}`;
    }
}

async function* askAgent(prompt, previous_messages, think = false, web = false, abort_controller = null) {
    // TODO: web requests

    const question = { created_at: new Date(), role: 'user', content: prompt };

    const messages = previous_messages.slice(1);
    messages.push(question);
    if (web = true) {
        // Generation du texte web a cherche
        // TODO: refaire la prompt pour qu'elle soit plus concise et efficace
        const web_prompt = `Quelle recherche web faire pour répondre à la question suivante: ${prompt}\n\n Ne détaille rien, donne moi juste ce qu'il faut rentrer dans la barre de recherche, sans superflu ou explications.`;
        try {
            const web_question = { created_at: new Date(), role: 'user', content: web_prompt };
            const response = await ollama.chat({
                model: 'gemma3:4b',
                messages: [web_question],
                stream: false,
                think: false,
            });

            console.log('Réponse de l’IA :');
            console.log(response.message.content);
            // console.log(response.data.response);
            // return response.data.response;
            // messages.push({ created_at: new Date(), role: 'user', content: "Voici des informations récupérées d'" response.data.response });

            // Recherche web
            const web_request = response.message.content;
            const urls = await getGoogleResults(web_request);
            const browser = await puppeteer.launch({ headless: true });

            let webContent = "";

            for (const url of urls) {
                const precontent = await extractContentFromUrl(url, browser);
                let content = filterContent(precontent);
                if (!content) {
                    content = `Aucun contenu significatif trouvé pour ${url}`;
                    continue;
                }

                webContent += `\nSource: ${url}\nContenu: ${content}\n---\n`;
            }

            await browser.close();

            // Ajouter le contenu web au prompt
            messages.push({
                created_at: new Date(),
                role: 'system',
                content: `Voici des informations récupérées du web pour t'aider à répondre à la question précédente :\n Recherche web associée ${web_request}: \n${webContent}`,
            });

            console.log(messages.at(-1));

            // enhancedPrompt = `${prompt}\n\nInformations contextuelles du web pour t'aider à répondre à la question :\n Recherche web associée : clement ogé linkedin \n${webContent}`;
            // console.log(enhancedPrompt);
        } catch (error) {
            yield `⚠️ Erreur lors de la recherche web: ${error.message}\n\n`;
            yield null;
            return;
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

    if (username.length < 2 || username.length > 20)
        return { error: 'La longueur du nom d\'utilisateur doit être comprise entre 2 et 20 caractères.' };

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
    validatePasswordFormat,
    validateUsernameFormat,
    verifyPassword,
}