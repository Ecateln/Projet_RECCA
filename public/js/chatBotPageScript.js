let socket = null;
let currentConversation = null;
let isAuthenticated = false;
let currentResponse = '';
let sidebarRetracted = false;
let internetResearch = false;

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

// Mise à jour de l'interface
function updateUI() {
    console.log('UI updated');
    // Faire défiler vers le bas à chaque mise à jour de l'UI
    scrollToBottom();
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
});

