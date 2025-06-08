import { addMessage } from "../util/database.js";
import { askAgent, loadConversationMessages } from "../util/functions.js";

export const name = "query";
export const cooldown = 1000;
export const requires_login = true;

export async function run(io, socket, conversation_id, prompt, enable_web = false) {
    if (typeof prompt !== "string" || typeof conversation_id != "number" || typeof enable_web != "boolean") return;
    if (socket.user_data.active_query) return socket.emit("error", { error: "Veuillez attendre la fin de la réponse avant de poser une nouvelle question." });

    // Validate prompt size
    prompt = prompt.trim();
    if (prompt.length == 0 || prompt.length > 10000) {
        return socket.emit("error", { error: "La taille du message doit être inferieure à 10000 caractères." });
    }

    // Change conversation if needed
    if (!socket.user_data.current_conversation || socket.user_data.current_conversation.id != conversation_id) {
        const conversation = socket.user_data.conversations.find(c => c.id == conversation_id);
        if (!conversation) return socket.emit("error", { error: "Conversation introuvable." });

        if (!conversation.messages && !await loadConversationMessages(conversation)) {
            return socket.emit('error', { error: 'Erreur lors du chargement des messages de la conversation.' });
        }

        socket.user_data.current_conversation = conversation;
    }

    socket.user_data.active_query = true;

    try {
        const response_stream = askAgent(prompt, socket.user_data.current_conversation.messages, false, enable_web);
        for await (const token of response_stream)
            socket.emit("res", token);

        for (const m of socket.user_data.current_conversation.messages.slice(-2)) {
            console.log(m);
            await addMessage(
                socket.user_data.current_conversation.id,
                m.role,
                m.content,
                m.created_at,
            );
        }
    } catch (error) {
        console.error("Error during query:", error);
        socket.emit("error", { error: "Une erreur est survenue lors de la réponse." });
    } finally {
        socket.user_data.active_query = false;
        socket.emit("res", null);
    }
}