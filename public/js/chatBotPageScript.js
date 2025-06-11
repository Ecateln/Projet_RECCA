let socket = null;
let currentConversation = null;
let isAuthenticated = false;
let currentResponse = '';
let sidebarRetracted = false;
let internetResearch = false;
let conversations = [];
let conversationCounter = 1;
let isWelcomeDisplayed = true;

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

// Fonction pour envoyer un message avec la touche Entrée
document.addEventListener('DOMContentLoaded', function() {
    const messageInput = document.getElementById('message-input');
    
    if (messageInput) {
        messageInput.addEventListener('keydown', function(event) {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault(); // Empêche le saut de ligne
                sendMessage();
            }
        });
    }
});

// Fonction pour envoyer un message
function sendMessage() {
    const input = document.getElementById('message-input');
    const message = input.value.trim();
    
    if (message) {
        // Si on n'est pas dans une conversation, en créer une nouvelle
        if (!currentConversation) {
            createNewConversationFromMessage();
        }
        
        // Supprimer le message de bienvenue s'il existe
        removeWelcomeMessage();
        
        // Ajouter le message à l'interface
        addMessageToUI(message, 'user');
        input.value = '';
        
        console.log('Message envoyé:', message);
    }
}



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
    const newConversation = {
        id: Date.now(),
        title: `Conversation ${conversationCounter}`,
        messages: [],
        isActive: true,
        hasWelcomeMessage: true // Flag pour le message de bienvenue
    };
    
    // Désactiver toutes les autres conversations
    conversations.forEach(conv => conv.isActive = false);
    
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
    isWelcomeDisplayed = false; // On n'est plus sur la page d'accueil
    
    console.log('Nouvelle conversation créée:', newConversation);
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
    welcomeDiv.innerHTML = `<p>Bonjour, <strong>COCO</strong> 👋</p>`;
    
    messagesContainer.appendChild(welcomeDiv);
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

function showWelcomePage() {
    const messagesContainer = document.querySelector('.messages-container');
    messagesContainer.innerHTML = '';
    messagesContainer.classList.add('has-welcome');
    
    // Créer le message de bienvenue
    const welcomeDiv = document.createElement('div');
    welcomeDiv.className = 'message bot-message welcome-message';
    welcomeDiv.id = 'welcome-message';
    welcomeDiv.innerHTML = `<p>Bonjour, <strong>COCO</strong> 👋</p>`;
    
    messagesContainer.appendChild(welcomeDiv);
    isWelcomeDisplayed = true;
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
    event.stopPropagation();
    
    const conversationIndex = conversations.findIndex(conv => conv.id === conversationId);
    if (conversationIndex === -1) return;
    
    const conversationToDelete = conversations[conversationIndex];
    
    // Si c'est la conversation active
    if (conversationToDelete.isActive) {
        conversations.splice(conversationIndex, 1);
        
        // S'il reste des conversations, sélectionner la première
        if (conversations.length > 0) {
            conversations[0].isActive = true;
            currentConversation = conversations[0].id;
            loadConversationMessages(conversations[0]);
        } else {
            // Plus de conversations, retourner à la page d'accueil
            currentConversation = null;
            clearMessagesContainer();
            showWelcomePage();
        }
    } else {
        // Supprimer simplement la conversation
        conversations.splice(conversationIndex, 1);
    }
    
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
        isWelcomeDisplayed = false;
        
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
            addMessageToUI(message.content, message.type);
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


// Modifier la fonction addMessageToUI pour sauvegarder dans la conversation active
function addMessageToUI(message, type, saveToConversation = true) {
    // Si c'est un message utilisateur, supprimer le message de bienvenue
    if (type === 'user') {
        removeWelcomeMessage();
    }
    
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

// Fonction pour basculer la sidebar en mode mobile
function openMobileSidebar() {
    sidebarRetracted = true;

    const sidebar = document.getElementById('sidebar');
    const overlay = document.querySelector('.mobile-overlay');
    
    sidebar.classList.toggle('mobile-open');
    overlay.classList.toggle('active');
}

function closeMobileSidebar() {

    sidebarRetracted = false;

    const sidebar = document.getElementById('sidebar');
    const overlay = document.querySelector('.mobile-overlay');
    
    sidebar.classList.remove('mobile-open');
    overlay.classList.remove('active');
}

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
    updateUI();
    scrollToBottom();

    // Afficher la page d'accueil avec le message de bienvenue
    // SANS créer de conversation
    showWelcomePage();
});

