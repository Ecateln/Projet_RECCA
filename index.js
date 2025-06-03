import express from 'express';

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
const port = 8001;

app.get('/', (req, res) => {
    res.status(200)
        .send("Hello World :)")
        .end();
});

app.all(/(.*)/, (req, res) => {
    res.redirect("https://youtu.be/dQw4w9WgXcQ");
});

// Start server
app.listen(
    port,
    () => console.log(`Server running on http://localhost:${port}`),
);