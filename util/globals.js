import { Ollama } from 'ollama';
import pgPromise from 'pg-promise';

process.loadEnvFile('.env');

// Create database instance
const pgp = pgPromise();
const db = pgp({
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT) || 5432,
    database: process.env.POSTGRES_DATABASE || 'myapp',
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || '',

    // Additional connection options
    max: 20, // Max number of connections in pool
    connectionTimeoutMillis: 2000, // Connection timeout
    idleTimeoutMillis: 30000, // Idle timeout
});

// Create Ollama instance
const ollama = new Ollama({ host: process.env.OLLAMA_SERVER_URL });

export { ollama, db, pgp };