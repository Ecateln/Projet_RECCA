// Login Page - Script
// Code by Sagnard Elouan and Sanchez Adam

// Function to create the credits popup
function createCreditsPopup() {
    // Create overlay
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
        justify-content: center;
        align-items: center;
        z-index: 1000;
        opacity: 0;
        transition: opacity 0.3s ease;
    `;

    // Create popup container
    const popup = document.createElement('div');
    popup.className = 'popup-container';
    popup.style.cssText = `
        background-color: #2a2a2a;
        border-radius: 10px;
        padding: 30px;
        max-width: 500px;
        width: 90%;
        color: white;
        font-family: Montserrat, sans-serif;
        position: relative;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        transform: scale(0.7);
        transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        opacity: 0;
    `;

    // Create close button
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

    // Create content
    const content = document.createElement('div');
    content.innerHTML = `
        <h3 style="margin: 0 0 20px 0; font-size: 1.3em; font-weight: 500; font-style:italic;"; >Membre du projet:</h3>
        <p style="margin: 5px 0; font-size: 1.1em;">Clément OGÉ</p>
        <p style="margin: 5px 0; font-size: 1.1em;">Romain GAILLARD</p>
        <p style="margin: 5px 0; font-size: 1.1em;">Corentin PHILIPPE</p>
        <p style="margin: 5px 0; font-size: 1.1em;">Elouan SAGNARD</p>
        <p style="margin: 5px 0 20px 0; font-size: 1.1em;">Adam SANCHEZ</p>
        <p style="margin: 0; font-size: 1.1em; line-height: 1.4; color: white;">
            Ce projet a été réalisé dans le cadre de notre quatrième année à l'INSA Hauts-de-France en Informatique et Cybersécurité.
        </p>
    `;

    // Assemble popup
    popup.appendChild(closeButton);
    popup.appendChild(content);
    overlay.appendChild(popup);

    // Close function with proper scale-down animation
    function closePopup() {
        // Change transition for closing (faster, no bounce)
        popup.style.transition = 'all 0.2s ease-out';
        overlay.style.transition = 'opacity 0.2s ease-out';
        
        // Apply closing animations
        popup.style.transform = 'scale(0.8)';
        popup.style.opacity = '0';
        overlay.style.opacity = '0';
        
        // Remove from DOM after animation completes
        setTimeout(() => {
            if (document.body.contains(overlay)) {
                document.body.removeChild(overlay);
            }
        }, 250);
    }

    // Add event listeners
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

    // Add to page
    document.body.appendChild(overlay);

    // Trigger scale-up animation
    setTimeout(() => {
        overlay.style.opacity = '1';
        popup.style.transform = 'scale(1)';
        popup.style.opacity = '1';
    }, 10);
}

// Function to go to the register page
function goToRegisterPage(){
    window.location.href = 'registerPage.html';
}

// Variable globale pour stocker la notification actuelle
let currentNotification = null;

// Function to check URL parameters for registration status
function checkUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const registerStatus = urlParams.get('registered');
    
    if (registerStatus === 'true') {
        // Show the success notification after a short delay
        setTimeout(() => {
            showSuccessNotification();
        }, 500);
        
        // Remove the 'registered' parameter from the URL
        window.history.replaceState({}, document.title, window.location.pathname);
    }
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
    messageElement.textContent = "Inscription réussie ! Bienvenue dans notre communauté !";

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

// Event listener to check URL parameters when the page loads
window.addEventListener('DOMContentLoaded', checkUrlParameters);