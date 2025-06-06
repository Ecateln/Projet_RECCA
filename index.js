import express from 'express';
import path from 'path';

import { createServer } from 'http';
import { Server } from 'socket.io';
import { askAgent, checkAuthentication, cookieParser, generateToken, hashPassword, loadConversationMessages, verifyPassword } from './util/functions.js';
import { pgp } from './util/globals.js';
import { addMessage, createConversation, createToken, createUser, getConversationMessages, getUserByToken, getUserByUsername, getUserConversations, initializeDatabase, isTokenValid, isUsernameFree } from './util/database.js';

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

app.use(cookieParser, checkAuthentication, express.json());
app.use('/public', express.static(path.join('public')));

socket_server.on('connection', (socket) => {
    socket.user_data = null;

    socket.on('login', async (token) => {
        if (typeof token !== "string") return;
        if (socket.user_data) return socket.disconnect();

        const user_data = await getUserByToken(token);
        if (!user_data) {
            socket.emit('error', { error: 'Token invalide ou expiré.', redirect: '/login' });
            return socket.disconnect();
        }

        const conversations = await getUserConversations(user_data.id);
        if (!conversations) {
            socket.emit('error', { error: 'Erreur lors du chargement des conversations.' });
            return;
        }

        socket.user_data = {
            id: user_data.id,
            conversations: conversations.map(c => ({
                id: c.id,
                title: c.title,
                created_at: c.created_at,
                last_message_at: c.last_message_at,
                messages: null,
            })),
            active_query: false,
            current_conversation: null,
        };

        // return console.log(user_data, convs);
        socket.emit(
            'login_success',
            socket.user_data.conversations.map(({ id, title }) => ({ id, title })),
        );
    });

    socket.on("request_conversation", async (conversation_id) => {
        if (typeof conversation_id !== "number" || !socket.user_data) return;

        const conv_i = socket.user_data.conversations.findIndex(c => c.id == conversation_id);
        if (conv_i == -1) {
            socket.emit('error', { error: 'Conversation introuvable.' });
            return;
        }

        const conversation = socket.user_data.conversations[conv_i];
        if (!conversation.messages && !await loadConversationMessages(conversation)) {
            return socket.emit('error', { error: 'Erreur lors du chargement des messages de la conversation.' });
        }

        socket.user_data.current_conversation = socket.user_data.conversations[conv_i];
        socket.emit("conversation", socket.user_data.current_conversation);
    });

    socket.on("create_conversation", async (title = 'Nouvelle Conversation') => {
        if (typeof title !== "string" || !socket.user_data) return;
        if (socket.user_data.conversations.length == 10) {
            return socket.emit("error", { error: "Vous avez atteint le nombre maximum de conversations." });
        }

        if (title.length < 2 || title.length > 64) {
            return socket.emit("error", { error: "Le titre de la conversation doit être compris entre 2 et 64 caractères." });
        }

        const new_conversation = await createConversation(socket.user_data.id, title);
        if (!new_conversation) {
            return socket.emit("error", { error: "Erreur lors de la création de la conversation." });
        }

        socket.user_data.conversations.push({
            id: new_conversation.id,
            title: new_conversation.title,
            created_at: new_conversation.created_at,
            last_message_at: null,
            messages: [],
        });

        socket.emit("conversation_created", new_conversation);
    });

    // TODO: delete conversation

    socket.on("query", async (conversation_id, prompt, enable_web = false) => {
        if (typeof prompt !== "string" || !socket.user_data) return;
        if (socket.active_query) return socket.emit("error", { error: "Une réponse est déjà en cours." });

        // Change conversation if needed
        if (!socket.user_data.current_conversation || socket.user_data.current_conversation.id != conversation_id) {
            const conversation = socket.user_data.conversations.find(c => c.id == conversation_id);
            if (!conversation) return socket.emit("error", { error: "Conversation introuvable." });

            if (!conversation.messages && !await loadConversationMessages(conversation)) {
                return socket.emit('error', { error: 'Erreur lors du chargement des messages de la conversation.' });
            }

            socket.user_data.current_conversation = conversation;
        }

        prompt = prompt.trim();
        if (prompt.length == 0 || prompt.length > 10000) {
            return socket.emit("error", { error: "La taille du message doit être inferieure à 10000 caractères." });
        }

        socket.user_data.active_query = true;

        const response_stream = askAgent(prompt, socket.user_data.current_conversation.messages, false, enable_web);
        for await (const token of response_stream)
            socket.emit("res", token);

        socket.user_data.active_query = false;
        socket.emit("res", null);

        for (const m of socket.user_data.current_conversation.messages.slice(-2)) {
            console.log(m);
            await addMessage(
                socket.user_data.current_conversation.id,
                m.role,
                m.content,
                m.created_at,
            );
        }
    });

    socket.on('disconnect', () => {
        // TODO: gracefully handle disconnect

        // console.log('A user disconnected');
    });
});

