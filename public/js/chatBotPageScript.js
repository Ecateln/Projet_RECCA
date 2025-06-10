let socket = null;
let currentConversation = null;
let isAuthenticated = false;
let currentResponse = '';
let sidebarRetracted = false;
let internetResearch = false;
let conversations = [];
let conversationCounter = 1;

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
        <svg xmlns="http://www.w3.org/2000/svg" height="40px" viewBox="0 -960 960 960" width="40px" fill="#4a9eff">
            <path d="M222-255q63-44 125-67.5T480-346q71 0 133 23.5T738-255q44-54 69-123t25-145q0-150-105-255T480-883q-147 0-252 105T123-523q0 76 25 145t74 123Zm257-133q-59 0-99.5-40.5T339-528q0-59 40.5-99.5T479-668q59 0 99.5 40.5T619-528q0 59-40.5 99.5T479-388Z"/>
        </svg>
        <svg xmlns="http://www.w3.org/2000/svg" height="30px" viewBox="0 -960 960 960" width="30px" fill="#888">
            <path d="M370-80q-17 0-28.5-11.5T330-120q0-17 11.5-28.5T370-160q17 0 28.5 11.5T410-120q0 17-11.5 28.5T370-80Zm220 0q-17 0-28.5-11.5T550-120q0-17 11.5-28.5T590-160q17 0 28.5 11.5T630-120q0 17-11.5 28.5T590-80ZM246-720l96 200h280l110-200H246Zm-38-80h590q23 0 35 20.5t1 41.5L692-482q-11 20-29.5 31T622-440H324l-44 80h480v80H280q-45 0-68-39.5t-2-78.5l54-98-144-304H80v-80h130l38 80Z"/>
        </svg>
    `;

    // Créer le contenu du formulaire
    const content = document.createElement('div');
    content.innerHTML = `
        <div style="margin-bottom: 20px;">
            <input type="text" placeholder="Nom d'utilisateur" style="
                width: 100%;
                padding: 12px 16px;
                background-color: #1a1a1a;
                border: 1px solid #404040;
                border-radius: 8px;
                color: white;
                font-size: 14px;
                margin-bottom: 15px;
                outline: none;
                transition: border-color 0.3s ease;
            " onfocus="this.style.borderColor='#4a9eff'" onblur="this.style.borderColor='#404040'">
            
            <input type="password" placeholder="Mot de passe actuel" style="
                width: 100%;
                padding: 12px 16px;
                background-color: #1a1a1a;
                border: 1px solid #404040;
                border-radius: 8px;
                color: white;
                font-size: 14px;
                margin-bottom: 15px;
                outline: none;
                transition: border-color 0.3s ease;
            " onfocus="this.style.borderColor='#4a9eff'" onblur="this.style.borderColor='#404040'">
            
            <input type="password" placeholder="Nouveau mot de passe" style="
                width: 100%;
                padding: 12px 16px;
                background-color: #1a1a1a;
                border: 1px solid #404040;
                border-radius: 8px;
                color: white;
                font-size: 14px;
                margin-bottom: 15px;
                outline: none;
                transition: border-color 0.3s ease;
            " onfocus="this.style.borderColor='#4a9eff'" onblur="this.style.borderColor='#404040'">
            
            <input type="password" placeholder="Confirmation mot de passe" style="
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
            " onfocus="this.style.borderColor='#4a9eff'" onblur="this.style.borderColor='#404040'">
            
            <textarea placeholder="Personnaliser votre IA (ex: Je préfère des réponses courtes)" style="
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
                font-family: Montserrat, sans-serif;
            " onfocus="this.style.borderColor='#4a9eff'" onblur="this.style.borderColor='#404040'"></textarea>
            
            <button onclick="saveUserSettings()" style="
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
                font-family: Montserrat, sans-serif;
            " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 15px rgba(255, 107, 107, 0.3)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
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
            margin-right: 20px;
            
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

// Fonction pour basculer l'état de la sidebar
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    
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

// Fonction pour envoyer un message
function sendMessage() {
    const input = document.getElementById('message-input');
    const message = input.value.trim();
    
    if (message) {
        // Ajouter le message à l'interface
        addMessageToUI(message, 'user');
        input.value = '';
        
        // Ici vous pourrez ajouter l'envoi via socket plus tard
        console.log('Message envoyé:', message);
    }
}

// Fonction pour ajouter un message à l'interface
function addMessageToUI(message, type) {
    const messagesContainer = document.querySelector('.messages-container');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}-message`;
    messageDiv.innerHTML = `<p>${message}</p>`;
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

// Fonction pour ajouter un message du bot
function addBotMessage(markdownText) {
    const messagesContainer = document.querySelector('.messages-container');
    const botMessageDiv = document.createElement('div');
    botMessageDiv.className = 'message bot-message';
    // Convertir le markdown en HTML
    botMessageDiv.innerHTML = `<p>${marked.parse(markdownText)}</p>`;
    messagesContainer.appendChild(botMessageDiv);
}

// Mise à jour de l'interface
function updateUI() {
    console.log('UI updated');
    // Faire défiler vers le bas à chaque mise à jour de l'UI
    scrollToBottom();
}

// Fonction pour créer une nouvelle conversation
function createNewConversation() {
    const newConversation = {
        id: Date.now(), // ID unique basé sur le timestamp
        title: `Conversation ${conversationCounter}`,
        messages: [],
        isActive: false
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
        const conversationItem = document.createElement('button');
        conversationItem.className = `conversation-item ${conversation.isActive ? 'active' : ''}`;
        conversationItem.textContent = conversation.title;
        conversationItem.onclick = () => selectConversation(conversation.id);
        
        conversationList.appendChild(conversationItem);
    });
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
    
    // Charger tous les messages de la conversation
    conversation.messages.forEach(message => {
        addMessageToUI(message.content, message.type, false);
    });
    
    scrollToBottom();
}


// Fonction pour vider le conteneur de messages
function clearMessagesContainer() {
    const messagesContainer = document.querySelector('.messages-container');
    messagesContainer.innerHTML = '';
}


// Modifier la fonction addMessageToUI pour sauvegarder dans la conversation active
function addMessageToUI(message, type, saveToConversation = true) {
    const messagesContainer = document.querySelector('.messages-container');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}-message`;
    messageDiv.innerHTML = `<p>${message}</p>`;
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    // Sauvegarder le message dans la conversation active
    if (saveToConversation && currentConversation) {
        const activeConversation = conversations.find(conv => conv.id === currentConversation);
        if (activeConversation) {
            activeConversation.messages.push({
                content: message,
                type: type,
                timestamp: new Date()
            });
        }
    }
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

// Initialize when page loads
window.addEventListener('load', function() {
    restoreSidebarState();
    updateUI();
    scrollToBottom();

    // Créer une première conversation par défaut
    createNewConversation();
    
});

