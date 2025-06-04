import express from 'express';
import path from 'path';

import { createServer } from 'http';
import { Server } from 'socket.io';
import { askAgent, generateToken } from './util/functions.js';
import { pgp } from './util/globals.js';
import { initializeDatabase } from './util/database.js';

await initializeDatabase();

// import { askAgent } from './util/functions.js';
// const msgs = [];
// async function askAndPrint(prompt) {
//     process.stdout.write(`\x1b[32m> ${prompt}\n\x1b[0m`);
//     for await (const tok of askAgent(prompt, msgs)) process.stdout.write(tok);
//     process.stdout.write("\n");
// }
// await askAndPrint("Bonjour, je m'appelle Barbara.");
// await askAndPrint("Où est la France?");
// await askAndPrint("Merci! Je suis prise d'amnésie.... saurais-tu me dire qui je suis?");
// process.exit();

const app = express();
const server = createServer(app);
const socket_server = new Server(server);

app.use(express.json());
app.use('/static', express.static(path.join('public')));

socket_server.on('connection', (socket) => {
    socket.user_data = null;

    socket.on('login', (token) => {
        if (typeof token !== "string") return;
        if (socket.user_data) return socket.disconnect();

        // TODO: handle proper authentication

        socket.user_data = {
            active_query: false,
            conversations: [{
                id: "0", // Date.now().toString(),
                title: 'Conversation with Barbara',
                messages: [
                    { date: Date.now() - 123456, role: 'user', content: 'Hello, I am Barbara.' },
                    { date: Date.now() - 100456, role: 'assistant', content: 'Hello Barbara, how can I help you today?' },
                ],
            }],
            current_conversation: null,
        };

        socket.emit(
            'login_success',
            socket.user_data.conversations.map(({ id, title }) => ({ id, title })),
        );
    });

    socket.on("request_conversation", (conversation_id) => {
        if (typeof conversation_id !== "string") return;

        if (!socket.user_data) {
            socket.emit('error', 'Une connexion est requise pour effectuer cette action.');
            return;
        }

        const conv_i = socket.user_data.conversations.findIndex(c => c.id == conversation_id);
        if (conv_i == -1) {
            socket.emit('error', 'Conversation introuvable.');
            return;
        }

        socket.user_data.current_conversation = socket.user_data.conversations[conv_i];
        socket.emit("conversation", socket.user_data.current_conversation);
    });

    socket.on("query", async (prompt) => {
        if (typeof prompt !== "string" || !socket.user_data) return;
        if (socket.active_query) return socket.emit("error", "Une réponse est déjà en cours.");
        if (!socket.user_data.current_conversation) return socket.emit("error", "Aucune conversation sélectionnée.");

        socket.user_data.active_query = true;

        const response_stream = askAgent(prompt, socket.user_data.current_conversation.messages);
        for await (const token of response_stream)
            socket.emit("res", token);

        socket.user_data.active_query = false;
        socket.emit("res", null);

        console.log('Updated conversation:', socket.user_data.current_conversation);
    });

    socket.on('disconnect', () => {
        // TODO: gracefully handle disconnect

        // console.log('A user disconnected');
    });
});

app.get('/', (req, res) => res.status(200).send("Hello World :)").end());

// TODO: register/login with tokens with expiration
app.post('/login', (req, res) => {
    const body = req.body;
    if (!body || typeof body.username !== 'string' || typeof body.password !== 'string')
        return res.status(400)
                .send('Invalid request body')
                .end();

    // TODO: validate login data, generate token, and save it in the database
    // const token = generateToken();

    res.status(404).end();
});

app.post('/register', (req, res) => {
    const body = req.body;
    if (!body || typeof body.username !== 'string' || typeof body.password !== 'string')
        return res.status(400)
                .send('Invalid request body')
                .end();

    if (body.username.length < 2 || body.username.length > 20)
        return res.status(400)
            .send('La longueur du nom d\'utilisateur doit être comprise entre 2 et 20 caractères.')
            .end();

    if (body.password.length < 12 || body.password.length > 64)
        return res.status(400)
            .send('La longueur du mot de passe doit être comprise entre 12 et 64 caractères.')
            .end();

    // TODO: store and hash password, create user in database

    console.log(req.body);
    res.status(404).end();
});

app.get('/test', (req, res) => res.sendFile(path.join(process.cwd(), 'public', 'html', 'test.html')));
app.all(/(.*)/, (req, res) => res.redirect("https://youtu.be/dQw4w9WgXcQ"));

// Start server
const port = 8001;
server.listen(
    port,
    () => console.log(`Server running on http://localhost:${port}`),
);

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down gracefully...');
    pgp.end();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\nShutting down gracefully...');
    pgp.end();
    process.exit(0);
});