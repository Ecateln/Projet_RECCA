let socket = null;
let currentConversation = null;
let isAuthenticated = false;
let currentResponse = '';
let sidebarRetracted = false;
let internetResearch = false;
let conversations = [];
let conversationCounter = 1;
let currentNotification = null; 
let currentPopupClose = null; // Stockage de la fonction de fermeture de la popup

/* Fonction uniquement Front End */
// Fonction pour basculer l'état de la sidebar
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');

    if( sidebar.classList.contains('mobile-open')) {
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
    internetResearch = !internetResearch;
    console.log('Internet Research:', internetResearch);
}

// Restaurer l'état de la sidebar au chargement
function restoreSidebarState() {
    try {
        const saved = localStorage.getItem('sidebarRetracted');
        if (saved === 'true') {
            sidebarRetracted = true;
            const sidebar = document.getElementById('sidebar');
            sidebar.classList.add('retracted');
        }
    } catch (e) {
        // Ignore si localStorage n'est pas disponible
    }
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
    welcomeDiv.className = 'message bot-message welcome-message';
    welcomeDiv.id = 'welcome-message';
    welcomeDiv.innerHTML = `<p>Bonjour Coco </p>`;
    
    messagesContainer.appendChild(welcomeDiv);
}

// Fonction pour supprimer le message de bienvenue
function removeWelcomeMessage() {
    const welcomeMessage = document.getElementById('welcome-message');
    const messagesContainer = document.querySelector('.messages-container');
    
    if (welcomeMessage) {
        welcomeMessage.remove();
        // Supprimer la classe de centrage
        messagesContainer.classList.remove('has-welcome');
    }
    
    // Marquer définitivement la conversation comme n'ayant plus le message de bienvenue
    const activeConversation = conversations.find(conv => conv.id === currentConversation);
    if (activeConversation) {
        activeConversation.hasWelcomeMessage = false;
    }
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

    // Créer l'icône et le titre
    const header = document.createElement('div');
    header.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 25px;
        gap: 15px;
    `;

    const icon = document.createElement('div');
    icon.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" height="40px" viewBox="http://www.w3.org/2000/svg" width="40px" fill="#4a9eff">
            <path d="M222-255q63-44 125-67.5T480-346q71 0 133 23.5T738-255q44-54 69-123t25-145q0-150-105-255T480-883q-147 0-252 105T123-523q0 76 25 145t74 123Zm257-133q-59 0-99.5-40.5T339-528q0-59 40.5-99.5T479-668q59 0 99.5 40.5T619-528q0 59-40.5 99.5T479-388Z"/>
        </svg>
        <svg xmlns="http://www.w3.org/2000/svg" height="30px" viewBox="http://www.w3.org/2000/svg" width="30px" fill="#888">
            <path d="M370-80q-17 0-28.5-11.5T330-120q0-17 11.5-28.5T370-160q17 0 28.5 11.5T410-120q0 17-11.5 28.5T370-80Zm220 0q-17 0-28.5-11.5T550-120q0-17 11.5-28.5T590-160q17 0 28.5 11.5T630-120q0 17-11.5 28.5T590-80ZM246-720l96 200h280l110-200H246Zm-38-80h590q23 0 35 20.5t1 41.5L692-482q-11 20-29.5 31T622-440H324l-44 80h480v80H280q-45 0-68-39.5t-2-78.5l54-98-144-304H80v-80h130l38 80Z"/>
        </svg>
    `;

    // Créer le contenu du formulaire
    const content = document.createElement('div');
    content.innerHTML = `
        <div style="margin-bottom: 20px;">
            <input type="text" placeholder="Nom d'utilisateur" minlength="2" maxlength="32" style="
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
            
            <input type="password" placeholder="Mot de passe actuel" minlength="12" maxlength="64" style="
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
            
            <input type="password" placeholder="Nouveau mot de passe" minlength="12" maxlength="64" style="
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
            
            <input type="password" placeholder="Confirmation mot de passe" minlength="12" maxlength="64" style="
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
            
            <textarea placeholder="Personnaliser votre IA (ex: Je préfère des réponses courtes)" maxlength="1000" style="
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
            " onfocus="this.style.borderColor='#4a9eff'" onblur="this.style.borderColor='#404040'"></textarea>
            
            <button class="animation_button" onclick="saveUserSettings()" style="
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
        </div>
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
            background: linear-gradient(135deg,rgb(255, 109, 109),rgb(255, 176, 39)) !important;
        }

        .animation_button:active {
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

// ------------------------------------------------------------
/* */

// Fonction pour sauvegarder les paramètres utilisateur
function saveUserSettings() {
    const usernameInput = document.querySelector('.popup-container input[type="text"]').value;
    const currentPasswordInput = document.querySelector('.popup-container input[type="password"]:nth-child(2)').value;
    const newPasswordInput = document.querySelector('.popup-container input[type="password"]:nth-child(3)').value;
    const confirmPasswordInput = document.querySelector('.popup-container input[type="password"]:nth-child(4)').value;
    const customAIInput = document.querySelector('.popup-container textarea').value;

    // Vérification des champs
    // Vérification qu'au moins un des champs est remplis
    if (!usernameInput && !currentPasswordInput && !newPasswordInput && !confirmPasswordInput && !customAIInput) {
        createErrorNotification("Veuillez remplir au moins un champ pour sauvegarder les paramètres.");
        return;
    }
    else if (!usernameInput || usernameInput.length < 2 || usernameInput.length > 32) {
        createErrorNotification("Le nom d'utilisateur doit contenir entre 2 et 32 caractères.");
        return;
    }
    // TODO: CLEMENT FAUT CHECK AVEC LE VRAI
    else if (false) {
        createErrorNotification("Le mot de passe actuel doit contenir entre 12 et 64 caractères.");
        return;
    }
    else if (newPasswordInput && (newPasswordInput.length < 12 || newPasswordInput.length > 64)) {
        createErrorNotification("Le nouveau mot de passe doit contenir entre 12 et 64 caractères.");
        return;
    }
    else if (newPasswordInput !== confirmPasswordInput) {
        createErrorNotification("Les nouveaux mots de passe ne correspondent pas.");
        return;
    }
    else if (customAIInput.length > 1000) {
        createErrorNotification("La personnalisation de l'IA ne doit pas dépasser 1000 caractères.");
        return;
    }

    else{
        // TODO: CLEMENT FAUT SAUVEGARDER

        // Fermer la popup avec la fonction globale
        if (currentPopupClose) {
            currentPopupClose();
            currentPopupClose = null; 
        }

        // Affichage pop up réussite
        showSuccessNotification();
    }
}

// Fonction pour envoyer un message
function sendMessage() {
    const input = document.getElementById('message-input');
    const message = input.value.trim();
    
    if (message) {
        // Supprimer le message de bienvenue s'il existe
        removeWelcomeMessage();
        
        // Ajouter le message à l'interface
        addMessageToUI(message, 'user');
        input.value = '';
        addMessageToUI("**POV**: *Coco* dort encore...", 'bot');
        
        // Ici vous pourrez ajouter l'envoi via socket plus tard
        console.log('Message envoyé:', message);        
    }
}

// Fonction pour créer une nouvelle conversation
function createNewConversation() {
    const newConversation = {
        id: Date.now(), // ID unique basé sur le timestamp
        title: `Conversation ${conversationCounter}`,
        messages: [],
        isActive: false,
        hasWelcomeMessage: true // Flag pour le message de bienvenue
    };
    
    // Désactiver toutes les autres conversations
    conversations.forEach(conv => conv.isActive = false);
    
    // Activer la nouvelle conversation
    newConversation.isActive = true;
    
    // Ajouter en début de liste
    conversations.unshift(newConversation);
    conversationCounter++;
    
    // Mettre à jour l'affichage
    updateConversationsList();
    clearMessagesContainer();

    // Afficher le message de bienvenue
    showWelcomeMessage();
    
    // Mettre à jour la conversation courante
    currentConversation = newConversation.id;
    
    console.log('Nouvelle conversation créée:', newConversation);
}

// Fonction pour mettre à jour la liste des conversations
function updateConversationsList() {
    const conversationList = document.getElementById('conversation-list');
    
    // Vider la liste actuelle
    conversationList.innerHTML = '';
    
    // Ajouter chaque conversation
    conversations.forEach(conversation => {
        const conversationItem = document.createElement('div');
        conversationItem.className = `conversation-item-wrapper ${conversation.isActive ? 'active' : ''}`;
        
        conversationItem.innerHTML = `
            <button class="conversation-item ${conversation.isActive ? 'active' : ''}" onclick="selectConversation(${conversation.id})">
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
            " onfocus="this.style.borderColor='#FF8A32'" onblur="this.style.borderColor='#404040'">
            
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
            conversation.title = newTitle;
            updateConversationsList();
            console.log('Titre modifié:', newTitle);
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
    // Empêcher la propagation de l'événement pour éviter de sélectionner la conversation
    event.stopPropagation();
    
    // Trouver l'index de la conversation à supprimer
    const conversationIndex = conversations.findIndex(conv => conv.id === conversationId);
    
    if (conversationIndex === -1) return;
    
    const conversationToDelete = conversations[conversationIndex];
    
    // Si c'est la conversation active, on doit en sélectionner une autre
    if (conversationToDelete.isActive) {
        // Supprimer la conversation
        conversations.splice(conversationIndex, 1);
        
        // S'il reste des conversations, sélectionner la première
        if (conversations.length > 0) {
            conversations[0].isActive = true;
            currentConversation = conversations[0].id;
            loadConversationMessages(conversations[0]);
        } else {
            // Plus de conversations, créer une nouvelle
            currentConversation = null;
            clearMessagesContainer();
            createNewConversation();
            return;
        }
    } else {
        // Supprimer simplement la conversation
        conversations.splice(conversationIndex, 1);
    }
    
    // Mettre à jour l'affichage
    updateConversationsList();
    
    console.log('Conversation supprimée:', conversationToDelete);
}

