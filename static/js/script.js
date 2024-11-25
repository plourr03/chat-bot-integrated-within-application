// script.js
let chatButton, chatContainer, chatInput, chatMessages, mainIframe, closeButton, pinButton;

let isMessageInProgress = false;
let chatHistory = [];
window.isPinned = false;

function ensureUserId() {
    let userId = localStorage.getItem('user_id');
    if (!userId) {
        userId = crypto.randomUUID();
        localStorage.setItem('user_id', userId);
    }
    return userId;
}

document.addEventListener('DOMContentLoaded', () => {
    // Initialize all global variables
    chatButton = document.getElementById('chat-button');
    chatContainer = document.getElementById('chat-container');
    chatInput = document.getElementById('chat-input');
    chatMessages = document.getElementById('chat-messages');
    mainIframe = document.getElementById('main-iframe');
    closeButton = document.querySelector('.close-chat');
    pinButton = document.querySelector('.pin-chat');

    // Only add event listeners if elements exist
    if (chatButton) {
        chatButton.addEventListener('click', () => {
            const isHidden = !chatContainer.classList.contains('open');
            toggleChat(isHidden);
            chatButton.classList.toggle('pulse');
        });
    }

    if (closeButton) {
        closeButton.addEventListener('click', () => {
            if (window.isPinned) {
                // First unpin the chat
                window.isPinned = false;
                pinButton.classList.remove('active');
                chatContainer.classList.remove('pinned');
                mainIframe.classList.remove('pinned');
                
                // Reset iframe width
                mainIframe.style.width = '100%';
                mainIframe.style.marginRight = '0';
                
                // Store pinned state
                localStorage.setItem('chatPinned', 'false');
            }
            
            // Then close the chat
            toggleChat(false);
            chatButton.classList.toggle('pulse');
        });
    }

    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }
});

