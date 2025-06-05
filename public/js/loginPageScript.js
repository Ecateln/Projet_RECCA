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