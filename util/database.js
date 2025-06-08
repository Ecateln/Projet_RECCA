import { db } from './globals.js';

// INITIALIZE DATABASE (create all tables)
async function initializeDatabase() {
    try {
        await db.none(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(32) UNIQUE NOT NULL,
                password_hash VARCHAR(1024) NOT NULL,
                personalization_info VARCHAR(1024) DEFAULT '' NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await db.none(`
            CREATE TABLE IF NOT EXISTS conversations (
                id SERIAL PRIMARY KEY,
                author_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                title VARCHAR(64) DEFAULT 'Nouvelle Conversation' NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await db.none(`
            CREATE TABLE IF NOT EXISTS messages (
                id SERIAL PRIMARY KEY,
                conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
                role VARCHAR(10) NOT NULL CHECK (role IN ('user', 'system', 'assistant')),
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await db.none(`
            CREATE TABLE IF NOT EXISTS tokens (
                value TEXT PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                expires_at TIMESTAMP NOT NULL
            )
        `);

        // Create trigger function to clean up expired tokens
        await db.none(`
            CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
            RETURNS TRIGGER AS $$
            BEGIN
                -- Delete expired tokens (older than current timestamp)
                DELETE FROM tokens WHERE expires_at < CURRENT_TIMESTAMP;

                -- Log the cleanup (optional)
                RAISE NOTICE 'Expired tokens cleanup executed. Deleted % tokens.', 
                    (SELECT COUNT(*) FROM tokens WHERE expires_at < CURRENT_TIMESTAMP);

                -- Return the new row (for INSERT/UPDATE triggers)
                RETURN COALESCE(NEW, OLD);
            END;
            $$ LANGUAGE plpgsql;
        `);

        // Create trigger that runs on INSERT to tokens table
        await db.none(`
            DROP TRIGGER IF EXISTS trigger_cleanup_expired_tokens_on_insert ON tokens;
            CREATE TRIGGER trigger_cleanup_expired_tokens_on_insert
                AFTER INSERT ON tokens
                FOR EACH STATEMENT
                EXECUTE FUNCTION cleanup_expired_tokens();
        `);
    } catch (error) {
        console.error('Error during database initialization:', error.message);
        process.exit(1);
    }

    console.log('Database initialization complete!');
}

// INSERT USER
async function createUser(username, passwordHash) {
    try {
        const user = await db.one(`
            INSERT INTO users (username, password_hash)
            VALUES ($1, $2)
            RETURNING id, username, created_at
        `, [username, passwordHash]);
        return user;
    } catch (error) {
        console.error('Error creating user:', error.message);
    }
}

// INSERT TOKEN
async function createToken(value, userId, expiresAt) {
    try {
        const token = await db.one(`
            INSERT INTO tokens (value, user_id, expires_at)
            VALUES ($1, $2, $3)
            RETURNING value, user_id, expires_at
        `, [value, userId, expiresAt]);
        return token;
    } catch (error) {
        console.error('Error creating token:', error.message);
    }
}

// GET USER BY ID
async function getUserById(userId) {
    try {
        const user = await db.oneOrNone(`
            SELECT id, username, password_hash, personalization_info, created_at
            FROM users
            WHERE id = $1
        `, [userId]);
        return user;
    } catch (error) {
        console.error('Error getting user:', error.message);
    }
}

// GET USER BY USERNAME
async function getUserByUsername(username) {
    try {
        const user = await db.oneOrNone(`
            SELECT id, username, password_hash, personalization_info, created_at
            FROM users
            WHERE username = $1
        `, [username]);
        return user;
    } catch (error) {
        console.error('Error getting user by username:', error.message);
    }
}

// GET USER BY TOKEN
async function getUserByToken(token) {
    try {
        const user = await db.oneOrNone(`
            SELECT u.id, u.username, u.personalization_info
            FROM tokens t
            JOIN users u ON t.user_id = u.id
            WHERE t.value = $1 AND t.expires_at > CURRENT_TIMESTAMP
        `, [token]);
        return user;
    } catch (error) {
        console.error('Error getting user by token:', error.message);
    }
}

// CHECK IF USERNAME EXISTS
async function isUsernameFree(username) {
    try {
        const user = await db.oneOrNone(`
            SELECT id
            FROM users
            WHERE username = $1
        `, [username]);
        return !user;
    } catch (error) {
        console.error('Error getting user by username:', error.message);
    }
}

// CREATE CONVERSATION
async function createConversation(userId, title) {
    try {
        const conversation = await db.one(`
            INSERT INTO conversations (author_id, title)
            VALUES ($1, $2)
            RETURNING id, title, created_at
        `, [userId, title]);
        console.log('Conversation created:', conversation);
        return conversation;
    } catch (error) {
        console.error('Error creating conversation:', error.message);
        throw error;
    }
}

// GET USER CONVERSATIONS
async function getUserConversations(userId) {
    try {
        const conversations = await db.any(`
            SELECT id, title, created_at, last_message_at
            FROM conversations
            WHERE author_id = $1
            ORDER BY last_message_at DESC
        `, [userId]);
        return conversations;
    } catch (error) {
        console.error('Error getting user conversations:', error.message);
        throw error;
    }
}

// ADD MESSAGE TO CONVERSATION
async function addMessage(conversationId, role, content, createdAt) {
    try {
        const message = await db.one(`
            INSERT INTO messages (conversation_id, role, content, created_at)
            VALUES ($1, $2, $3, $4)
            RETURNING id, role, content, created_at
        `, [conversationId, role, content, createdAt]);

        // Update conversation's last_message_at timestamp
        await db.none(
            'UPDATE conversations SET last_message_at = CURRENT_TIMESTAMP WHERE id = $1',
            [conversationId]
        );

        return message;
    } catch (error) {
        console.error('Error adding message:', error.message);
        throw error;
    }
}

// GET CONVERSATION MESSAGES
async function getConversationMessages(conversationId) {
    try {
        const messages = await db.any(`
            SELECT id, role, content, created_at
            FROM messages
            WHERE conversation_id = $1
            ORDER BY created_at ASC
        `, [conversationId]);
        return messages;
    } catch (error) {
        console.error('Error getting conversation messages:', error.message);
        throw error;
    }
}

// GET FULL CONVERSATION WITH MESSAGES
async function getFullConversation(conversationId) {
    try {
        const conversation = await db.oneOrNone(`
            SELECT c.id, c.title, c.created_at, c.last_message_at, COALESCE(
                JSON_AGG(
                    JSON_BUILD_OBJECT(
                        'id', m.id,
                        'role', m.role,
                        'content', m.content,
                        'date', EXTRACT(EPOCH FROM m.created_at) * 1000
                    ) ORDER BY m.created_at
                ) FILTER (WHERE m.id IS NOT NULL),
                '[]'::json
            ) as messages
            FROM conversations c
            LEFT JOIN messages m ON c.id = m.conversation_id
            WHERE c.id = $1
            GROUP BY c.id, c.title, c.created_at, c.last_message_at
        `, [conversationId]);
        return conversation;
    } catch (error) {
        console.error('Error getting full conversation:', error.message);
    }
}

async function isTokenValid(token) {
    try {
        const result = await db.oneOrNone(`
            SELECT user_id
            FROM tokens
            WHERE value = $1 AND expires_at > CURRENT_TIMESTAMP
        `, [token]);
        return result != null;
    } catch (error) {
        console.error('Error validating token:', error.message);
        return null;
    }
}

// DELETE CONVERSATION
async function deleteConversation(conversationId) {
    try {
        const result = await db.result(`
            DELETE FROM conversations
            WHERE id = $1
        `, [conversationId]);

        if (result.rowCount == 0) return null;
        return conversationId;
    } catch (error) {
        console.error('Error deleting conversation:', error.message);
        return null;
    }
}

export {
    initializeDatabase,
    createUser,
    createToken,
    createConversation,
    getUserById,
    getUserByUsername,
    getUserConversations,
    isUsernameFree,
    addMessage,
    getConversationMessages,
    getFullConversation,
    getUserByToken,
    isTokenValid,
    deleteConversation,
};