app.get('/', (req, res) => res.sendFile(path.join(process.cwd(), "public", "html", "temp_chat.html")));
app.get('/login', (req, res) => res.sendFile(path.join(process.cwd(), "public", "html", "loginPage.html")));
app.get('/register', (req, res) => res.sendFile(path.join(process.cwd(), "public", "html", "registerPage.html")));
app.get('/logout', (req, res) => res.clearCookie('token').redirect('/login'));
// TODO: favicon link

app.post('/register', async (req, res) => {
    const body = req.body;
    console.log(req.body);
    if (!body || typeof body.username !== 'string' || typeof body.password !== 'string')
        return res.status(400)
            .send('Invalid request body')
            .end();


    if (body.username.length < 2 || body.username.length > 20)
        return res.status(400)
            .json({ error: 'La longueur du nom d\'utilisateur doit être comprise entre 2 et 20 caractères.' })
            .end();

    if (body.password.length < 12 || body.password.length > 64)
        return res.status(400)
            .json({ error: 'La longueur du mot de passe doit être comprise entre 12 et 64 caractères.' })
            .end();

    if (!/[a-zA-Z0-9_-]/.test(body.username))
        return res.status(400)
            .json({ error: 'Le nom d\'utilisateur ne doit contenir que des lettres, des chiffres et des tirets.' })
            .end();

    if (
        !/[a-z]/.test(body.password) ||
        !/[A-Z]/.test(body.password) ||
        !/[0-9]/.test(body.password) ||
        !/[!@#$%^&*(),.?"':{}|<>+-]/.test(body.password)
    )
        return res.status(400)
            .json({ error: 'Le mot de passe doit contenir au moins une lettre minuscule, une lettre majuscule, un chiffre et un caractère spécial.' })
            .end();

    // Check if username already exists
    const is_free = await isUsernameFree(body.username);
    if (!is_free)
        return res.status(400)
            .json({ error: 'Un utilisateur avec ce nom d\'utilisateur existe déjà.' })
            .end();

    // Hash password
    const hash = hashPassword(body.password);
    const user = await createUser(body.username, hash);

    if (!user)
        return res.status(500)
            .json({ error: 'Erreur lors de l\'inscription, veuillez réessayer plus tard.' })
            .end();

    res.status(201)
        // .json({
        //     id: user.id,
        //     username: user.username,
        //     created_at: user.created_at,
        // })
        .end();
});

app.post('/login', async (req, res) => {
    const body = req.body;
    if (!body || typeof body.username !== 'string' || typeof body.password !== 'string')
        return res.status(400)
            .send('Invalid request body')
            .end();

    const user_data = await getUserByUsername(body.username);
    const pass_ok = verifyPassword(body.password, user_data?.password_hash ?? '');

    if (!user_data || !pass_ok)
        return res.status(400)
            .json({ error: 'Nom d\'utilisateur ou mot de passe incorrect.' })
            .end();

    console.log('User logged in:', user_data);

    // Generate token
    const token = generateToken();
    const expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days expiration
    const token_data = await createToken(token, user_data.id, expires_at);

    console.log('Token created:', token_data);
    if (!token_data)
        return res.status(500)
            .json({ error: 'Erreur lors de la création du token, veuillez réessayer plus tard.' })
            .end();

    res.status(200)
        .json({
            token: token_data.value,
            expires_at: token_data.expires_at,
        })
        .end();
});

// TODO: update account

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