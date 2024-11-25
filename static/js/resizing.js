// Create the ResizeManager module
const ResizeManager = (() => {
    let chatContainer, mainIframe, resizeHandle;
    let isResizing = false;
    let startX;
    let startWidth;
    let rafId = null;

    function init() {
        // Initialize DOM elements
        chatContainer = document.getElementById('chat-container');
        mainIframe = document.getElementById('main-iframe');
        resizeHandle = document.querySelector('.resize-handle');

        if (!chatContainer || !mainIframe || !resizeHandle) {
            console.error('Required DOM elements not found');
            return;
        }

        // Add event listeners
        resizeHandle.addEventListener('mousedown', initResize);
        document.addEventListener('mousemove', handleResize);
        document.addEventListener('mouseup', stopResize);
    }

    function getResponsiveWidths() {
        const isPinned = window.isPinned;
        const screenWidth = window.innerWidth;
        
        if (screenWidth <= 768) {
            return {
                minWidth: screenWidth - 40,
                maxWidth: screenWidth - 40,
                defaultWidth: screenWidth - 40
            };
        }
        
        if (screenWidth <= 1500) {
            return {
                minWidth: isPinned ? 300 : 300,
                maxWidth: isPinned ? 600 : 800,
                defaultWidth: 400
            };
        }
        
        return {
            minWidth: isPinned ? 300 : Math.min(300, screenWidth * 0.85),
            maxWidth: isPinned ? Math.min(600, screenWidth * 0.4) : Math.min(800, screenWidth * 0.9),
            defaultWidth: isPinned ? 400 : Math.min(500, screenWidth * 0.85)
        };
    }

    function handleResize(e) {
        if (!isResizing) return;
        
        const { minWidth, maxWidth } = getResponsiveWidths();
        
        rafId = requestAnimationFrame(() => {
            const delta = startX - e.clientX;
            let newWidth = Math.min(Math.max(startWidth + delta, minWidth), maxWidth);
            
            // Ensure width respects constraints based on pin state
            if (!window.isPinned) {
                newWidth = Math.min(newWidth, maxWidth);
                newWidth = Math.max(newWidth, minWidth);
            }
            
            chatContainer.style.width = `${newWidth}px`;
            
            if (window.isPinned && window.innerWidth > 768) {
                document.documentElement.style.setProperty('--chat-width', `${newWidth}px`);
                mainIframe.style.width = `calc(100% - ${newWidth}px)`;
                mainIframe.style.marginRight = '0';
                mainIframe.style.transform = 'none';
            }
            
            const widthIndicator = document.querySelector('.width-indicator') || createWidthIndicator();
            widthIndicator.textContent = `${Math.round(newWidth)}px`;
            widthIndicator.style.left = `${e.clientX}px`;
        });
    }

    function initResize(e) {
        if (!e.target.closest('.resize-handle')) return;
        
        isResizing = true;
        startX = e.clientX;
        startWidth = parseInt(getComputedStyle(chatContainer).width, 10);
        
        document.body.classList.add('is-resizing');
        chatContainer.classList.add('is-resizing');
        mainIframe.classList.add('is-resizing');
        resizeHandle.classList.add('active');
        
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 10000;
            cursor: col-resize;
        `;
        document.body.appendChild(overlay);
        
        window._resizeOverlay = overlay;
        e.preventDefault();
    }

    function stopResize() {
        if (!isResizing) return;
        
        isResizing = false;
        
        document.body.classList.remove('is-resizing');
        chatContainer.classList.remove('is-resizing');
        mainIframe.classList.remove('is-resizing');
        resizeHandle.classList.remove('active');
        
        if (window._resizeOverlay) {
            window._resizeOverlay.remove();
            window._resizeOverlay = null;
        }
        
        const widthIndicator = document.querySelector('.width-indicator');
        if (widthIndicator) widthIndicator.remove();
        
        if (rafId) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }
    }

    function createWidthIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'width-indicator';
        indicator.style.cssText = `
            position: fixed;
            top: 50%;
            transform: translateY(-50%);
            background: var(--primary-color);
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            pointer-events: none;
            z-index: 10001;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        `;
        document.body.appendChild(indicator);
        return indicator;
    }

    // Initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', init);

    // Return public methods
    return {
        getResponsiveWidths
    };
})();

// Make getResponsiveWidths globally available
window.getResponsiveWidths = ResizeManager.getResponsiveWidths;
