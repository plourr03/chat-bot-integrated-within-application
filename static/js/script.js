// script.js
const chatButton = document.getElementById('chat-button');
const chatContainer = document.getElementById('chat-container');
const chatInput = document.getElementById('chat-input');
const chatMessages = document.getElementById('chat-messages');
const mainIframe = document.getElementById('main-iframe');
const closeButton = document.querySelector('.close-chat');
const resizeHandle = document.querySelector('.resize-handle');

let isMessageInProgress = false;
let isResizing = false;
let startX;
let startWidth;
let rafId = null;

function getResponsiveWidths() {
    if (window.innerWidth <= 1500) {
        return {
            minWidth: 300,
            maxWidth: 800,
            defaultWidth: 400
        };
    }
    return {
        minWidth: Math.min(300, window.innerWidth * 0.85),
        maxWidth: Math.min(800, window.innerWidth * 0.9),
        defaultWidth: Math.min(500, window.innerWidth * 0.85)
    };
}
const processingStages = [
    {
        dots: true,
        text: "Thinking...",
        duration: 4000
    },
    {
        dots: true,
        text: "Analyzing gathered emails...",
        duration: 4000
    },
    {
        dots: true,
        text: "Gathering relevant information...",
        duration: 4000
    },
    {
        dots: true,
        text: "Analyzing your request...",
        duration: 4000
    },
    {
        dots: true,
        text: "Piecing everything together...",
        duration: 4000
    },
    {
        dots: true,
        text: "Preparing response...",
        duration: 4000
    }
];

function toggleChat(show) {
    if (show) {
        const { defaultWidth } = getResponsiveWidths();
        document.body.style.overflow = 'hidden';
        chatContainer.style.display = 'flex';
        
        chatContainer.style.width = window.innerWidth <= 1500 ? '400px' : `${defaultWidth}px`;
        
        requestAnimationFrame(() => {
            chatContainer.classList.add('open');
            if (window.innerWidth > 768) {
                const width = window.innerWidth <= 1500 ? '400px' : chatContainer.style.width || '500px';
                mainIframe.style.width = `calc(100% - ${width})`;
            }
        });
    } else {
        document.body.style.overflow = '';
        chatContainer.classList.remove('open');
        mainIframe.style.width = '100%';
        
        const handleTransitionEnd = () => {
            chatContainer.style.display = 'none';
            chatContainer.removeEventListener('transitionend', handleTransitionEnd);
        };
        
        chatContainer.addEventListener('transitionend', handleTransitionEnd);
    }
}

chatButton.addEventListener('click', () => {
    const isHidden = !chatContainer.classList.contains('open');
    toggleChat(isHidden);
    chatButton.classList.toggle('pulse');
});

closeButton.addEventListener('click', () => {
    toggleChat(false);
    chatButton.classList.toggle('pulse');
});

chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

function createThinkingIndicator() {
    const container = document.createElement('div');
    container.className = 'thinking-container';
    
    const dotsDiv = document.createElement('div');
    dotsDiv.className = 'thinking';
    dotsDiv.innerHTML = `
        <span></span>
        <span></span>
        <span></span>
    `;
    
    const textDiv = document.createElement('div');
    textDiv.className = 'thinking-text';
    
    container.appendChild(dotsDiv);
    container.appendChild(textDiv);
    return container;
}

async function animateThinking(thinkingDiv) {
    const textDiv = thinkingDiv.querySelector('.thinking-text');
    const dotsDiv = thinkingDiv.querySelector('.thinking');
    let currentStage = 0;

    function typeText(text) {
        textDiv.innerHTML = '';
        return new Promise(resolve => {
            const chars = text.split('');
            let i = 0;
            
            function type() {
                if (i < chars.length) {
                    if (chars[i] === ' ') {
                        textDiv.appendChild(document.createTextNode(' '));
                    } else {
                        const span = document.createElement('span');
                        span.className = 'typing-animation';
                        span.textContent = chars[i];
                        span.style.animationDelay = `${i * 30}ms`;
                        textDiv.appendChild(span);
                    }
                    i++;
                    setTimeout(type, chars[i - 1] === ' ' ? 15 : 30);
                } else {
                    setTimeout(resolve, 500);
                }
            }
            type();
        });
    }

    return new Promise((resolve) => {
        async function updateStage() {
            if (currentStage >= processingStages.length) {
                currentStage = 0;
            }

            const stage = processingStages[currentStage];
            await typeText(stage.text);
            dotsDiv.style.display = stage.dots ? 'flex' : 'none';
            currentStage++;
        }

        const interval = setInterval(async () => {
            await updateStage();
        }, 5000);

        updateStage(); // Initial update
        return { interval, element: thinkingDiv };
    });
}

