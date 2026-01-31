/**
 * RTL Support for VS Code AI Chat Agents
 * Supports Hebrew, Arabic, Persian, and other RTL languages
 *
 * Works with: GitHub Copilot Chat, Claude Code, and other AI chat extensions
 *
 * Installation:
 * 1. Install "Custom CSS and JS Loader" extension in VS Code
 * 2. Save this file somewhere permanent (e.g., C:\Users\YourName\vscode-custom\rtl-for-vscode-agents.js)
 * 3. Add to VS Code settings.json:
 *    "vscode_custom_css.imports": [
 *      "file:///C:/Users/YourName/vscode-custom/rtl-for-vscode-agents.js"
 *    ]
 * 4. Run command "Enable Custom CSS and JS" and restart VS Code
 * 
 * Note: VS Code will show "[Unsupported]" in title bar - this is normal
 */

(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        // Font settings - includes fonts for Hebrew, Arabic, Persian
        fontFamily: '"Segoe UI", "Arial Hebrew", "David", "Miriam", "Tahoma", "Arial", sans-serif',
        fontSize: '14px',
        lineHeight: '1.6',

        // Selectors for chat content (add more as needed for different agents)
        chatSelectors: [
            // Copilot/Claude
            '.chat-markdown-part.rendered-markdown',
            '.chat-markdown-part',
            '.rendered-markdown',
            '.U.N', // Claude Code user messages
            '.U.e', // Claude Code assistant messages
            '._r',  // Claude Code RTL content container
            '.d.undefined',   // Claude Code buttons with RTL content
            // Antigravity (Google)
            '.whitespace-pre-wrap', // User messages
            'div.prose.prose-sm'    // Agent messages
        ],

        // Selectors for input boxes
        inputSelectors: [
            // Claude Code input box
            'div[contenteditable="plaintext-only"][role="textbox"][aria-label="Message input"]',
            // Copilot input box
            '.view-line'
        ],

        // How often to check for new content (ms)
        checkInterval: 500
    };

    // Constants for CSS-based RTL (Monaco Editor inputs)
    const RTL_STYLE_ID = 'rtl-monaco-style';
    const RTL_MODE_CLASS = 'rtl-mode-active';

    // RTL Unicode ranges
    const RTL_RANGES = [
        // Hebrew: U+0590 to U+05FF
        { start: 0x0590, end: 0x05FF },
        // Arabic: U+0600 to U+06FF
        { start: 0x0600, end: 0x06FF },
        // Arabic Supplement: U+0750 to U+077F
        { start: 0x0750, end: 0x077F },
        // Arabic Extended-A: U+08A0 to U+08FF
        { start: 0x08A0, end: 0x08FF },
        // Persian specific (within Arabic range)
        // Urdu specific (within Arabic range)
        // Syriac: U+0700 to U+074F
        { start: 0x0700, end: 0x074F },
        // Thaana (Maldivian): U+0780 to U+07BF
        { start: 0x0780, end: 0x07BF }
    ];

    /**
     * Check if a character is RTL
     */
    function isRTLChar(char) {
        const code = char.charCodeAt(0);
        return RTL_RANGES.some(range => code >= range.start && code <= range.end);
    }

    /**
     * Check if text contains RTL characters
     */
    function containsRTL(text) {
        if (!text) return false;
        for (let i = 0; i < text.length; i++) {
            if (isRTLChar(text[i])) {
                return true;
            }
        }
        return false;
    }

    /**
     * Get the first text content from an element's subtree
     */
    function getFirstTextContent(element) {
        // Skip code blocks
        if (element.tagName === 'PRE' || element.tagName === 'CODE') {
            return '';
        }

        // Check direct text nodes
        for (const node of element.childNodes) {
            if (node.nodeType === Node.TEXT_NODE) {
                const text = node.textContent.trim();
                if (text) return text;
            }
        }

        // Recursively check children
        for (const child of element.children) {
            // Skip code elements
            if (child.tagName === 'PRE' || child.tagName === 'CODE') {
                continue;
            }
            const text = getFirstTextContent(child);
            if (text) return text;
        }

        return '';
    }

    /**
     * Check if an element should be RTL based on its content
     */
    function shouldBeRTL(element) {
        const firstText = getFirstTextContent(element);
        return containsRTL(firstText);
    }

    /**
     * Apply RTL styling to an element
     */
    function applyRTL(element) {
        element.style.direction = 'rtl';
        element.style.textAlign = 'right';
        element.style.fontFamily = CONFIG.fontFamily;
        element.setAttribute('data-rtl-applied', 'true');

        // Apply to buttons specifically to ensure both properties are set
        element.querySelectorAll('button').forEach(btn => {
            if (containsRTL(btn.textContent)) {
                btn.style.direction = 'rtl';
                btn.style.textAlign = 'right';
            }
        });

        // Apply to paragraphs - check each child independently
        element.querySelectorAll('p, li, h1, h2, h3, h4, h5, h6').forEach(el => {
            // Check if this specific element starts with RTL
            const firstText = getFirstTextContent(el);
            if (containsRTL(firstText)) {
                el.style.direction = 'rtl';
                el.style.textAlign = 'right';
                el.style.unicodeBidi = 'plaintext';
            }
        });

        // Apply to lists
        element.querySelectorAll('ul, ol').forEach(el => {
            if (containsRTL(el.textContent)) {
                el.style.direction = 'rtl';
                el.style.textAlign = 'right';
                el.style.paddingRight = '20px';
                el.style.paddingLeft = '0';
            }
        });

        // Keep code blocks LTR (including div.code for Copilot)
        element.querySelectorAll('div.code, pre, code').forEach(el => {
            el.style.direction = 'ltr';
            el.style.textAlign = 'left';
            el.style.unicodeBidi = 'embed';
        });
    }

    /**
     * Remove RTL styling from an element
     */
    function removeRTL(element) {
        element.style.direction = '';
        element.style.textAlign = '';
        element.style.fontFamily = '';
        element.removeAttribute('data-rtl-applied');
    }

    /**
     * Apply RTL styling to input boxes
     */
    function applyInputRTL(element) {
        element.style.direction = 'rtl';
        element.style.textAlign = 'right';
        element.style.fontFamily = CONFIG.fontFamily;
        element.setAttribute('data-rtl-input', 'true');
    }

    /**
     * Remove RTL styling from input boxes
     */
    function removeInputRTL(element) {
        element.style.direction = 'ltr';
        element.style.textAlign = 'left';
        element.removeAttribute('data-rtl-input');
    }

    /**
     * Inject CSS rules for RTL support in Monaco Editor (one-time operation)
     * This prevents flickering because CSS applies immediately when elements are created
     */
    function injectRTLStyles() {
        if (document.getElementById(RTL_STYLE_ID)) {
            return; // Already injected
        }

        const style = document.createElement('style');
        style.id = RTL_STYLE_ID;
        style.textContent = `
            /* RTL Mode for Monaco Editor Inputs (Copilot) */
            .${RTL_MODE_CLASS} .view-line,
            .${RTL_MODE_CLASS} .view-line[dir="ltr"] {
                direction: rtl !important;
                text-align: right !important;
                unicode-bidi: bidi-override !important;
                font-family: ${CONFIG.fontFamily} !important;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Find the stable Monaco editor parent for a view-line element
     * This parent persists across keystrokes, unlike .view-line which is recreated
     */
    function findMonacoParent(viewLineElement) {
        // Look for the monaco-editor container (most stable)
        let parent = viewLineElement.closest('.monaco-editor');
        if (parent) return parent;

        // Fallback to view-lines
        parent = viewLineElement.closest('.view-lines');
        return parent || viewLineElement.parentElement;
    }

    /**
     * Process Monaco Editor input boxes for RTL
     * Uses CSS class toggle on parent instead of inline styles to prevent flickering
     */
    function processMonacoInputs() {
        const viewLines = document.querySelectorAll('.view-line');

        viewLines.forEach(viewLine => {
            const text = viewLine.textContent || '';
            const hasRTL = containsRTL(text);
            const monacoParent = findMonacoParent(viewLine);

            if (!monacoParent) return;

            const isCurrentlyRTL = monacoParent.classList.contains(RTL_MODE_CLASS);

            if (hasRTL && !isCurrentlyRTL) {
                monacoParent.classList.add(RTL_MODE_CLASS);
            } else if (!hasRTL && isCurrentlyRTL) {
                monacoParent.classList.remove(RTL_MODE_CLASS);
            }
        });
    }

    /**
     * Process input boxes
     */
    function processInputs() {
        const selector = CONFIG.inputSelectors.join(', ');
        const inputs = document.querySelectorAll(selector);

        inputs.forEach(input => {
            // Get the current text content
            const text = input.textContent || input.innerText || '';
            const hasRTL = containsRTL(text);
            const wasRTL = input.getAttribute('data-rtl-input') === 'true';

            if (hasRTL && !wasRTL) {
                applyInputRTL(input);
            } else if (!hasRTL && wasRTL) {
                removeInputRTL(input);
            }

            // Add event listener for real-time changes if not already added
            if (!input.hasAttribute('data-rtl-listener')) {
                input.setAttribute('data-rtl-listener', 'true');

                // Listen for input events
                input.addEventListener('input', function() {
                    const currentText = this.textContent || this.innerText || '';
                    const needsRTL = containsRTL(currentText);

                    if (needsRTL) {
                        applyInputRTL(this);
                    } else {
                        removeInputRTL(this);
                    }
                });
            }
        });
    }

    /**
     * Ensure all code blocks are LTR
     */
    function ensureCodeBlocksLTR() {
        // Force all code blocks to be LTR immediately
        const codeBlocks = document.querySelectorAll('div.code, pre, code');
        codeBlocks.forEach(block => {
            block.style.direction = 'ltr';
            block.style.textAlign = 'left';
            block.style.unicodeBidi = 'embed';
        });
    }

    /**
     * Process individual child elements for RTL
     * This handles cases where a message starts in English but has Hebrew paragraphs
     */
    function processChildrenForRTL(element) {
        // Process paragraphs, headings, and list items
        element.querySelectorAll('p, li, h1, h2, h3, h4, h5, h6').forEach(el => {
            // Skip if already processed and RTL
            if (el.style.direction === 'rtl') {
                return;
            }

            const firstText = getFirstTextContent(el);
            if (containsRTL(firstText)) {
                el.style.direction = 'rtl';
                el.style.textAlign = 'right';
                el.style.unicodeBidi = 'plaintext';
                el.style.fontFamily = CONFIG.fontFamily;
            }
        });

        // Process lists
        element.querySelectorAll('ul, ol').forEach(el => {
            // Skip if already processed and RTL
            if (el.style.direction === 'rtl') {
                return;
            }

            if (containsRTL(el.textContent)) {
                el.style.direction = 'rtl';
                el.style.textAlign = 'right';
                el.style.paddingRight = '20px';
                el.style.paddingLeft = '0';
            }
        });
    }

    /**
     * Process all chat elements (including Antigravity)
     */
    function processElements() {
        const selector = CONFIG.chatSelectors.join(', ');
        const elements = document.querySelectorAll(selector);

        elements.forEach(element => {
            // Antigravity user message
            if (element.classList && element.classList.contains('whitespace-pre-wrap')) {
                // Simple RTL detection for user messages
                const text = element.textContent || '';
                if (containsRTL(text)) {
                    element.style.direction = 'rtl';
                    element.style.textAlign = 'right';
                    element.setAttribute('data-rtl-applied', 'true');
                } else if (element.getAttribute('data-rtl-applied') === 'true') {
                    element.style.direction = '';
                    element.style.textAlign = '';
                    element.removeAttribute('data-rtl-applied');
                }
                return;
            }
            // Antigravity agent message
            if (element.classList && element.classList.contains('prose') && element.classList.contains('prose-sm')) {
                // Only process if not already processed
                if (!element.hasAttribute('data-rtl-container-processed')) {
                    const firstText = (element.textContent || '').trim().substring(0, 100);
                    if (containsRTL(firstText)) {
                        element.setAttribute('data-rtl-container-processed', 'true');
                        // Apply RTL to all text elements inside (p, h1-h6, li)
                        element.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li').forEach(el => {
                            el.style.direction = 'rtl';
                            el.style.textAlign = 'right';
                            el.setAttribute('data-rtl-applied', 'true');
                        });
                        // Also handle lists (ol, ul)
                        element.querySelectorAll('ol, ul').forEach(list => {
                            list.style.direction = 'rtl';
                            list.style.textAlign = 'right';
                            list.setAttribute('data-rtl-applied', 'true');
                        });
                    }
                }
                return;
            }

            // Default logic for Copilot/Claude
            const wasRTL = element.getAttribute('data-rtl-applied') === 'true';
            const needsRTL = shouldBeRTL(element);

            if (needsRTL && !wasRTL) {
                applyRTL(element);
            } else if (!needsRTL && wasRTL) {
                removeRTL(element);
            } else if (!needsRTL && !wasRTL) {
                // Even if parent is LTR, check children for Hebrew paragraphs
                // This handles messages that start in English but have Hebrew content
                processChildrenForRTL(element);
            }
        });

        // Also process input boxes
        processInputs();

        // Ensure all code blocks are LTR (run after RTL processing)
        ensureCodeBlocksLTR();
    }

    /**
     * Initialize the RTL support
     */
    function init() {
        // Inject CSS styles first (one-time) - prevents flickering in Monaco inputs
        injectRTLStyles();

        // Process existing elements
        processElements();

        // Watch for new elements and streaming content
        const observer = new MutationObserver((mutations) => {
            let hasNewNodes = false;
            let hasTextChanges = false;

            mutations.forEach((mutation) => {
                if (mutation.addedNodes.length > 0) {
                    hasNewNodes = true;
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === 1) { // Element node
                            // Immediately handle code blocks
                            if (node.tagName === 'PRE' || node.tagName === 'CODE' ||
                                (node.classList && node.classList.contains('code'))) {
                                node.style.direction = 'ltr';
                                node.style.textAlign = 'left';
                                node.style.unicodeBidi = 'embed';
                            }

                            // Check for code blocks inside the node
                            const codeBlocks = node.querySelectorAll('div.code, pre, code');
                            if (codeBlocks.length > 0) {
                                codeBlocks.forEach(block => {
                                    block.style.direction = 'ltr';
                                    block.style.textAlign = 'left';
                                    block.style.unicodeBidi = 'embed';
                                });
                            }

                            // Immediately check if this node matches our chat selectors
                            const selector = CONFIG.chatSelectors.join(', ');
                            let chatElements = [];

                            // Check if the node itself is a chat element
                            if (node.matches && node.matches(selector)) {
                                chatElements.push(node);
                            }

                            // Check for chat elements inside the node
                            const childChatElements = node.querySelectorAll(selector);
                            if (childChatElements.length > 0) {
                                chatElements.push(...childChatElements);
                            }

                            // Process chat elements immediately
                            chatElements.forEach(element => {
                                const wasRTL = element.getAttribute('data-rtl-applied') === 'true';
                                const needsRTL = shouldBeRTL(element);

                                if (needsRTL && !wasRTL) {
                                    applyRTL(element);
                                } else if (!needsRTL && wasRTL) {
                                    removeRTL(element);
                                } else if (!needsRTL && !wasRTL) {
                                    processChildrenForRTL(element);
                                }
                            });
                        }
                    });
                }
                if (mutation.type === 'characterData') {
                    hasTextChanges = true;
                }
            });

            // For streaming content updates, debounce and reprocess all
            if (hasTextChanges || hasNewNodes) {
                clearTimeout(window._rtlProcessTimeout);
                window._rtlProcessTimeout = setTimeout(() => {
                    processElements();
                }, 50);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            characterData: true // Needed for streaming messages
        });

        // Process input boxes periodically (they don't trigger addedNodes)
        setInterval(() => {
            processMonacoInputs(); // Monaco Editor inputs (Copilot) - uses CSS class toggle
            processInputs();       // Other inputs (Claude Code) - uses inline styles
        }, 200);

        console.log('✅ RTL for VS Code Agents: Initialized');
    }

    // Start when ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Expose manual refresh function
    window.refreshRTL = function() {
        processElements();
        console.log('✅ RTL for VS Code Agents: Refreshed');
    };

    // Expose function to check RTL status
    window.checkRTL = function(text) {
        console.log(`Text: "${text}"`);
        console.log(`Contains RTL: ${containsRTL(text)}`);
    };

    console.log('🔄 RTL for VS Code Agents loaded. Use window.refreshRTL() to manually refresh.');
})();