// Fonction pour sélectionner une conversation
function selectConversation(conversationId) {
    // Désactiver toutes les conversations
    conversations.forEach(conv => conv.isActive = false);
    
    // Activer la conversation sélectionnée
    const selectedConversation = conversations.find(conv => conv.id === conversationId);
    if (selectedConversation) {
        selectedConversation.isActive = true;
        currentConversation = conversationId;
        
        // Mettre à jour l'affichage
        updateConversationsList();
        loadConversationMessages(selectedConversation);
    }
}

// Fonction pour charger les messages d'une conversation
function loadConversationMessages(conversation) {
    const messagesContainer = document.querySelector('.messages-container');
    messagesContainer.innerHTML = '';
    
    // Supprimer la classe de centrage par défaut
    messagesContainer.classList.remove('has-welcome');
    
    // Afficher le message de bienvenue SEULEMENT si la conversation est vraiment vide
    if (conversation.hasWelcomeMessage && conversation.messages.length === 0) {
        showWelcomeMessage();
    } else {
        // Si il y a des messages, on ne montre plus jamais le message de bienvenue
        if (conversation.messages.length > 0) {
            conversation.hasWelcomeMessage = false;
        }
        
        // Charger tous les messages de la conversation
        conversation.messages.forEach(message => {
            addMessageToUI(message.content, message.type, false);
        });
    }
    
    scrollToBottom();
}

// Fonction pour vider le conteneur de messages
function clearMessagesContainer() {
    const messagesContainer = document.querySelector('.messages-container');
    messagesContainer.innerHTML = '';
    // Supprimer la classe de centrage
    messagesContainer.classList.remove('has-welcome');
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
window.addEventListener('resize', function() {
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    if (window.innerWidth <= 600) {
        mobileBtn.style.display = 'flex';
    } else {
        mobileBtn.style.display = 'none';
        closeMobileSidebar();
    }
});

// Initialiser l'affichage au chargement
document.addEventListener('DOMContentLoaded', function() {
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    if (window.innerWidth <= 600) {
        mobileBtn.style.display = 'flex';
    }
});

// Initialize when page loads
window.addEventListener('load', function() {
    restoreSidebarState();
    scrollToBottom();
    
});