function sendMessage() {
    const message = chatInput.value.trim();
    if (!message || isMessageInProgress) return;

    isMessageInProgress = true;
    
    // Disable input and send button while processing
    chatInput.disabled = true;
    const sendButton = document.querySelector('#chat-input-container button');
    sendButton.disabled = true;

    // Add user message
    addMessage(message, 'user-message');
    chatInput.value = '';

    // Create and add thinking indicator
    const thinkingDiv = createThinkingIndicator();
    chatMessages.appendChild(thinkingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Start thinking animation
    const thinkingAnimation = animateThinking(thinkingDiv);

    // Send message to server
    fetch('/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: message })
    })
    .then(response => response.json())
    .then(data => {
        // Clean up thinking animation
        clearInterval(thinkingAnimation.interval);
        thinkingDiv.remove();
        addMessage(data.response, 'bot-message');
    })
    .catch(error => {
        console.error('Error:', error);
        clearInterval(thinkingAnimation.interval);
        thinkingDiv.remove();
        addMessage('Sorry, something went wrong.', 'bot-message');
    })
    .finally(() => {
        // Re-enable input and send button
        isMessageInProgress = false;
        chatInput.disabled = false;
        sendButton.disabled = false;
        chatInput.focus();
    });
}
document.querySelectorAll('.example-card').forEach(card => {
    card.addEventListener('click', () => {
        const text = card.querySelector('span:last-child').textContent;
        chatInput.value = text;
        chatInput.focus();
    });
});