document.addEventListener('DOMContentLoaded', ensureUserId);

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
    if (!chatContainer) {
        console.error('Chat container not initialized');
        return;
    }

    if (show) {
        const { defaultWidth } = getResponsiveWidths();
        document.body.style.overflow = 'hidden';
        chatContainer.style.display = 'flex';
        
        const width = window.innerWidth <= 1500 ? '400px' : `${defaultWidth}px`;
        chatContainer.style.width = width;
        document.documentElement.style.setProperty('--chat-width', width);
        
        requestAnimationFrame(() => {
            chatContainer.classList.add('open');
            if (window.isPinned && window.innerWidth > 768) {
                mainIframe.classList.add('pinned');
            }
        });
    } else if (!window.isPinned) {
        document.body.style.overflow = '';
        chatContainer.classList.remove('open');
        mainIframe.classList.remove('pinned');
        mainIframe.style.width = '100%';
        mainIframe.style.transform = 'none';
        
        const handleTransitionEnd = () => {
            chatContainer.style.display = 'none';
            chatContainer.removeEventListener('transitionend', handleTransitionEnd);
        };
        
        chatContainer.addEventListener('transitionend', handleTransitionEnd);
    }
}

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
    let isAnimating = true;

    function typeText(text) {
        return new Promise(resolve => {
            if (!isAnimating) {
                resolve();
                return;
            }

            textDiv.innerHTML = '';
            const chars = text.split('');
            let i = 0;
            
            function type() {
                if (!isAnimating) {
                    resolve();
                    return;
                }

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

    const interval = setInterval(async () => {
        if (!isAnimating) {
            clearInterval(interval);
            return;
        }

        if (currentStage >= processingStages.length) {
            currentStage = 0;
        }

        const stage = processingStages[currentStage];
        await typeText(stage.text);
        if (dotsDiv) {
            dotsDiv.style.display = stage.dots ? 'flex' : 'none';
        }
        currentStage++;
    }, 5000);

    // Initial update
    const stage = processingStages[currentStage];
    await typeText(stage.text);
    if (dotsDiv) {
        dotsDiv.style.display = stage.dots ? 'flex' : 'none';
    }

    // Return cleanup function
    return () => {
        isAnimating = false;
        clearInterval(interval);
    };
}

function sendMessage() {
    const message = chatInput.value.trim();
    if (!message || isMessageInProgress) return;

    isMessageInProgress = true;
    chatInput.disabled = true;
    const sendButton = document.querySelector('#chat-input-container button');
    sendButton.disabled = true;

    // Add user message
    addMessage(message, 'user-message');
    chatInput.value = '';

    // Create message container for streaming response (initially hidden)
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message bot-message';
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    messageDiv.appendChild(contentDiv);
    chatMessages.appendChild(messageDiv);

    // Create and add thinking indicator
    const thinkingDiv = createThinkingIndicator();
    chatMessages.appendChild(thinkingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    let accumulatedText = '';
    let isThinkingComplete = false;
    let pendingText = '';
    let pollInterval;

    // Start thinking animation
    let cleanup = () => {}; // Default no-op cleanup function

    const startThinking = async () => {
        cleanup = await animateThinking(thinkingDiv);
    };

    startThinking();

    // Send initial request
    fetch('/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
            message: message,
            user_id: localStorage.getItem('user_id') || crypto.randomUUID(),
            chat_history: chatHistory
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.poll_id) {
            // Start polling after 5 seconds
            setTimeout(() => {
                pollInterval = setInterval(() => {
                    fetch(`/poll/${data.poll_id}`)
                        .then(response => response.json())
                        .then(pollData => {
                            if (!isThinkingComplete) {
                                pollData.messages.forEach(msg => {
                                    if (msg.type === 'content') {
                                        pendingText += msg.content;
                                    }
                                });
                            } else {
                                pollData.messages.forEach(msg => {
                                    if (msg.type === 'content') {
                                        accumulatedText += msg.content;
                                        typeMessageSteadily(contentDiv, accumulatedText);
                                    }
                                });
                            }

                            if (pollData.done) {
                                clearInterval(pollInterval);
                                // Add the assistant's complete response to chat history
                                chatHistory.push({ role: "assistant", content: accumulatedText });
                                isMessageInProgress = false;
                                chatInput.disabled = false;
                                sendButton.disabled = false;
                                chatInput.focus();
                            }
                        });
                }, 50); // Poll every second
            }, 5000);
            // After 5 seconds, remove thinking indicator and start displaying content
            setTimeout(() => {
                cleanup();
                thinkingDiv.remove();
                isThinkingComplete = true;
                messageDiv.classList.add('visible');
                if (pendingText) {
                    accumulatedText = pendingText;
                    typeMessageSteadily(contentDiv, accumulatedText);
                }
            }, 5000);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        if (pollInterval) {
            clearInterval(pollInterval);
        }
        cleanup();
        thinkingDiv.remove();
        addMessage('Sorry, something went wrong.', 'bot-message');
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
    
    // Update chat history
    if (className === 'user-message') {
        chatHistory.push({ role: "user", content: message });
    } else if (className === 'bot-message') {
        chatHistory.push({ role: "assistant", content: message });
    }
    
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
function typeMessageSteadily(container, text, speed = 30) {
    // Convert the text to markdown first
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

    const htmlContent = md.render(text);
    
    // If container is empty, initialize it with a typing container
    if (!container.innerHTML) {
        container.innerHTML = '<div class="typing-content"></div>';
    }
    
    const typingContent = container.querySelector('.typing-content');
    
    // Create a temporary div to parse the HTML content
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    
    // Clear existing content
    typingContent.innerHTML = '';
    
    // Function to type out text nodes
    function typeText(node, callback) {
        const text = node.textContent;
        let index = 0;
        
        function type() {
            if (index < text.length) {
                node.textContent = text.slice(0, index + 1);
                index++;
                setTimeout(type, speed);
            } else {
                callback();
            }
        }
        type();
    }
    
    // Function to process nodes recursively
    function processNodes(parentNode) {
        const nodes = Array.from(parentNode.childNodes);
        let currentIndex = 0;

        function processNextNode() {
            if (currentIndex >= nodes.length) {
                return;
            }

            const node = nodes[currentIndex];
            if (node.nodeType === Node.TEXT_NODE) {
                const span = document.createElement('span');
                span.textContent = '';
                typingContent.appendChild(span);
                typeText(span, () => {
                    currentIndex++;
                    processNextNode();
                });
            } else {
                const clone = node.cloneNode(true);
                typingContent.appendChild(clone);
                currentIndex++;
                processNextNode();
            }
        }

        processNextNode();
    }

    processNodes(tempDiv);

    // Add copy buttons to any code blocks
    container.querySelectorAll('pre code').forEach((block) => {
        if (!block.parentElement.querySelector('.copy-code-btn')) {
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
        }
    });

    chatMessages.scrollTop = chatMessages.scrollHeight;
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

document.addEventListener('DOMContentLoaded', () => {
    const quickPromptsHeader = document.querySelector('.quick-prompts-header');
    if (quickPromptsHeader) {
        quickPromptsHeader.addEventListener('click', function() {
            const quickPrompts = this.closest('.quick-prompts');
            quickPrompts.classList.toggle('collapsed');
            
            // Store the state in localStorage
            localStorage.setItem('quickPromptsCollapsed', quickPrompts.classList.contains('collapsed'));
        });
    }
});

// Move the pinButton event listener inside DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
    const quickPrompts = document.querySelector('.quick-prompts');
    const pinButton = document.querySelector('.pin-chat');
    
    // Check stored states
    const isCollapsed = localStorage.getItem('quickPromptsCollapsed') === 'true';
    if (isCollapsed && quickPrompts) {
        quickPrompts.classList.add('collapsed');
    }
    
    // Check if chat was previously pinned
    const wasPinned = localStorage.getItem('chatPinned') === 'true';
    if (wasPinned && pinButton) {
        window.isPinned = true;
        pinButton.classList.add('active');
        chatContainer.classList.add('pinned');
        toggleChat(true);
    }

    // Add pin button event listener
    if (pinButton) {
        pinButton.addEventListener('click', () => {
            window.isPinned = !window.isPinned;
            pinButton.classList.toggle('active');
            chatContainer.classList.toggle('pinned');
            
            const { minWidth, maxWidth, defaultWidth } = getResponsiveWidths();
            const currentWidth = parseInt(getComputedStyle(chatContainer).width, 10);
            
            if (window.isPinned) {
                mainIframe.classList.add('pinned');
                // Update the chat width and iframe position when pinning
                document.documentElement.style.setProperty('--chat-width', `${currentWidth}px`);
                mainIframe.style.width = `calc(100% - ${currentWidth}px)`;
                mainIframe.style.marginRight = '0';  // Remove the margin
            } else {
                // Reset everything when unpinning
                mainIframe.classList.remove('pinned');
                mainIframe.style.width = '100%';
                mainIframe.style.marginRight = '0';
                document.documentElement.style.setProperty('--chat-width', `${currentWidth}px`);
                
                // Reset to default width if outside bounds
                if (currentWidth < minWidth || currentWidth > maxWidth) {
                    chatContainer.style.width = `${defaultWidth}px`;
                    document.documentElement.style.setProperty('--chat-width', `${defaultWidth}px`);
                }
            }
            
            localStorage.setItem('chatPinned', window.isPinned);
            pinButton.setAttribute('aria-label', window.isPinned ? 'Unpin chat' : 'Pin chat');
            pinButton.querySelector('.material-icons-round').style.transform = 
                window.isPinned ? 'rotate(0deg)' : 'rotate(45deg)';
        });
    }
});


