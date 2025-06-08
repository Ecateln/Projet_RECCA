export const name = "create_conversation";
export const cooldown = 10000;
export const requires_login = true;

export async function run(io, socket, title) {
    if (typeof title !== "string") return;
    if (socket.user_data.active_query) return socket.emit("error", { error: "Veuillez attendre la fin de la réponse avant de créer une nouvelle conversation." });

    if (socket.user_data.conversations.length == 10) {
        return socket.emit("error", { error: "Vous avez atteint le nombre maximum de conversations." });
    }

    if (title.length < 2 || title.length > 64) {
        return socket.emit("error", { error: "Le titre de la conversation doit être compris entre 2 et 64 caractères." });
    }

    // TODO: check if the user already has a conversation with the same title

    const new_conversation = await createConversation(socket.user_data.id, title);
    if (!new_conversation) {
        return socket.emit("error", { error: "Erreur lors de la création de la conversation." });
    }

    socket.user_data.conversations.push({
        id: new_conversation.id,
        title: new_conversation.title,
        created_at: new_conversation.created_at,
        last_message_at: null,
        messages: [],
    });

    socket.emit("conversation_created", new_conversation);
}