function addMessage(message, className) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${className}`;
    
    if (className === 'bot-message') {
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        messageDiv.appendChild(contentDiv);
        chatMessages.appendChild(messageDiv);
        updateBotMessage(contentDiv, message);
    } else {
        messageDiv.textContent = message;
        chatMessages.appendChild(messageDiv);
    }
    
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function updateBotMessage(element, message) {
    const messageContainer = element.closest('.message');
    element.innerHTML = '';

    const md = window.markdownit({
        highlight: function (str, lang) {
            if (lang && window.hljs.getLanguage(lang)) {
                try {
                    return '<pre class="hljs code-block"><code>' +
                           window.hljs.highlight(str, { language: lang }).value +
                           '</code></pre>';
                } catch (__) {}
            }
            return '<pre class="hljs code-block"><code>' + md.utils.escapeHtml(str) + '</code></pre>';
        }
    });

    const htmlContent = md.render(message);
    element.innerHTML = htmlContent;

    // Add copy buttons to code blocks
    element.querySelectorAll('pre code').forEach((block) => {
        const copyButton = document.createElement('button');
        copyButton.className = 'copy-code-btn';
        copyButton.innerHTML = '<i class="fas fa-copy"></i>';
        copyButton.onclick = (e) => {
            e.stopPropagation();
            const codeText = block.textContent;
            navigator.clipboard.writeText(codeText).then(() => {
                copyButton.innerHTML = '<i class="fas fa-check"></i>';
                setTimeout(() => {
                    copyButton.innerHTML = '<i class="fas fa-copy"></i>';
                }, 2000);
            });
        };

        const pre = block.parentElement;
        pre.style.position = 'relative';
        pre.appendChild(copyButton);
    });
}

resizeHandle.addEventListener('mousedown', initResize);
document.addEventListener('mousemove', handleResize);
document.addEventListener('mouseup', stopResize);

function initResize(e) {
    if (!e.target.closest('.resize-handle')) return;
    
    isResizing = true;
    startX = e.clientX;
    startWidth = parseInt(getComputedStyle(chatContainer).width, 10);
    
    // Add visual feedback classes
    document.body.classList.add('is-resizing');
    chatContainer.classList.add('is-resizing');
    mainIframe.classList.add('is-resizing');
    resizeHandle.classList.add('active');
    
    // Create overlay for better mouse handling
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
    
    // Store overlay reference
    window._resizeOverlay = overlay;
    
    // Prevent text selection
    e.preventDefault();
}

function handleResize(e) {
    if (!isResizing) return;
    
    const { minWidth, maxWidth } = getResponsiveWidths();
    
    // Use requestAnimationFrame for smooth resizing
    rafId = requestAnimationFrame(() => {
        const delta = startX - e.clientX;
        const newWidth = Math.min(Math.max(startWidth + delta, minWidth), maxWidth);
        
        // Add smooth animation during resize
        chatContainer.style.width = `${newWidth}px`;
        
        if (window.innerWidth > 768) {
            mainIframe.style.width = `calc(100% - ${newWidth}px)`;
        }
        
        // Update width indicator (optional)
        const widthIndicator = document.querySelector('.width-indicator') || createWidthIndicator();
        widthIndicator.textContent = `${Math.round(newWidth)}px`;
        widthIndicator.style.left = `${e.clientX}px`;
    });
}

function stopResize() {
    if (!isResizing) return;
    
    isResizing = false;
    
    // Remove visual feedback
    document.body.classList.remove('is-resizing');
    chatContainer.classList.remove('is-resizing');
    mainIframe.classList.remove('is-resizing');
    resizeHandle.classList.remove('active');
    
    // Remove overlay
    if (window._resizeOverlay) {
        window._resizeOverlay.remove();
        window._resizeOverlay = null;
    }
    
    // Remove width indicator if exists
    const widthIndicator = document.querySelector('.width-indicator');
    if (widthIndicator) widthIndicator.remove();
    
    // Cancel any pending animation frame
    if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
    }
}

// Helper function to create width indicator
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

// Add click handlers for example questions
document.querySelectorAll('.example-questions li').forEach(li => {
    li.addEventListener('click', () => {
        const question = li.textContent.substring(2); // Remove the bullet point
        chatInput.value = question;
        sendMessage();
    });
});

function sendPrompt(button) {
    const promptText = button.querySelector('.prompt-text').textContent;
    chatInput.value = promptText;
    
    // Add visual feedback
    button.style.transform = 'scale(0.98)';
    setTimeout(() => {
        button.style.transform = '';
        sendMessage();
    }, 150);
}

function promptPO() {
    const poNumber = prompt("Please enter the PO number:");
    if (!poNumber) return;
    
    const options = [
        "Get status update for PO " + poNumber,
        "Where is PO " + poNumber + "?",
        "Latest updates on PO " + poNumber,
        "Show all updates for PO " + poNumber
    ];
    
    // Create temporary buttons
    const container = document.querySelector('.example-grid');
    container.innerHTML = ''; // Clear existing buttons
    
    options.forEach(option => {
        const button = document.createElement('button');
        button.className = 'example-prompt';
        button.innerHTML = `
            <span class="material-icons-round">arrow_forward</span>
            <span class="prompt-text">${option}</span>
        `;
        button.onclick = () => {
            chatInput.value = option;
            sendMessage();
            // Reset the quick prompts after sending
            setTimeout(resetQuickPrompts, 500);
        };
        container.appendChild(button);
    });
}

function promptPartNumber() {
    const partNumber = prompt("Please enter the part number:");
    if (!partNumber) return;
    
    const options = [
        "Get status of part " + partNumber,
        "Where is part " + partNumber + "?",
        "Latest updates on part " + partNumber,
        "Track part " + partNumber
    ];
    
    // Create temporary buttons
    const container = document.querySelector('.example-grid');
    container.innerHTML = ''; // Clear existing buttons
    
    options.forEach(option => {
        const button = document.createElement('button');
        button.className = 'example-prompt';
        button.innerHTML = `
            <span class="material-icons-round">arrow_forward</span>
            <span class="prompt-text">${option}</span>
        `;
        button.onclick = () => {
            chatInput.value = option;
            sendMessage();
            // Reset the quick prompts after sending
            setTimeout(resetQuickPrompts, 500);
        };
        container.appendChild(button);
    });
}

function resetQuickPrompts() {
    const container = document.querySelector('.example-grid');
    container.innerHTML = `
        <button class="example-prompt" onclick="promptPO()">
            <span class="material-icons-round">receipt_long</span>
            <span class="prompt-text">Search by PO Number</span>
        </button>
        <button class="example-prompt" onclick="promptPartNumber()">
            <span class="material-icons-round">inventory_2</span>
            <span class="prompt-text">Search by Part Number</span>
        </button>
    `;
}

function showSecondStep(type) {
    const grid = document.getElementById('prompt-grid');
    let options;
    
    if (type === 'po') {
        options = [
            { icon: 'mail', text: 'Email History', description: 'View email thread' },
            { icon: 'schedule', text: 'Timeline', description: 'Track PO progress' },
            { icon: 'pending_actions', text: 'Status Update', description: 'Current status & location' },
            { icon: 'arrow_back', text: 'Back', description: 'Return to start', isBack: true }
        ];
    } else {
        options = [
            { icon: 'inventory', text: 'Supply Chain', description: 'Track part location' },
            { icon: 'mail', text: 'Supplier Comms', description: 'Email correspondence' },
            { icon: 'history', text: 'Order History', description: 'Past orders & status' },
            { icon: 'arrow_back', text: 'Back', description: 'Return to start', isBack: true }
        ];
    }
    
    grid.innerHTML = options.map(option => `
        <button class="quick-prompt-card ${option.isBack ? 'back-button' : ''}" 
                onclick="${option.isBack ? 'resetPrompts()' : `showInputStep('${type}', '${option.text}')`}">
            <div class="prompt-icon">
                <span class="material-icons-round">${option.icon}</span>
            </div>
            <div class="prompt-info">
                <span class="prompt-label">${option.text}</span>
                <span class="prompt-description">${option.description}</span>
            </div>
        </button>
    `).join('');
}

function showInputStep(type, action) {
    const grid = document.getElementById('prompt-grid');
    const itemType = type === 'po' ? 'PO' : 'Part';
    
    grid.innerHTML = `
        <div class="input-step">
            <input type="text" 
                   class="prompt-input" 
                   placeholder="Enter ${itemType} number..."
                   onkeypress="if(event.key === 'Enter') submitPrompt('${type}', '${action}', this.value)">
            <div class="button-group">
                <button class="quick-prompt-card" onclick="showSecondStep('${type}')">
                    <span class="material-icons-round">arrow_back</span>
                    <span>Back</span>
                </button>
                <button class="quick-prompt-card primary" 
                        onclick="submitPrompt('${type}', '${action}', document.querySelector('.prompt-input').value)">
                    <span class="material-icons-round">send</span>
                    <span>Submit</span>
                </button>
            </div>
        </div>
    `;
    
    setTimeout(() => {
        document.querySelector('.prompt-input').focus();
    }, 100);
}

function submitPrompt(type, action, value) {
    if (!value.trim()) return;
    
    let promptText;
    const itemType = type === 'po' ? 'PO' : 'Part';
    
    switch(action) {
        case 'Email History':
            promptText = `Show me all email correspondence regarding ${itemType} ${value}`;
            break;
        case 'Timeline':
            promptText = `What is the complete timeline of communications and updates for ${itemType} ${value}?`;
            break;
        case 'Status Update':
            promptText = `What is the latest status update from supplier emails regarding ${itemType} ${value}?`;
            break;
        case 'Supply Chain':
            promptText = `Based on supplier communications, where is part ${value} in the supply chain?`;
            break;
        case 'Supplier Comms':
            promptText = `Show me recent supplier communications about part ${value}`;
            break;
        case 'Order History':
            promptText = `What is the order history and status for part ${value} based on email correspondence?`;
            break;
        default:
            promptText = `Show me information about ${itemType} ${value}`;
    }
    
    chatInput.value = promptText;
    sendMessage();
    resetPrompts();
}
function resetPrompts() {
    const grid = document.getElementById('prompt-grid');
    grid.innerHTML = `
        <button class="quick-prompt-card" onclick="showSecondStep('po')">
            <div class="prompt-icon">
                <span class="material-icons-round">receipt_long</span>
            </div>
            <div class="prompt-info">
                <span class="prompt-label">PO Inquiry</span>
                <span class="prompt-description">Track purchase orders & communications</span>
            </div>
        </button>
        
        <button class="quick-prompt-card" onclick="showSecondStep('part')">
            <div class="prompt-icon">
                <span class="material-icons-round">inventory_2</span>
            </div>
            <div class="prompt-info">
                <span class="prompt-label">Part Inquiry</span>
                <span class="prompt-description">Track parts & supplier communications</span>
            </div>
        </button>
    `;
}

// Add click handler for collapsible quick prompts
document.querySelector('.quick-prompts-header').addEventListener('click', function() {
    const quickPrompts = this.closest('.quick-prompts');
    quickPrompts.classList.toggle('collapsed');
    
    // Store the state in localStorage
    localStorage.setItem('quickPromptsCollapsed', quickPrompts.classList.contains('collapsed'));
});

// Check stored state on page load
document.addEventListener('DOMContentLoaded', function() {
    const quickPrompts = document.querySelector('.quick-prompts');
    const isCollapsed = localStorage.getItem('quickPromptsCollapsed') === 'true';
    if (isCollapsed) {
        quickPrompts.classList.add('collapsed');
    }
});


