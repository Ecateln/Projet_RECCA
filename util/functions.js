import { pbkdf2Sync, randomBytes } from 'crypto'
import { ollama } from './globals.js';

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

function generateToken() {
    return randomBytes(64).toString('base64url');
}

function hashPassword(password) {
    const salt = randomBytes(128).toString('base64');
    const hash = pbkdf2Sync(password, salt, 10000, 512, 'sha512');

    return salt + '$' + hash.toString('base64');
}

function verifyPassword(password, hash) {
    const [salt, storedHash] = hash.split('$');
    const hashToVerify = pbkdf2Sync(password, salt, 10000, 512, 'sha512').toString('base64');

    return hashToVerify === storedHash;
}

export { askAgent, generateToken, hashPassword, verifyPassword }