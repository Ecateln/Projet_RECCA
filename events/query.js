import { addMessage } from "../util/database.js";
import { askAgent, loadConversationMessages } from "../util/functions.js";
import { active_queries } from "../util/globals.js";

export const name = "query";
export const cooldown = 1000;
export const requires_login = true;

export async function run(io, socket, conversation_id, prompt, enable_web = false) {
    if (typeof prompt !== "string" || typeof conversation_id != "number" || typeof enable_web != "boolean") return;
    if (active_queries.has(socket.user_data.id)) return socket.emit("error", { error: "Veuillez attendre la fin de la réponse avant de poser une nouvelle question." });

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

    active_queries.add(socket.user_data.id);

    try {
        const abort_controller = new AbortController();
        socket.abort_controller = abort_controller;

        const response_stream = askAgent(prompt, socket.user_data.current_conversation.messages, false, enable_web, abort_controller);

        for await (const token of response_stream)
            socket.emit("res", token);

        for (const m of socket.user_data.current_conversation.messages.slice(-2)) {
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
        active_queries.delete(socket.user_data.id);
        socket.abort_controller = null;
        socket.emit("res", null);
    }
}