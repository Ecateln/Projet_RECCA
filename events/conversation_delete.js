import { deleteConversation } from '../util/database.js';

export const name = "delete_conversation";
export const cooldown = 1000;
export const requires_login = true;

export async function run(io, socket, conversation_id) {
    if (typeof conversation_id !== "number") return;

    try {
        // Delete the conversation from the database
        if (!await deleteConversation(conversation_id)) {
            socket.emit("error", { error: "Une erreur est survenue lors de la suppression de la conversation." });
            return;
        }

        // Remove the conversation from the socket's conversations list
        const conversation = socket.user_data.conversations.find(c => c.id === conversation_id);
        socket.user_data.conversations = socket.user_data.conversations.filter(c => c.id !== conversation_id);

        socket.emit("conversation_deleted", {
            id: conversation_id, 
            title: conversation.title, 
        });
    } catch (error) {
        console.error('Error deleting conversation:', error.message);
        socket.emit("error", { error: "Failed to delete conversation." });
    }
}