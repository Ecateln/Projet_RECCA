import { renameConversation } from '../util/database.js';

export const name = "rename_conversation";
export const cooldown = 1000;
export const requires_login = true;

export async function run(io, socket, conversation_id, new_title) {
    if (typeof conversation_id !== "number" || typeof new_title !== "string") return;

    if (new_title.length < 2 || new_title.length > 64) {
        return socket.emit("error", { error: "Le titre de la conversation doit être compris entre 2 et 64 caractères." });
    }

    try {
        // Rename the conversation in the database
        if (!await renameConversation(conversation_id, new_title)) {
            return socket.emit("error", { error: "Une erreur est survenue lors du renommage de la conversation." });
        }

        // Update the conversation in the socket's conversations list
        const conversation = socket.user_data.conversations.find(c => c.id === conversation_id);
        if (conversation) conversation.title = new_title;

        socket.emit("conversation_renamed", {
            id: conversation_id,
            title: new_title,
        });
    } catch (error) {
        console.error('Error renaming conversation:', error.message);
        socket.emit("error", { error: "Une erreur est survenue lors du renommage de la conversation." });
    }
}
