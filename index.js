import express from 'express';
import { createServer } from 'http';
import { Server } from "socket.io";
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
const server = createServer();
const socket_server = new Server(server);

socket_server.on('connection', (socket) => {
    console.log('A user connected');
    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});

const port = 8001;

app.get('/', (req, res) => {
    res.status(200)
        .send("Hello World :)")
        .end();
});

app.get('/test_socket', (req, res) => {
    res.status(200)
        .send(`
<script src="https://cdn.socket.io/3.1.3/socket.io.min.js" integrity="sha384-cPwlPLvBTa3sKAgddT6krw0cJat7egBga3DJepJyrLl4Q9/5WLra3rrnMcyTyOnh" crossorigin="anonymous"></script>
<script>
const io = require("socket.io-client");
const socket = io();
</script>
<h1>Socket.IO Test</h1>
<p>Open your browser console to see the connection logs.</p>`)
        .end();
});

// app.all(/(.*)/, (req, res) => {
//     res.redirect("https://youtu.be/dQw4w9WgXcQ");
// });

// Start server
app.listen(
    port,
    () => console.log(`Server running on http://localhost:${port}`),
);