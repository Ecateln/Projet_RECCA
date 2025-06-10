import { appendBasePromptMessage, loadConversationMessages } from "../util/functions.js";

export const name = "conversation_fetch";
export const cooldown = 250;
export const requires_login = true;

export async function run(io, socket, conversation_id) {
    if (typeof conversation_id !== "number") return;

    const conv_i = socket.user_data.conversations.findIndex(c => c.id == conversation_id);
    if (conv_i == -1) {
        socket.emit('error', { error: 'Conversation introuvable.' });
        return;
    }

    const conversation = socket.user_data.conversations[conv_i];
    if (!conversation.messages && !await loadConversationMessages(conversation)) {
        return socket.emit('error', { error: 'Erreur lors du chargement des messages de la conversation.' });
    }

    socket.user_data.current_conversation = conversation;
    appendBasePromptMessage(conversation, socket.user_data.base_prompt);

    socket.emit("conversation", socket.user_data.current_conversation.filter(m => m.role !== "system"));
}