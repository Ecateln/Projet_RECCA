let socket = null;
let currentConversation = null;
let isAuthenticated = false;
let currentResponse = '';
let sidebarRetracted = false;
let internetResearch = document.getElementById('internetToggle').checked;
let conversations = [];
let conversationCounter = 1;
let currentNotification = null;
let currentPopupClose = null; // Stockage de la fonction de fermeture de la popup
let isWelcomeDisplayed = false;
let username = null;
let base_prompt = null;

/* Fonction uniquement Front End */
// Fonction pour basculer l'état de la sidebar
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');

    if (sidebar.classList.contains('mobile-open')) {
        // Si la sidebar est ouverte en mode mobile, on la ferme
        closeMobileSidebar();
        return;
    }

    sidebarRetracted = !sidebarRetracted;

    if (sidebarRetracted) {
        sidebar.classList.add('retracted');
    } else {
        sidebar.classList.remove('retracted');
    }

    // Sauvegarder l'état dans le localStorage si disponible
    try {
        localStorage.setItem('sidebarRetracted', sidebarRetracted.toString());
    } catch (e) {
        // Ignore si localStorage n'est pas disponible
    }
}

// Fonction pour basculer la recherche sur Internet
function toggleInternetResearch() {
    internetResearch = document.getElementById('internetToggle').checked;
    console.log('Internet Research:', internetResearch);
}

