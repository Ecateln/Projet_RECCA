import { getUserByToken, getUserConversations } from "../util/database.js";

export const name = "login";
export const cooldown = 0;
export const requires_login = false;

export async function run(io, socket, token) {
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
        ...user_data,
        conversations: conversations.map(c => ({
            id: c.id,
            title: c.title,
            created_at: c.created_at,
            last_message_at: c.last_message_at,
            messages: null,
        })),
        current_conversation: null,
    };

    socket.emit(
        'login_success',
        socket.user_data.conversations.map(({ id, title }) => ({ id, title })),
    );
}