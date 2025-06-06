import { pbkdf2Sync, randomBytes } from 'crypto'
import { ollama } from './globals.js';
import { getConversationMessages, isTokenValid } from './database.js';

async function* askAgent(prompt, previous_messages, think = false, web = false) {
    // TODO: web requests
    // TODO: if no previous messages, append base prompt to the current prompt

    const question = { date: Date.now(), role: 'user', content: prompt };
    const response = await ollama.chat({
        model: 'qwen3:4b',
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
    }

    previous_messages.push(question, { date: Date.now(), role: 'assistant', content: full_response });
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

function verifyPassword(password, hash) {
    const [salt, storedHash] = hash.split('$');
    const hashToVerify = pbkdf2Sync(password, salt, 10000, 512, 'sha512').toString('base64');

    return hashToVerify === storedHash;
}

export { askAgent, checkAuthentication, cookieParser, generateToken, hashPassword, loadConversationMessages, verifyPassword }