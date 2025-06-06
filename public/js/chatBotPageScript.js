
let socket = null;
let currentConversation = null;
let isAuthenticated = false;
let currentResponse = '';
let sidebarRetracted = false;

// Fonction pour basculer l'état de la sidebar
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const inputArea = document.querySelector('.input-area');
    
    sidebarRetracted = !sidebarRetracted;
    
    if (sidebarRetracted) {
        sidebar.classList.add('retracted');
        inputArea.style.left = '60px';
    } else {
        sidebar.classList.remove('retracted');
        inputArea.style.left = '280px';
    }
    
    // Sauvegarder l'état dans le localStorage si disponible
    try {
        localStorage.setItem('sidebarRetracted', sidebarRetracted.toString());
    } catch (e) {
        // Ignore si localStorage n'est pas disponible
    }
}

// Restaurer l'état de la sidebar au chargement
function restoreSidebarState() {
    try {
        const saved = localStorage.getItem('sidebarRetracted');
        if (saved === 'true') {
            sidebarRetracted = true;
            const sidebar = document.getElementById('sidebar');
            const inputArea = document.querySelector('.input-area');
            sidebar.classList.add('retracted');
            inputArea.style.left = '60px';
        }
    } catch (e) {
        // Ignore si localStorage n'est pas disponible
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
    initSocket();
    updateUI();
});
        