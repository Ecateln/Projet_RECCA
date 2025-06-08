import { updateUser, isUsernameFree, getUserById } from '../util/database.js';
import { hashPassword, validatePasswordFormat, validateUsernameFormat, verifyPassword } from '../util/functions.js';

export const name = "user_update";
export const cooldown = 5000;
export const requires_login = true;

export async function run(io, socket, updates) {
    if (!updates || typeof updates !== "object") return;

    const { username, old_password, password, personalization_info } = updates;

    // Validate username if provided
    if (username !== undefined) {
        const error = validateUsernameFormat(username);
        if (error) return socket.emit("error", error);

        // Check if username is already taken (but not by current user)
        // We need to get current user's username first to avoid conflict with their own username
        const currentUser = await getUserById(socket.user_data.id);
        if (currentUser && currentUser.username !== username) {
            const isAvailable = await isUsernameFree(username);
            if (!isAvailable) {
                return socket.emit("error", { error: "Ce nom d'utilisateur est déjà pris." });
            }
        }
    }

    // Validate password if provided
    if (password !== undefined) {
        const error = validatePasswordFormat(password);
        if (error) return socket.emit("error", error);

        if (!verifyPassword(old_password, socket.user_data.password_hash)) {
            return socket.emit("error", { error: "L'ancien mot de passe est incorrect." });
        }
    }

    // Validate personalization_info if provided
    if (personalization_info !== undefined) {
        if (typeof personalization_info !== "string") {
            return socket.emit("error", { error: "Les informations de personnalisation doivent être une chaîne de caractères." });
        }

        if (personalization_info.length > 1024) {
            return socket.emit("error", { error: "Les informations de personnalisation ne peuvent pas dépasser 1024 caractères." });
        }
    }

    try {
        // Prepare the updates object for database
        const dbUpdates = {};

        if (username) dbUpdates.username = username;
        if (password) dbUpdates.password_hash = hashPassword(password);
        if (personalization_info) dbUpdates.personalization_info = personalization_info;

        // Update user in the database
        const updatedUserId = await updateUser(socket.user_data.id, dbUpdates);
        if (!updatedUserId) {
            return socket.emit("error", { error: "Une erreur est survenue lors de la mise à jour des informations utilisateur." });
        }

        // Prepare response data (excluding sensitive information)
        const responseData = {
            id: socket.user_data.id,
            success: true,
            message: "Informations utilisateur mises à jour avec succès."
        };

        // Include updated fields in response (excluding password)
        if (username) responseData.username = username;
        if (personalization_info) responseData.personalization_info = personalization_info;

        socket.emit("user_updated", responseData);
    } catch (error) {
        console.error('Error updating user:', error.message);
        socket.emit("error", { error: "Une erreur est survenue lors de la mise à jour des informations utilisateur." });
    }
}
