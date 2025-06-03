const express = require('express');

const app = express();
const port = 8001;

app.get('/', (req, res) => {
    res.status(200)
        .send("Hello World :)")
        .end();
});

app.all('*', (req, res) => {
    res.redirect("https://youtu.be/dQw4w9WgXcQ");
});

// Start server
app.listen(
    port,
    () => console.log(`Server running on http://localhost:${port}`),
);