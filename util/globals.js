import { Ollama } from 'ollama';

process.loadEnvFile('.env');

const ollama = new Ollama({ host: process.env.OLLAMA_SERVER_URL });
export { ollama };