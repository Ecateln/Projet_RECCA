import express from 'express';
import { createServer } from 'http';
import { Server } from "socket.io";
import path from 'path';

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

socket_server.on('connection', (socket) => {
    console.log('A user connected');
    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});

const port = 8001;

app.use('/static', express.static(path.join('public')));

app.get('/', (req, res) => {
    res.status(200)
        .send("Hello World :)")
        .end();
});

app.get('/test_socket', (req, res) => {
    res.status(200)
        .send(`
<!DOCTYPE html>
<html>
<head>
    <title>Socket.IO Test</title>
</head>
<body>
    <h1>Socket.IO Test</h1>
    <p>Open your browser console to see the connection logs.</p>
    <div id="status">Connecting...</div>

    <script src="https://cdn.socket.io/4.0.1/socket.io.min.js"></script>
    <script>
        const socket = io();

        socket.on('connect', () => {
            console.log('Connected to Socket.IO server');
            document.getElementById('status').textContent = 'Connected to Socket.IO server!';
            document.getElementById('status').style.color = 'green';
        });

        socket.on('disconnect', () => {
            console.log('Disconnected from Socket.IO server');
            document.getElementById('status').textContent = 'Disconnected from Socket.IO server';
            document.getElementById('status').style.color = 'red';
        });
    </script>
</body>
</html>`)
        .end();
});

// app.all(/(.*)/, (req, res) => {
//     res.redirect("https://youtu.be/dQw4w9WgXcQ");
// });

// Start server
server.listen(
    port,
    () => console.log(`Server running on http://localhost:${port}`),
);