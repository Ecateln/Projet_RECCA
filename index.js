import express from 'express';
import path from 'path';

import { createServer } from 'http';
import { Server } from 'socket.io';
import { checkAuthentication, cookieParser, generateToken, hashPassword, validatePasswordFormat, validateUsernameFormat, verifyPassword } from './util/functions.js';
import { pgp } from './util/globals.js';
import { createToken, createUser, getUserByUsername, initializeDatabase, isUsernameFree } from './util/database.js';
import { readdirSync } from 'fs';

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

const socket_events = await Promise.all(
    readdirSync(path.join(process.cwd(), 'events'))
        .filter(filename => filename.endsWith('.js'))
        .map(f => import(path.join(process.cwd(), 'events', f)))
);

socket_server.on('connection', (socket) => {
    socket.user_data = null;

    socket_events.forEach(event => {
        // TODO: cooldown handler
        socket.on(
            event.name,
            (...args) => {
                if (event.requires_login && !socket.user_data) return;
                event.run(socket_server, socket, ...args);
            },
        );
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
            .send('Invalid request body');

    const error = validateUsernameFormat(body.username) || validatePasswordFormat(body.password);
    if (error) return res.status(400).json(error);

    // Check if username already exists
    const is_free = await isUsernameFree(body.username);
    if (!is_free)
        return res.status(400)
            .json({ error: 'Un utilisateur avec ce nom d\'utilisateur existe déjà.' });

    // Hash password
    const hash = hashPassword(body.password);
    const user = await createUser(body.username, hash);

    if (!user)
        return res.status(500)
            .json({ error: 'Erreur lors de l\'inscription, veuillez réessayer plus tard.' });

    res.status(201).end();
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

    console.log('User logged in:', user_data.username);

    // Generate token
    const token = generateToken();
    const expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days expiration
    const token_data = await createToken(token, user_data.id, expires_at);

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