/**
 * RTL Support for VS Code AI Chat Agents
 * Supports Hebrew, Arabic, Persian, and other RTL languages
 *
 * Works with: GitHub Copilot Chat, Claude Code, Gemini CLI, and other AI chat extensions
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
            // Copilot
            '.chat-markdown-part.rendered-markdown',
            '.chat-markdown-part',
            '.rendered-markdown',
            // Claude Code (new version - using partial class matching for dynamic hashes)
            '[class*="message_"][class*="userMessageContainer_"]', // User message outer wrapper (has both classes)
            '[class*="timelineMessage_"]', // Agent/timeline messages container
            '[class*="root_"]', // Agent message content root (contains p, ul, ol, etc.)
            // Gemini CLI
            '.history-item-text',   // User and agent messages
            // Antigravity (Google)
            '.whitespace-pre-wrap', // User messages
            'div.prose.prose-sm',   // Agent messages
            // Claude Code - AskUserQuestion popup
            '[class*="questionTextLarge_"]',  // question text
            '[class*="optionLabel_"]',        // option label
            '[class*="optionDescription_"]',  // option description text
            '[class*="navTab_"]'              // navigation tab buttons (button has defined width → text-align works)
        ],

        // Selectors for input boxes
        inputSelectors: [
            // Claude Code input box
            'div[contenteditable="plaintext-only"][role="textbox"][aria-label="Message input"]',
            // Gemini CLI input box
            '.chat-submit-input[contenteditable="plaintext-only"]',
            // Copilot input box
            '.view-line',
            // Claude Code - AskUserQuestion "Other" free-text input
            '[class*="otherInput_"] [contenteditable="plaintext-only"]',
            // Claude Code - Permission request reject message input
            '[class*="rejectMessageInput_"] [contenteditable="plaintext-only"]'
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
     * Smart RTL detection based on first strong character + majority fallback.
     * Scans for the first Unicode letter (skipping emojis, numbers, punctuation, bullets):
     * - First strong char is RTL → always true
     * - First strong char is LTR → true only if ≥30% of all letters are RTL
     * - No letters found → false
     *
     * Examples:
     *   "🎉 שלום"        → skip 🎉, space → ש is RTL → true
     *   "• פריט ראשון"   → skip •, space → פ is RTL → true
     *   "Hello עולם"     → H is LTR, RTL < 30% → false
     *   "1.1 Migration: הוספת שדות WhatsApp ו-table העדפות מטופל"
     *                    → M is LTR, but RTL ≥ 30% → true
     */
    function shouldBeRTLText(text) {
        if (!text) return false;
        const trimmed = text.trim();
        if (!trimmed) return false;

        let firstStrongIsRTL = null;
        let rtlCount = 0;
        let ltrCount = 0;

        for (const char of trimmed) {
            if (isRTLChar(char)) {
                rtlCount++;
                if (firstStrongIsRTL === null) firstStrongIsRTL = true;
            } else if (/\p{L}/u.test(char)) {
                ltrCount++;
                if (firstStrongIsRTL === null) firstStrongIsRTL = false;
            }
            // else: neutral character (emoji, number, punctuation, space) - skip
        }

        if (firstStrongIsRTL === null) return false; // no letters at all
        if (firstStrongIsRTL) return true; // first strong char is RTL → always RTL

        // First strong char is LTR - check if at least 30% of letters are RTL
        const totalLetters = rtlCount + ltrCount;
        return totalLetters > 0 && (rtlCount / totalLetters) >= 0.3;
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
        return shouldBeRTLText(firstText);
    }

    /**
     * Apply RTL styling to an element
     */
    function applyRTL(element) {
        element.style.direction = 'rtl';
        element.style.textAlign = 'right';
        element.style.unicodeBidi = 'plaintext';
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
            if (shouldBeRTLText(el.textContent)) {
                el.style.direction = 'rtl';
                el.style.textAlign = 'right';
                el.style.unicodeBidi = 'plaintext';
                if (el.tagName === 'LI') {
                    el.style.listStylePosition = 'inside';
                }
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
        element.style.unicodeBidi = 'plaintext';
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

            /* Counter Claude Code's * { direction: ltr; unicode-bidi: bidi-override } rule —
               apply broadly to all chat content, not just RTL-marked elements */
            [class*="message_"] *,
            [class*="timelineMessage_"] *,
            [class*="root_"] *,
            .rendered-markdown *,
            [class*="questionTextLarge_"] *,
            [class*="optionLabel_"] *,
            [class*="optionDescription_"] *,
            [data-rtl-applied="true"],
            [data-rtl-applied="true"] * {
                unicode-bidi: plaintext !important;
            }
            [data-rtl-input="true"] {
                unicode-bidi: plaintext !important;
            }
            /* Maintain code blocks as LTR within RTL containers */
            [data-rtl-applied="true"] pre,
            [data-rtl-applied="true"] pre *,
            [data-rtl-applied="true"] code,
            [data-rtl-applied="true"] code * {
                unicode-bidi: embed !important;
                direction: ltr !important;
                text-align: left !important;
            }

            /* Claude Code Chat History List - unconditional overrides */
            [class*="sessionName_"] {
                overflow: auto !important;
                text-overflow: unset !important;
                white-space: normal !important;
            }
            [class*="sessionItem_"] {
                direction: rtl !important;
                padding: 0 !important;
            }
            [class*="dropdown_"] {
                width: max(400px, 100vw - 32px) !important;
                max-height: 70% !important;
            }

            /* Claude Code Chat History Header Button - unconditional overrides */
            [class*="sessionsButtonText_"] {
                white-space: normal !important;
                display: -webkit-box !important;
                -webkit-line-clamp: 3 !important;
                -webkit-box-orient: vertical !important;
                overflow: hidden !important;
            }
            [class*="sessionsButtonContent_"] {
                max-width: unset !important;
            }
            [class*="sessionsButton_"] {
                max-width: unset !important;
            }

            /* Claude Code UI accent borders */
            [class*="header_"]:has([class*="sessionsButton_"]) {
                border: 2px solid #c8a2f8 !important;
            }
            [class*="userMessage_"] {
                border: 2px solid #f98383 !important;
            }

            /* Copilot / VS Code Chat — user message accent border */
            .interactive-request .chat-markdown-part {
                border: 2px solid #f98383 !important;
                border-radius: 4px;
                padding: 4px 8px;
            }

            /* User message navigation buttons — inline in footer bar */
            #rtl-msg-nav {
                display: flex;
                gap: 2px;
                align-items: center;
            }
            #rtl-msg-nav button {
                width: 20px;
                height: 20px;
                border: none;
                border-radius: 4px;
                background: transparent;
                color: var(--app-secondary-foreground, rgba(255,255,255,0.5));
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 0;
                opacity: 0.6;
                transition: opacity 0.15s, background 0.15s;
            }
            #rtl-msg-nav button:hover {
                opacity: 1;
                background: rgba(255,255,255,0.08);
            }
            #rtl-msg-nav button svg {
                width: 14px;
                height: 14px;
            }
            @keyframes rtl-nav-highlight {
                0%   { box-shadow: 0 0 0 0 rgba(249,131,131,0.7); }
                50%  { box-shadow: 0 0 8px 3px rgba(249,131,131,0.5); }
                100% { box-shadow: 0 0 0 0 rgba(249,131,131,0); }
            }
            .rtl-nav-highlight {
                animation: rtl-nav-highlight 0.6s ease-out !important;
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
     * User message navigation — track current index
     */
    let navCurrentIndex = -1;

    /**
     * Inject navigation buttons (↑ ↓) above the chat input box
     */
    function injectMessageNavigation() {
        // Already injected
        if (document.getElementById('rtl-msg-nav')) return;

        // Find the footer bar inside the input area
        const footer = document.querySelector('[class*="inputFooter_"]');
        if (!footer) return;

        // Find the addButtonContainer to insert before it
        const addBtn = footer.querySelector('[class*="addButtonContainer_"]');
        if (!addBtn) return;

        // Create navigation container
        const nav = document.createElement('div');
        nav.id = 'rtl-msg-nav';

        // Up button
        const upBtn = document.createElement('button');
        upBtn.title = 'Previous user message (↑)';
        upBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5"/></svg>';
        upBtn.addEventListener('click', () => navigateUserMessages(-1));

        // Down button
        const downBtn = document.createElement('button');
        downBtn.title = 'Next user message (↓)';
        downBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/></svg>';
        downBtn.addEventListener('click', () => navigateUserMessages(1));

        nav.appendChild(upBtn);
        nav.appendChild(downBtn);

        // Insert to the left of the add button
        footer.insertBefore(nav, addBtn);
    }

    /**
     * Navigate to the next/previous user message
     * @param {number} direction  -1 for up (previous), +1 for down (next)
     */
    function navigateUserMessages(direction) {
        // Claude Code — all messages in DOM, use scrollIntoView
        const msgs = Array.from(document.querySelectorAll(
            '[class*="message_"][class*="userMessageContainer_"]'
        ));
        if (msgs.length === 0) return;

        // Compute next index with cyclic wrap
        if (navCurrentIndex < 0 || navCurrentIndex >= msgs.length) {
            navCurrentIndex = direction === -1 ? msgs.length - 1 : 0;
        } else {
            navCurrentIndex += direction;
            if (navCurrentIndex < 0) navCurrentIndex = msgs.length - 1;
            if (navCurrentIndex >= msgs.length) navCurrentIndex = 0;
        }

        const target = msgs[navCurrentIndex];
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Highlight pulse
        target.classList.remove('rtl-nav-highlight');
        void target.offsetWidth;
        target.classList.add('rtl-nav-highlight');
        target.addEventListener('animationend', () => {
            target.classList.remove('rtl-nav-highlight');
        }, { once: true });
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

            if (shouldBeRTLText(el.textContent)) {
                el.style.direction = 'rtl';
                el.style.textAlign = 'right';
                el.style.unicodeBidi = 'plaintext';
                el.style.fontFamily = CONFIG.fontFamily;
                el.setAttribute('data-rtl-applied', 'true');
                if (el.tagName === 'LI') {
                    el.style.listStylePosition = 'inside';
                }
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
                el.setAttribute('data-rtl-applied', 'true');
            }
        });
    }

    /**
     * Process Claude Code chat history list items for RTL
     * Checks each sessionItem's sessionName content and conditionally applies RTL
     */
    function processHistoryList() {
        // Process session items in the dropdown list
        const sessionItems = document.querySelectorAll('[class*="sessionItem_"]');
        sessionItems.forEach(item => {
            const sessionName = item.querySelector('[class*="sessionName_"]');
            if (!sessionName) return;

            const text = sessionName.textContent || '';
            const isRTL = shouldBeRTLText(text);

            if (isRTL) {
                item.style.textAlign = 'right';
                sessionName.style.direction = 'rtl';
                sessionName.setAttribute('data-rtl-applied', 'true');
            } else {
                item.style.textAlign = '';
                sessionName.style.direction = '';
                sessionName.removeAttribute('data-rtl-applied');
            }
        });

        // Process the header button text (current session title)
        const buttonTexts = document.querySelectorAll('[class*="sessionsButtonText_"]');
        buttonTexts.forEach(el => {
            const text = el.textContent || '';
            if (shouldBeRTLText(text)) {
                el.style.direction = 'rtl';
                el.style.textAlign = 'right';
                el.setAttribute('data-rtl-applied', 'true');
            } else {
                el.style.direction = '';
                el.style.textAlign = '';
                el.removeAttribute('data-rtl-applied');
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
                    if (shouldBeRTLText(firstText)) {
                        element.setAttribute('data-rtl-container-processed', 'true');
                        // Apply RTL to text elements that should be RTL (check each independently)
                        element.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li').forEach(el => {
                            if (shouldBeRTLText(el.textContent)) {
                                el.style.direction = 'rtl';
                                el.style.textAlign = 'right';
                                el.setAttribute('data-rtl-applied', 'true');
                                if (el.tagName === 'LI') {
                                    el.style.listStylePosition = 'inside';
                                }
                            }
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

            // Claude Code timeline/agent messages - process all child elements
            if (element.matches && element.matches('[class*="timelineMessage_"], [class*="root_"]')) {
                // For agent messages, check each paragraph/list independently
                processChildrenForRTL(element);
                element.setAttribute('data-rtl-container-processed', 'true');
                return;
            }

            // Default logic for Copilot/Claude user messages
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

        // Process chat history list items for RTL
        processHistoryList();

        // Ensure all code blocks are LTR (run after RTL processing)
        ensureCodeBlocksLTR();

        // Inject user message navigation buttons above input
        injectMessageNavigation();
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
                                // Claude Code timeline/agent messages - process all child elements
                                if (element.matches && element.matches('[class*="timelineMessage_"], [class*="root_"]')) {
                                    processChildrenForRTL(element);
                                    element.setAttribute('data-rtl-container-processed', 'true');
                                    return;
                                }

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
            injectMessageNavigation(); // Ensure nav buttons exist (handles late DOM)
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