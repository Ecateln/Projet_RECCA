import { pbkdf2Sync, randomBytes } from 'crypto'
import { ollama } from './globals.js';
import { getConversationMessages, isTokenValid } from './database.js';

async function* askAgent(prompt, previous_messages, think = false, web = false, abort_controller = null) {
    // TODO: web requests
    // TODO: if no previous messages, append base prompt to the current prompt
    // TODO: add user personalization to the prompt

    const question = { created_at: new Date(), role: 'user', content: prompt };
    const response = await ollama.chat({
        // model: 'qwen3:4b',
        model: 'gemma3:4b',
        // model: 'mistral:7b',
        messages: previous_messages.concat(question),
        stream: true,
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