// Fonction pour ajouter un message à l'interface
function addMessageToUI(message, type) {
    const messagesContainer = document.querySelector('.messages-container');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}-message`;

    if (type === 'bot') {
        // Convertir le markdown en HTML pour les messages bot
        messageDiv.innerHTML = `<div>${marked.parse(message)}</div>`;
    } else {
        // Garder le format simple pour les messages utilisateur
        messageDiv.innerHTML = `<p>${message}</p>`;
    }

    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

}

// Fonction pour faire défiler vers le bas
function scrollToBottom() {
    const messagesContainer = document.querySelector('.messages-container');
    if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}

// Fonction pour afficher le message de bienvenue
function showWelcomeMessage() {
    const messagesContainer = document.querySelector('.messages-container');

    // Ajouter la classe pour le centrage
    messagesContainer.classList.add('has-welcome');

    // Créer le message de bienvenue
    const welcomeDiv = document.createElement('div');
    welcomeDiv.className = 'bot-message welcome-message';
    welcomeDiv.id = 'welcome-message';
    welcomeDiv.innerHTML = `<p>Bonjour ${username}</p>`;

    messagesContainer.appendChild(welcomeDiv);
    isWelcomeDisplayed = true;
}

// Fonction pour supprimer le message de bienvenue
function removeWelcomeMessage() {
    const welcomeMessage = document.getElementById('welcome-message');
    const messagesContainer = document.querySelector('.messages-container');

    if (welcomeMessage) {
        welcomeMessage.remove();
        messagesContainer.classList.remove('has-welcome');
    }

    // Marquer la conversation active comme n'ayant plus le message de bienvenue
    const activeConversation = conversations.find(conv => conv.id === currentConversation);
    if (activeConversation) {
        activeConversation.hasWelcomeMessage = false;
    }

    // On n'est plus en mode bienvenue
    isWelcomeDisplayed = false;
}

// Fonction pour ouvrir la sidebar mobile
function openMobileSidebar() {
    sidebarRetracted = true;

    const sidebar = document.getElementById('sidebar');
    const overlay = document.querySelector('.mobile-overlay');

    sidebar.classList.toggle('mobile-open');
    overlay.classList.toggle('active');
}

// Fonction pour fermer la sidebar en mode mobile
function closeMobileSidebar() {

    sidebarRetracted = false;

    const sidebar = document.getElementById('sidebar');
    const overlay = document.querySelector('.mobile-overlay');

    sidebar.classList.remove('mobile-open');
    overlay.classList.remove('active');
}

// Fonction pour créer la popup des paramètres utilisateur
function createUserSettingsPopup() {
    const currentUsername = username;
    const currentPersonalization = base_prompt;

    // Créer l'overlay
    const overlay = document.createElement('div');
    overlay.className = 'popup-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        opacity: 0;
        transition: opacity 0.3s ease;
    `;

    // Créer le conteneur de la popup
    const popup = document.createElement('div');
    popup.className = 'popup-container';
    popup.style.cssText = `
        background-color: #2a2a2a;
        border-radius: 12px;
        padding: 30px;
        width: 400px;
        max-width: 90vw;
        position: relative;
        transform: scale(0.8);
        opacity: 0;
        transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        border: 1px solid #404040;
    `;

    // Créer le bouton fermer
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '×';
    closeButton.style.cssText = `
        position: absolute;
        top: 15px;
        right: 20px;
        background: none;
        border: none;
        color: white;
        font-size: 2em;
        cursor: pointer;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s ease;
        will-change: transform; 
        backface-visibility: hidden; 
        -webkit-font-smoothing: antialiased; 
    `;

    // Header
    const header = document.createElement('div');
    header.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 25px;
        gap: 15px;
    `;

    // Créer le contenu du formulaire avec les valeurs actuelles
    const content = document.createElement('div');
    content.innerHTML = `
        <form id="user-settings-form" style="margin-bottom: 20px;">
            <div id="popup-message" style="margin-bottom: 15px;"></div>
            
            <input id="username" name="username" type="text" placeholder="Nom d'utilisateur" minlength="2" maxlength="32" value="${currentUsername || ''}" style="
                width: 100%;
                padding: 12px 16px;
                background-color: #1a1a1a;
                border: 1px solid #404040;
                border-radius: 8px;
                color: white;
                font-size: 14px;
                font-family: Montserrat;
                margin-bottom: 15px;
                outline: none;
                transition: border-color 0.3s ease;
            " onfocus="this.style.borderColor='#4a9eff'" onblur="this.style.borderColor='#404040'">
            
            <input id="password" name="old_password" type="password" placeholder="Mot de passe actuel" minlength="12" maxlength="64" style="
                width: 100%;
                padding: 12px 16px;
                background-color: #1a1a1a;
                border: 1px solid #404040;
                border-radius: 8px;
                color: white;
                font-size: 14px;
                font-family: Montserrat;
                margin-bottom: 15px;
                outline: none;
                transition: border-color 0.3s ease;
            " onfocus="this.style.borderColor='#4a9eff'" onblur="this.style.borderColor='#404040'">
            
            <input id="new_password" name="password" type="password" placeholder="Nouveau mot de passe" minlength="12" maxlength="64" style="
                width: 100%;
                padding: 12px 16px;
                background-color: #1a1a1a;
                border: 1px solid #404040;
                border-radius: 8px;
                color: white;
                font-size: 14px;
                font-family: Montserrat;
                margin-bottom: 15px;
                outline: none;
                transition: border-color 0.3s ease;
            " onfocus="this.style.borderColor='#4a9eff'" onblur="this.style.borderColor='#404040'">
            
            <input id="new_password_check" type="password" placeholder="Confirmation mot de passe" minlength="12" maxlength="64" style="
                width: 100%;
                padding: 12px 16px;
                background-color: #1a1a1a;
                border: 1px solid #404040;
                border-radius: 8px;
                color: white;
                font-size: 14px;
                font-family: Montserrat;
                margin-bottom: 20px;
                outline: none;
                transition: border-color 0.3s ease;
            " onfocus="this.style.borderColor='#4a9eff'" onblur="this.style.borderColor='#404040'">
            
            <textarea id="personnalisation" name="personalization_info" placeholder="Personnaliser votre IA (ex: Je préfère des réponses courtes)" maxlength="1000" style="
                width: 100%;
                padding: 12px 12px 12px 16px; 
                background-color: #1a1a1a;
                border: 1px solid #404040;
                border-radius: 8px;
                color: white;
                font-size: 14px;
                margin-bottom: 20px;
                outline: none;
                transition: border-color 0.3s ease;
                resize: none;
                height: 120px;
                font-family: Montserrat;
            " onfocus="this.style.borderColor='#4a9eff'" onblur="this.style.borderColor='#404040'">${currentPersonalization || ''}</textarea>
            
            <button type="submit" class="animation_button" style="
                width: 100%;
                padding: 12px 20px;
                background: linear-gradient(135deg, #ff6b6b, #ffa500);
                border: none;
                border-radius: 50px;
                color: white;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                font-family: Montserrat;
            ">
                Sauvegarder
            </button>
        </form>
        <button class="deconnexion_button" style="
            width: 100%;
            padding: 12px 20px;
            background: linear-gradient(135deg, #ff6b6b,rgb(255, 52, 52));
            border: none;
            border-radius: 50px;
            color: white;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            font-family: Montserrat;
        " onclick="window.location.href='/logout';">
            Déconnexion
        </button>
    `;

    // Personnalisation du style de la scrollbar
    const customScrollbarStyle = document.createElement('style');
    customScrollbarStyle.textContent = `
        .popup-container textarea::-webkit-scrollbar {
            width: 8px;
            background: #505050;
            border-radius: 8px;
            overflow: hidden;
        }
        .popup-container textarea::-webkit-scrollbar-track {
            background: #505050;
            border-radius: 8px;
        }
        .popup-container textarea {
            scrollbar-width: thin;
            scrollbar-color: #404040 transparent;
            min-height: 120px;
        }
        .popup-container input:focus,
        .popup-container textarea:focus {
            border-color: #FF8A32 !important;
            box-shadow: 0 0 0 2px #ffa50033;
        }

        .animation_button {
            transition: all 0.3s ease;
            transform: scale(1);
            letter-spacing: 1px;
            will-change: transform; 
            backface-visibility: hidden; 
            -webkit-font-smoothing: antialiased; 
        }  

        .animation_button:hover {
            transform: translateY(-2px) !important;
            box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3) !important;
            background: linear-gradient(135deg,rgb(255, 113, 113),rgb(252, 174, 40)) !important;
        }

        .animation_button:active {
            transform: scale(0.98) !important; 
            transition: all 0.1s ease !important; 
        }

        .deconnexion_button {
            transition: all 0.3s ease;
            transform: scale(1);
            letter-spacing: 1px;
            will-change: transform; 
            backface-visibility: hidden; 
            -webkit-font-smoothing: antialiased; 
        }

        .deconnexion_button:hover {
            transform: translateY(-2px) !important;
            box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3) !important;
            background: linear-gradient(135deg,rgb(255, 107, 107),rgb(255, 73, 73)) !important;
        }

        .deconnexion_button:active {
            transform: scale(0.98) !important; 
            transition: all 0.1s ease !important; 
        }
    `;
    document.head.appendChild(customScrollbarStyle);

    // Fonction de fermeture
    function closePopup() {
        popup.style.transition = 'all 0.2s ease-out';
        overlay.style.transition = 'opacity 0.2s ease-out';

        popup.style.transform = 'scale(0.8)';
        popup.style.opacity = '0';
        overlay.style.opacity = '0';

        setTimeout(() => {
            if (document.body.contains(overlay)) {
                document.body.removeChild(overlay);
            }
        }, 250);
    }

    currentPopupClose = closePopup;

    // Assembler la popup
    popup.appendChild(closeButton);
    popup.appendChild(header);
    popup.appendChild(content);
    popup.appendChild(customScrollbarStyle);
    overlay.appendChild(popup);

    // Ajouter les événements
    closeButton.addEventListener('click', closePopup);
    closeButton.addEventListener('mouseenter', () => {
        closeButton.style.transform = 'scale(1.1)';
    });
    closeButton.addEventListener('mouseleave', () => {
        closeButton.style.transform = 'scale(1)';
    });

    overlay.addEventListener('mousedown', (e) => {
        if (e.target === overlay) {
            closePopup();
        }
    });

    // Add form event listener
    const form = popup.querySelector('#user-settings-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            saveUserSettings();
        });
    }

    // Ajouter à la page
    document.body.appendChild(overlay);

    // Déclencher l'animation
    setTimeout(() => {
        overlay.style.opacity = '1';
        popup.style.transform = 'scale(1)';
        popup.style.opacity = '1';
    }, 10);
}

// Function to show the success notification
function showSuccessNotification() {
    // Remove the current notification if it exists
    if (currentNotification && document.body.contains(currentNotification)) {
        document.body.removeChild(currentNotification);
        currentNotification = null;
    }

    // Create notification container
    const notification = document.createElement('div');
    notification.className = 'success-notification';
    notification.style.cssText = `
        position: fixed;
        top: -100px;
        left: 20px;
        background-color: #2a2a2a;
        border-left: 4px solid rgb(92, 255, 63);
        border-radius: 8px;
        padding: 15px 20px;
        margin-right: 20px;
        max-width: 400px;
        width: auto;
        color: white;
        font-family: Montserrat, sans-serif;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        z-index: 1000;
        opacity: 0;
        transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        display: flex;
        align-items: center;
        justify-content: space-between;
    `;

    // Set current notification reference
    currentNotification = notification;

    // Create message content
    const messageElement = document.createElement('span');
    messageElement.style.cssText = `
        font-size: 0.95em;
        color: white;
        margin-right: 15px;
        line-height: 1.3;
    `;
    messageElement.textContent = "Vos informations ont été modifiées avec succès !";

    // Create close button
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '×';
    closeButton.style.cssText = `
        background: none;
        border: none;
        color: white;
        font-size: 1.5em;
        cursor: pointer;
        width: 25px;
        height: 25px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s ease;
        flex-shrink: 0;
    `;

    // Assemble notification
    notification.appendChild(messageElement);
    notification.appendChild(closeButton);

    // Close function with slide-up animation
    function closeNotification() {
        if (notification && document.body.contains(notification)) {
            notification.style.top = '-100px';
            notification.style.opacity = '0';

            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
                // Reset current notification reference
                if (currentNotification === notification) {
                    currentNotification = null;
                }
            }, 400);
        }
    }

    // Add event listeners
    closeButton.addEventListener('click', closeNotification);
    closeButton.addEventListener('mouseenter', () => {
        closeButton.style.transform = 'scale(1.1)';
    });
    closeButton.addEventListener('mouseleave', () => {
        closeButton.style.transform = 'scale(1)';
    });

    // Auto-close after 5 seconds
    const autoCloseTimeout = setTimeout(closeNotification, 5000);

    // Add to page
    document.body.appendChild(notification);

    // Trigger slide-down animation
    setTimeout(() => {
        if (notification && document.body.contains(notification)) {
            notification.style.top = '20px';
            notification.style.opacity = '1';
        }
    }, 10);
}

// Function to create an error notification
function createErrorNotification(message = "Une erreur est survenue") {
    // Remove the current notification if it exists
    if (currentNotification && document.body.contains(currentNotification)) {
        document.body.removeChild(currentNotification);
        currentNotification = null;
    }

    // Create notification container
    const notification = document.createElement('div');
    notification.className = 'error-notification';
    notification.style.cssText = `
        position: fixed;
        top: -100px;
        left: 20px;
        background-color: #2a2a2a;
        border-left: 4px solid #FF4C4C;
        border-radius: 8px;
        padding: 15px 20px;
        max-width: 400px;
        width: auto;
        color: white;
        font-family: Montserrat, sans-serif;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        z-index: 1000;
        opacity: 0;
        transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        display: flex;
        align-items: center;
        justify-content: space-between;
    `;

    // Set current notification reference
    currentNotification = notification;

    // Create message content
    const messageElement = document.createElement('span');
    messageElement.style.cssText = `
        font-size: 0.95em;
        color: #FF4C4C;
        margin-right: 15px;
        line-height: 1.3;
    `;
    messageElement.textContent = message;

    // Create close button
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '×';
    closeButton.style.cssText = `
        background: none;
        border: none;
        color: #FF4C4C;
        font-size: 1.5em;
        cursor: pointer;
        width: 25px;
        height: 25px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s ease;
        flex-shrink: 0;
    `;

    // Assemble notification
    notification.appendChild(messageElement);
    notification.appendChild(closeButton);

    // Close function with slide-up animation
    function closeNotification() {
        if (notification && document.body.contains(notification)) {
            notification.style.top = '-100px';
            notification.style.opacity = '0';

            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
                // Reset current notification reference
                if (currentNotification === notification) {
                    currentNotification = null;
                }
            }, 400);
        }
    }

    // Add event listeners
    closeButton.addEventListener('click', closeNotification);
    closeButton.addEventListener('mouseenter', () => {
        closeButton.style.transform = 'scale(1.1)';
    });
    closeButton.addEventListener('mouseleave', () => {
        closeButton.style.transform = 'scale(1)';
    });

    // Auto-close after 5 seconds
    const autoCloseTimeout = setTimeout(closeNotification, 5000);

    // Add to page
    document.body.appendChild(notification);

    // Trigger slide-down animation
    setTimeout(() => {
        if (notification && document.body.contains(notification)) {
            notification.style.top = '20px';
            notification.style.opacity = '1';
        }
    }, 10);
}


// Fonction pour vider le conteneur de messages
function clearMessagesContainer() {
    const messagesContainer = document.querySelector('.messages-container');
    messagesContainer.innerHTML = '';
    // Supprimer la classe de centrage
    messagesContainer.classList.remove('has-welcome');
}

// Fonction pour mettre à jour le message en streaming
function updateStreamingMessage() {
    const messagesContainer = document.querySelector('.messages-container');
    let streamingEl = messagesContainer.querySelector('.streaming-message');

    if (!streamingEl) {
        streamingEl = document.createElement('div');
        streamingEl.className = 'message bot-message streaming-message';
        messagesContainer.appendChild(streamingEl);
    }

    // Add cursor to the response text before parsing
    const responseWithCursor = currentResponse + '<span style="animation: blink 1s infinite; display: inline;">|</span>';
    
    // Parse the markdown content with cursor included
    streamingEl.innerHTML = marked.parse(responseWithCursor);
    
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Fonction pour supprimer le message en streaming
function removeStreamingMessage() {
    const messagesContainer = document.querySelector('.messages-container');
    const streamingEl = messagesContainer.querySelector('.streaming-message');
    if (streamingEl) {
        streamingEl.remove();
    }
}

// Fonction pour charger les messages d'une conversation
async function loadConversationMessages(conversation) {
    const messagesContainer = document.querySelector('.messages-container');
    messagesContainer.innerHTML = '';

    // Supprimer la classe de centrage par défaut
    messagesContainer.classList.remove('has-welcome');

    // Update current conversation
    currentConversation = conversation.id;
    updateConversationsList();

    // Charger tous les messages de la conversation
    if (conversation.messages && conversation.messages.length > 0) {
        conversation.messages.forEach(message => {
            addMessageToUI(message.content, message.role === 'user' ? 'user' : 'bot');
        });
    } else showWelcomeMessage();

    scrollToBottom();
}

function toggleInput(value) {
    const input = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-btn');
    if (input) input.disabled = value;
    if (sendBtn) sendBtn.disabled = value;
}

// ------------------------------------------------------------
/* */

// Initialize socket connection
function initSocket() {
    socket = io();

    socket.on('connect', () => {
        console.log('Connected to server');
        const token = document.cookie.match(/token=([^;]+)/);
        if (token) {
            socket.emit('login', token[1]);
        }
    });

    socket.on('disconnect', () => {
        console.log('Disconnected from server');
        isAuthenticated = false;
        // Handle disconnect (optionally show notification)
    });

    socket.on('login_success', (conversation_data, user_data) => {
        console.log('Login successful');
        console.log(conversation_data);
        isAuthenticated = true;

        conversations = conversation_data;
        username = user_data.username;
        base_prompt = user_data.personalization_info;

        updateConversationsList();

        // If no conversations exist or no current conversation, show welcome message
        if (conversations.length === 0 || !currentConversation) {
            showWelcomeMessage();
        }
    });

    socket.on('conversation', (conversation) => {
        console.log('Received conversation:', conversation.title);
        currentConversation = conversation;
        loadConversationMessages(conversation);

        // Close the sidebar if we are on mobile
        if(window.innerWidth < 600) {
            closeMobileSidebar();
        }
    });

    socket.on('res', (token) => {
        if (token === null) {
            // End of response
            console.log('Response complete');
            if (currentResponse.trim()) {
                // Remove streaming message and add final message
                removeStreamingMessage();
                addMessageToUI(currentResponse, 'bot');
                currentResponse = '';
            }

            // Re-enable send button after response is complete
            toggleInput(false);
        } else {
            // Streaming token
            currentResponse += token;
            updateStreamingMessage();
        }
    });

    socket.on('conversation_created', (conversation) => {
        conversations.unshift(conversation);
        console.log('New conversation created:', conversation.title);
        updateConversationsList();
        selectConversation(conversation.id);

        // Check if there's a pending message to send
        const pendingMessage = sessionStorage.getItem('pendingMessage');
        if (pendingMessage) {
            sessionStorage.removeItem('pendingMessage');

            // Wait a bit for the conversation to be fully set up, then send the message
            setTimeout(() => {
                const input = document.getElementById('message-input');
                input.value = pendingMessage;
                sendMessage();
            }, 100);
        }
    });

    socket.on('conversation_deleted', (data) => {
        console.log('Conversation deleted:', data.title);
        conversations = conversations.filter(conv => conv.id !== data.id);
        updateConversationsList();

        // If the deleted conversation was the current one, clear the chat
        if (currentConversation && currentConversation.id === data.id) {
            currentConversation = null;
            clearMessagesContainer();
            showWelcomeMessage();
        }
    });

    socket.on('conversation_renamed', (data) => {
        console.log('Conversation renamed to:', data.title);
        const conversation = conversations.find(conv => conv.id === data.id);
        if (conversation) {
            conversation.title = data.title;
            updateConversationsList();

            // Update current conversation title if it's the one being renamed
            if (currentConversation && currentConversation.id === data.id) {
                currentConversation.title = data.title;
            }
        }
    });

    socket.on('error', (data) => {
        if (data.redirect) window.location.href = data.redirect;

        console.error('Socket error:', data.error);
        createErrorNotification(data.error);
    });

    // User update event handlers
    socket.on('user_updated', (data) => {
        console.log('User updated successfully');

        username = data.username || username;
        base_prompt = data.personalization_info || base_prompt;

        showSuccessNotification();
        if (currentPopupClose) {
            currentPopupClose();
        }
    });
}

// Fonction pour sauvegarder les paramètres utilisateur
function saveUserSettings() {
    const usernameInput = document.getElementById('username').value.trim();
    const currentPasswordInput = document.getElementById('password').value.trim();
    const newPasswordInput = document.getElementById('new_password').value.trim();
    const confirmPasswordInput = document.getElementById('new_password_check').value.trim();
    const personalizationInput = document.getElementById('personnalisation').value.trim();

    const updates = {};

    // Only include fields that have values
    if (usernameInput) updates.username = usernameInput;
    if (newPasswordInput) {
        if (!currentPasswordInput) {
            createErrorNotification('L\'ancien mot de passe est requis pour changer le mot de passe.');
            return;
        }
        if (newPasswordInput !== confirmPasswordInput) {
            createErrorNotification('Les nouveaux mots de passe ne correspondent pas.');
            return;
        }
        updates.password = newPasswordInput;
        updates.old_password = currentPasswordInput;
    }
    if (personalizationInput !== undefined) updates.personalization_info = personalizationInput;

    // Check if at least one field is filled
    if (Object.keys(updates).length === 0) {
        createErrorNotification('Veuillez remplir au moins un champ à mettre à jour.');
        return;
    }

    console.log('Updating user settings');
    socket.emit('user_update', updates);
}

// Fonction pour envoyer un message
function sendMessage() {
    const input = document.getElementById('message-input');
    const message = input.value.trim();

    if (!message) return;

    // Si on n'est pas dans une conversation, en créer une nouvelle
    if (!currentConversation) {
        // Create new conversation via socket
        console.log('Creating new conversation for message');
        socket.emit('conversation_create', 'Nouveau chat');

        // Store the message to send after conversation is created
        sessionStorage.setItem('pendingMessage', message);
        input.value = '';

        toggleInput(true);
        return;
    }

    // Clear any existing streaming message before sending new message
    removeStreamingMessage();

    console.log('Sending query:', message + (internetResearch ? ' (with web search)' : ''));
    socket.emit('query', currentConversation, message, internetResearch);

    // Supprimer le message de bienvenue s'il existe
    removeWelcomeMessage();

    // Ajouter le message à l'interface
    addMessageToUI(message, 'user');
    input.value = '';
    currentResponse = '';

    // Disable send button during response
    toggleInput(true);
}

// Fonction pour créer une nouvelle conversation à partir d'un message
function createNewConversationFromMessage() {
    const newConversation = {
        id: Date.now(),
        title: `Conversation ${conversationCounter}`,
        messages: [],
        isActive: true,
        hasWelcomeMessage: false // Pas de message de bienvenue car on va directement ajouter un message
    };

    // Désactiver toutes les autres conversations
    conversations.forEach(conv => conv.isActive = false);

    // Ajouter en début de liste
    conversations.unshift(newConversation);
    conversationCounter++;

    // Mettre à jour la conversation courante
    currentConversation = newConversation.id;

    // Mettre à jour l'affichage
    updateConversationsList();

    console.log('Nouvelle conversation créée depuis un message:', newConversation);
}

// Fonction pour créer une nouvelle conversation
function createNewConversation() {
    console.log('Creating new conversation via socket');
    socket.emit('conversation_create', 'Nouveau chat');
}

// Fonction pour mettre à jour la liste des conversations
function updateConversationsList() {
    const conversationList = document.getElementById('conversation-list');

    // Vider la liste actuelle
    conversationList.innerHTML = '';

    // Ajouter chaque conversation
    conversations.forEach(conversation => {
        const conversationItem = document.createElement('div');
        conversationItem.className = `conversation-item-wrapper ${conversation.id === currentConversation ? 'active' : ''}`;

        conversationItem.innerHTML = `
            <button class="conversation-item ${conversation.id === currentConversation ? 'active' : ''}" onclick="selectConversation(${conversation.id})">
                <span class="conversation-title">${conversation.title}</span>
            </button>
            <button class="edit-conversation-btn" onclick="editConversationTitle(${conversation.id}, event)" title="Renommer la conversation">
                <svg xmlns="http://www.w3.org/2000/svg" height="16px" viewBox="0 -960 960 960" width="16px" fill="#e3e3e3">
                    <path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z"/>
                </svg>
            </button>
            <button class="delete-conversation-btn" onclick="deleteConversation(${conversation.id}, event)" title="Supprimer la conversation">
                <svg xmlns="http://www.w3.org/2000/svg" height="16px" viewBox="0 -960 960 960" width="16px" fill="#e3e3e3">
                    <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/>
                </svg>
            </button>
        `;

        conversationList.appendChild(conversationItem);
    });

    if (conversations.length === 0) {
        const noConversations = document.createElement('div');
        noConversations.style.color = '#666';
        noConversations.style.fontStyle = 'italic';
        noConversations.textContent = 'Aucune conversation pour le moment';
        conversationList.appendChild(noConversations);
    }
}

// Fonction pour éditer le titre d'une conversation (VERSION MODAL STYLÉE)
function editConversationTitle(conversationId, event) {
    // Empêcher la propagation de l'événement
    event.stopPropagation();
    event.preventDefault();

    // Trouver la conversation
    const conversation = conversations.find(conv => conv.id === conversationId);
    if (!conversation) return;

    // Créer l'overlay
    const overlay = document.createElement('div');
    overlay.className = 'popup-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        opacity: 0;
        transition: opacity 0.3s ease;
    `;

    // Créer le conteneur de la popup
    const popup = document.createElement('div');
    popup.className = 'popup-container';
    popup.style.cssText = `
        background-color: #2a2a2a;
        border-radius: 12px;
        padding: 30px;
        width: 400px;
        max-width: 90vw;
        position: relative;
        transform: scale(0.8);
        opacity: 0;
        transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        border: 1px solid #404040;
    `;

    // Créer le bouton fermer
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '×';
    closeButton.style.cssText = `
        position: absolute;
        top: 15px;
        right: 20px;
        background: none;
        border: none;
        color: white;
        font-size: 2em;
        cursor: pointer;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s ease;
    `;

    const header = document.createElement('div');
    header.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 25px;
        gap: 15px;
    `;



    // Créer le contenu du formulaire
    const content = document.createElement('div');
    content.innerHTML = `
        <div style="margin-bottom: 20px;">
            <input type="text" id="edit-title-input" placeholder="Nom de la conversation" value="${conversation.title}" style="
                width: 100%;
                padding: 12px 16px;
                background-color: #1a1a1a;
                border: 1px solid #404040;
                border-radius: 8px;
                color: white;
                font-size: 14px;
                margin-bottom: 20px;
                outline: none;
                transition: border-color 0.3s ease;
                font-family: Montserrat;
            " onfocus="this.style.borderColor='#FF8A32'; this.style.boxShadow='0 0 0 2px #ffa50033'" onblur="this.style.borderColor='#404040'; this.style.boxShadow='none'">
            
            <button id="save-title-btn" style="
                width: 100%;
                padding: 12px 20px;
                background: linear-gradient(45deg, #ff6b6b, #ffa500);
                border: none;
                border-radius: 50px;
                color: white;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                font-family: Montserrat;
            " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 15px rgba(255, 107, 107, 0.3)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
                Sauvegarder
            </button>
        </div>
    `;

    // Fonction de fermeture (annulation)
    function closePopup() {
        popup.style.transition = 'all 0.2s ease-out';
        overlay.style.transition = 'opacity 0.2s ease-out';

        popup.style.transform = 'scale(0.8)';
        popup.style.opacity = '0';
        overlay.style.opacity = '0';

        setTimeout(() => {
            if (document.body.contains(overlay)) {
                document.body.removeChild(overlay);
            }
        }, 250);

        console.log('Édition annulée');
    }

    // Fonction pour sauvegarder
    function save() {
        const input = document.getElementById('edit-title-input');
        const newTitle = input.value.trim();

        if (newTitle && newTitle !== conversation.title) {
            console.log('Renaming conversation:', conversation.title, 'to', newTitle);
            socket.emit('rename_conversation', conversationId, newTitle);
        }

        closePopup();
    }

    // Assembler la popup
    popup.appendChild(closeButton);
    popup.appendChild(header);
    popup.appendChild(content);
    overlay.appendChild(popup);

    // Ajouter les événements
    closeButton.addEventListener('click', closePopup);
    closeButton.addEventListener('mouseenter', () => {
        closeButton.style.transform = 'scale(1.1)';
    });
    closeButton.addEventListener('mouseleave', () => {
        closeButton.style.transform = 'scale(1)';
    });

    // Fermer en cliquant en dehors (annulation)
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closePopup();
        }
    });

    // Ajouter à la page
    document.body.appendChild(overlay);

    // Déclencher l'animation
    setTimeout(() => {
        overlay.style.opacity = '1';
        popup.style.transform = 'scale(1)';
        popup.style.opacity = '1';

        // Focus et sélection après l'animation
        setTimeout(() => {
            const input = document.getElementById('edit-title-input');
            input.select();
            input.focus();
        }, 100);
    }, 10);

    // Ajouter les événements après l'ajout au DOM
    setTimeout(() => {
        const input = document.getElementById('edit-title-input');
        const saveBtn = document.getElementById('save-title-btn');

        saveBtn.addEventListener('click', save);

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                save();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                closePopup();
            }
        });
    }, 50);
}

// Fonction pour supprimer une conversation
function deleteConversation(conversationId, event) {
    event.stopPropagation();

    const conversation = conversations.find(conv => conv.id === conversationId);
    if (!conversation) return;

    // Si la conversation courante est supprimée, réinitialiser currentConversation
    if (currentConversation === conversationId) {
        currentConversation = null;
        clearMessagesContainer();
        showWelcomeMessage();
    }

    // if (confirm(`Êtes-vous sûr de vouloir supprimer la conversation "${conversation.title}" ?`)) {
    console.log('Deleting conversation:', conversation.title);
    socket.emit('delete_conversation', conversationId);
    // }
}

// Fonction pour sélectionner une conversation
function selectConversation(conversationId) {
    console.log('Requesting conversation:', conversationId);
    socket.emit('conversation_fetch', conversationId);
}

// Add CSS for blinking cursor
const style = document.createElement('style');
style.textContent = `
    @keyframes blink {
        0%, 50% { opacity: 1; }
        51%, 100% { opacity: 0; }
    }
`;
document.head.appendChild(style);


// Afficher le bouton menu sur mobile
window.addEventListener('resize', function () {
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    if (window.innerWidth <= 600) {
        mobileBtn.style.display = 'flex';
    } else {
        mobileBtn.style.display = 'none';
        closeMobileSidebar();
    }
});

// Initialiser l'affichage au chargement
document.addEventListener('DOMContentLoaded', function () {
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    if (window.innerWidth <= 600) {
        mobileBtn.style.display = 'flex';
    }
});

// Fonction pour envoyer un message avec la touche Entrée
document.addEventListener('DOMContentLoaded', function () {
    const messageInput = document.getElementById('message-input');

    if (messageInput) {
        messageInput.addEventListener('keydown', function (event) {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault(); // Empêche le saut de ligne
                sendMessage();
            }
        });
    }
});


// Initialize when page loads
window.addEventListener('load', function () {
    scrollToBottom();

    // Initialize socket connection
    initSocket();
});
