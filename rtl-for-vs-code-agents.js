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
     * Inject an RLM (Right-to-Left Mark) character at the start of an element
     * to anchor BiDi direction when the first child is an inline element with LTR text
     */
    function injectRLM(el) {
        const RLM = '\u200F';
        const first = el.firstChild;
        // Already injected?
        if (first && first.nodeType === Node.TEXT_NODE && first.textContent.startsWith(RLM)) return;
        el.insertBefore(document.createTextNode(RLM), first);
    }

    /**
     * Apply RTL styling to an element
     */
    function applyRTL(element) {
        element.style.direction = 'rtl';
        element.style.textAlign = 'right';
        element.style.unicodeBidi = 'isolate';
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
                el.style.unicodeBidi = 'isolate';
                if (el.tagName === 'LI') {
                    el.style.listStylePosition = 'inside';
                }
                // Inject RLM (Right-to-Left Mark) at the start to anchor BiDi direction
                // when the first visible child is an inline element with LTR content
                injectRLM(el);
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
            /* User message borders — injected dynamically by applyUserMessageBorder() */

            /* Copilot / VS Code Chat — user message accent border (also dynamic) */

            /* Bright scrollbar for chat panel */
            * {
                scrollbar-color: rgba(255, 255, 255, 0.45) transparent !important;
                scrollbar-width: auto !important;
            }
            ::-webkit-scrollbar {
                width: 10px !important;
                height: 10px !important;
            }
            ::-webkit-scrollbar-track {
                background: transparent !important;
            }
            ::-webkit-scrollbar-thumb {
                background: rgba(255, 255, 255, 0.45) !important;
                border-radius: 5px !important;
            }
            ::-webkit-scrollbar-thumb:hover {
                background: rgba(255, 255, 255, 0.7) !important;
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

            /* YOLO mode toggle button */
            #rtl-yolo-btn {
                font-size: 13px;
                line-height: 1;
                filter: grayscale(1);
                transition: filter 0.2s, transform 0.15s;
            }
            #rtl-yolo-btn.yolo-active {
                filter: grayscale(0);
                transform: scale(1.15);
            }
            @keyframes yolo-pulse {
                0%, 100% { filter: grayscale(0); transform: scale(1.15); }
                50%      { filter: grayscale(0); transform: scale(1.3); }
            }
            #rtl-yolo-btn.yolo-active {
                animation: yolo-pulse 1.5s ease-in-out infinite;
            }
            /* YOLO countdown overlay */
            .yolo-countdown {
                display: flex;
                align-items: center;
                gap: 6px;
                padding: 4px 8px;
                background: rgba(30, 30, 30, 0.92);
                border: 1px solid rgba(249, 131, 131, 0.5);
                border-radius: 6px;
                position: fixed;
                bottom: 60px;
                right: 16px;
                z-index: 99999;
                box-shadow: 0 2px 12px rgba(0,0,0,0.4);
                font-family: system-ui, sans-serif;
                font-size: 12px;
                color: rgba(255,255,255,0.85);
            }
            .yolo-countdown-bar-track {
                width: 120px;
                height: 6px;
                background: rgba(255,255,255,0.1);
                border-radius: 3px;
                overflow: hidden;
            }
            .yolo-countdown-bar-fill {
                height: 100%;
                background: linear-gradient(90deg, #f98383, #ff6b6b);
                border-radius: 3px;
                transition: width 0.1s linear;
            }
            .yolo-countdown-no {
                background: #d32f2f;
                color: #fff;
                border: none;
                border-radius: 4px;
                padding: 2px 8px;
                font-size: 11px;
                font-weight: 700;
                cursor: pointer;
                white-space: nowrap;
            }
            .yolo-countdown-no:hover {
                background: #b71c1c;
            }

            /* YOLO settings popup (right-click on 💪) */
            .yolo-settings-popup {
                position: fixed;
                z-index: 100000;
                background: var(--vscode-menu-background, #252526);
                border: 1px solid var(--vscode-menu-border, #454545);
                border-radius: 6px;
                padding: 8px 10px;
                box-shadow: 0 4px 16px rgba(0,0,0,0.5);
                font-family: system-ui, sans-serif;
                font-size: 12px;
                color: var(--vscode-menu-foreground, rgba(255,255,255,0.85));
                display: flex;
                align-items: center;
                gap: 6px;
                white-space: nowrap;
            }
            .yolo-settings-popup input[type="number"] {
                width: 48px;
                padding: 2px 4px;
                border: 1px solid var(--vscode-input-border, #3c3c3c);
                border-radius: 3px;
                background: var(--vscode-input-background, #1e1e1e);
                color: var(--vscode-input-foreground, #ccc);
                font-size: 12px;
                text-align: center;
            }
            .yolo-settings-popup .yolo-settings-hint {
                opacity: 0.55;
                font-size: 10px;
            }

            /* Border toggle popup (right-click on ↑↓) */
            .rtl-border-popup {
                position: fixed;
                z-index: 100000;
                background: var(--vscode-menu-background, #252526);
                border: 1px solid var(--vscode-menu-border, #454545);
                border-radius: 6px;
                padding: 8px 10px;
                box-shadow: 0 4px 16px rgba(0,0,0,0.5);
                font-family: system-ui, sans-serif;
                font-size: 12px;
                color: var(--vscode-menu-foreground, rgba(255,255,255,0.85));
                display: flex;
                align-items: center;
                gap: 8px;
                white-space: nowrap;
                cursor: pointer;
                user-select: none;
            }
            .rtl-border-popup:hover {
                background: var(--vscode-menu-selectionBackground, #094771);
            }
            .rtl-border-toggle {
                width: 32px;
                height: 16px;
                border-radius: 8px;
                background: rgba(255,255,255,0.15);
                position: relative;
                transition: background 0.2s;
                flex-shrink: 0;
            }
            .rtl-border-toggle.on {
                background: #4caf50;
            }
            .rtl-border-toggle::after {
                content: '';
                position: absolute;
                width: 12px;
                height: 12px;
                border-radius: 50%;
                background: #fff;
                top: 2px;
                left: 2px;
                transition: transform 0.2s;
            }
            .rtl-border-toggle.on::after {
                transform: translateX(16px);
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

    // ─── YOLO Mode (auto-approve with countdown) ──────────────────
    let yoloPollId = null;
    let yoloRunning = false;
    let yoloCountdownActive = false;  // true while a countdown is in progress
    let yoloCancelledBtn = null;      // ref to the button the user cancelled — skip until it leaves DOM
    let yoloCountdownCancel = null;   // cancel function for active countdown
    const YOLO_LS_KEY = 'rtl-yolo-delay-ms';
    const YOLO_POLL_MS = 500;
    const BORDER_LS_KEY = 'rtl-user-msg-border';

    // Seed localStorage from injected config (only if not already set by user)
    if (localStorage.getItem(YOLO_LS_KEY) === null) {
        const seed = (window.__RTL_CONFIG__ && typeof window.__RTL_CONFIG__.yoloDelayMs === 'number')
            ? window.__RTL_CONFIG__.yoloDelayMs : 5000;
        localStorage.setItem(YOLO_LS_KEY, String(seed));
    }
    if (localStorage.getItem(BORDER_LS_KEY) === null) {
        const seed = (window.__RTL_CONFIG__ && typeof window.__RTL_CONFIG__.userMessageBorder === 'boolean')
            ? window.__RTL_CONFIG__.userMessageBorder : true;
        localStorage.setItem(BORDER_LS_KEY, String(seed));
    }

    /** Read YOLO delay dynamically — changes take effect on next poll without reload */
    function getYoloDelayMs() {
        const v = parseInt(localStorage.getItem(YOLO_LS_KEY), 10);
        return isNaN(v) ? 5000 : v;
    }
    function setYoloDelayMs(ms) {
        localStorage.setItem(YOLO_LS_KEY, String(Math.max(0, ms)));
    }

    // ─── User message border toggle ──────────────────────────────────
    function getUserMessageBorder() {
        return localStorage.getItem(BORDER_LS_KEY) !== 'false';
    }
    function setUserMessageBorder(on) {
        localStorage.setItem(BORDER_LS_KEY, String(on));
        applyUserMessageBorder();
    }

    /** Dynamically inject or remove the user message border style */
    function applyUserMessageBorder() {
        const STYLE_ID = 'rtl-user-msg-border-style';
        let el = document.getElementById(STYLE_ID);
        const enabled = getUserMessageBorder();

        if (enabled) {
            if (!el) {
                el = document.createElement('style');
                el.id = STYLE_ID;
                el.textContent = `
                    [class*="userMessage_"] {
                        border: 2px solid #f98383 !important;
                    }
                    .interactive-request .chat-markdown-part {
                        border: 2px solid #f98383 !important;
                        border-radius: 4px;
                        padding: 4px 8px;
                    }
                `;
                document.head.appendChild(el);
            }
        } else {
            if (el) el.remove();
        }
    }

    // Apply on startup
    applyUserMessageBorder();
    // ────────────────────────────────────────────────────────────────

    function findYesButton(doc) {
        if (!doc) return null;
        const buttons = doc.querySelectorAll('button');

        // Strategy 1: button with "Yes" text and a span containing "1"
        for (const button of buttons) {
            const text = button.textContent?.trim() || '';
            if (text.includes('Yes')) {
                const span = button.querySelector('span');
                if (span && span.textContent?.trim() === '1') {
                    return button;
                }
            }
        }

        // Strategy 2: exact text patterns
        for (const button of buttons) {
            const text = button.textContent?.trim() || '';
            if (text === '1 Yes' || text === 'Yes 1' || text === '1Yes') {
                return button;
            }
        }

        // Strategy 3: any button with "Yes" and a digit
        for (const button of buttons) {
            const text = button.textContent?.trim() || '';
            if (text.includes('Yes') && /\d/.test(text)) {
                return button;
            }
        }

        // Recursively check iframes
        const iframes = doc.querySelectorAll('iframe');
        for (const iframe of iframes) {
            try {
                const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
                if (iframeDoc) {
                    const found = findYesButton(iframeDoc);
                    if (found) return found;
                }
            } catch (e) { /* cross-origin */ }
        }
        return null;
    }

    /**
     * Show a countdown overlay, then click the button.
     * Returns a cancel function. If the user cancels (NO!) the button is NOT clicked.
     */
    function showCountdown(targetButton) {
        yoloCountdownActive = true;

        // Build overlay
        const overlay = document.createElement('div');
        overlay.className = 'yolo-countdown';

        const label = document.createElement('span');
        label.textContent = '💪 YOLO';

        const track = document.createElement('div');
        track.className = 'yolo-countdown-bar-track';
        const fill = document.createElement('div');
        fill.className = 'yolo-countdown-bar-fill';
        fill.style.width = '100%';
        track.appendChild(fill);

        const timer = document.createElement('span');
        timer.style.minWidth = '28px';
        timer.style.textAlign = 'center';

        const noBtn = document.createElement('button');
        noBtn.className = 'yolo-countdown-no';
        noBtn.textContent = 'NO!';

        overlay.appendChild(label);
        overlay.appendChild(track);
        overlay.appendChild(timer);
        overlay.appendChild(noBtn);
        document.body.appendChild(overlay);

        const delayMs = getYoloDelayMs(); // snapshot once per countdown
        const startTime = Date.now();
        let cancelled = false;
        let animFrame;

        function tick() {
            // If the Yes button disappeared (user clicked YES manually), cancel silently
            if (!targetButton.isConnected && !cancelled) {
                cleanup();
                console.log('YOLO: Yes button gone (manual click?) — countdown dismissed');
                return;
            }

            const elapsed = Date.now() - startTime;
            const remaining = Math.max(0, delayMs - elapsed);
            const pct = (remaining / delayMs) * 100;
            fill.style.width = pct + '%';
            timer.textContent = (remaining / 1000).toFixed(1) + 's';

            if (remaining <= 0 && !cancelled) {
                cleanup();
                if (targetButton.isConnected) {
                    console.log('YOLO: auto-clicking Yes');
                    targetButton.click();
                }
                return;
            }
            animFrame = requestAnimationFrame(tick);
        }

        function cleanup() {
            yoloCountdownActive = false;
            yoloCountdownCancel = null;
            cancelAnimationFrame(animFrame);
            overlay.remove();
        }

        function cancel() {
            cancelled = true;
            // Remember this button so poll skips it until it leaves the DOM
            yoloCancelledBtn = targetButton;
            cleanup();
            console.log('YOLO: cancelled by user');
        }

        noBtn.addEventListener('click', (e) => { e.stopPropagation(); cancel(); });
        animFrame = requestAnimationFrame(tick);

        yoloCountdownCancel = cancel;
        return cancel;
    }

    /** Poll for Yes buttons; when found start a countdown instead of clicking immediately */
    function yoloPoll() {
        if (yoloCountdownActive) return; // countdown in progress, skip

        // Clear cancelled-button ref once it leaves the DOM
        if (yoloCancelledBtn && !yoloCancelledBtn.isConnected) {
            yoloCancelledBtn = null;
        }

        const btn = findYesButton(document);
        if (btn) {
            // Skip if this is the same button the user already cancelled
            if (btn === yoloCancelledBtn) return;

            // 0 delay = instant approve, no progress bar
            if (getYoloDelayMs() <= 0) {
                console.log('YOLO: instant auto-clicking Yes');
                btn.click();
                return;
            }

            showCountdown(btn);
        }
    }

    function startYolo() {
        if (yoloRunning) return;
        yoloRunning = true;
        yoloPoll();
        yoloPollId = setInterval(yoloPoll, YOLO_POLL_MS);
        console.log('💪 YOLO mode ON');
    }

    function stopYolo() {
        if (!yoloRunning) return;
        yoloRunning = false;
        if (yoloPollId) { clearInterval(yoloPollId); yoloPollId = null; }
        // Remove any active countdown overlay
        const overlay = document.querySelector('.yolo-countdown');
        if (overlay) overlay.remove();
        yoloCountdownActive = false;
        console.log('💪 YOLO mode OFF');
    }

    function toggleYolo() {
        yoloRunning ? stopYolo() : startYolo();
        // Update button visual
        const btn = document.getElementById('rtl-yolo-btn');
        if (btn) btn.classList.toggle('yolo-active', yoloRunning);
        return yoloRunning;
    }
    // ────────────────────────────────────────────────────────────────

    /**
     * Show a small settings popup near the YOLO button (right-click)
     */
    function showYoloSettings(e) {
        // Remove any existing popup
        const existing = document.querySelector('.yolo-settings-popup');
        if (existing) { existing.remove(); return; }

        const popup = document.createElement('div');
        popup.className = 'yolo-settings-popup';

        const lbl = document.createElement('span');
        lbl.textContent = '⏱ Delay:';

        const input = document.createElement('input');
        input.type = 'number';
        input.min = '0';
        input.max = '30';
        input.step = '1';
        input.value = String(getYoloDelayMs() / 1000);

        const unit = document.createElement('span');
        unit.textContent = 'sec';

        const hint = document.createElement('span');
        hint.className = 'yolo-settings-hint';
        hint.textContent = '(0 = instant)';

        popup.appendChild(lbl);
        popup.appendChild(input);
        popup.appendChild(unit);
        popup.appendChild(hint);

        // Position near the button
        popup.style.bottom = '40px';
        popup.style.right = '16px';
        document.body.appendChild(popup);

        // Save on change
        input.addEventListener('input', () => {
            const secs = parseFloat(input.value);
            if (!isNaN(secs) && secs >= 0) {
                setYoloDelayMs(Math.round(secs * 1000));
            }
        });

        // Close on outside click
        function onOutsideClick(ev) {
            if (!popup.contains(ev.target)) {
                popup.remove();
                document.removeEventListener('mousedown', onOutsideClick, true);
            }
        }
        // Delay listener so the current contextmenu event doesn't close it immediately
        setTimeout(() => document.addEventListener('mousedown', onOutsideClick, true), 0);

        // Focus the input
        input.focus();
        input.select();
    }

    /**
     * Show a toggle popup for user message borders (right-click on ↑↓)
     */
    function showBorderToggle(e) {
        // Remove any existing popup
        const existing = document.querySelector('.rtl-border-popup');
        if (existing) { existing.remove(); return; }

        const popup = document.createElement('div');
        popup.className = 'rtl-border-popup';

        const toggle = document.createElement('div');
        toggle.className = 'rtl-border-toggle' + (getUserMessageBorder() ? ' on' : '');

        const lbl = document.createElement('span');
        lbl.textContent = 'User message border';

        popup.appendChild(toggle);
        popup.appendChild(lbl);

        // Position near the buttons
        popup.style.bottom = '40px';
        popup.style.right = '16px';
        document.body.appendChild(popup);

        // Toggle on click
        popup.addEventListener('click', (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            const newVal = !getUserMessageBorder();
            setUserMessageBorder(newVal);
            toggle.classList.toggle('on', newVal);
        });

        // Close on outside click
        function onOutsideClick(ev) {
            if (!popup.contains(ev.target)) {
                popup.remove();
                document.removeEventListener('mousedown', onOutsideClick, true);
            }
        }
        setTimeout(() => document.addEventListener('mousedown', onOutsideClick, true), 0);
    }

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
        // Prevent clicks from bubbling into the chat input area
        nav.addEventListener('mousedown', (e) => e.preventDefault());

        // Up button
        const upBtn = document.createElement('button');
        upBtn.title = 'Previous user message (↑)';
        upBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5"/></svg>';
        upBtn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); navigateUserMessages(-1); });
        upBtn.addEventListener('contextmenu', (e) => { e.preventDefault(); e.stopPropagation(); showBorderToggle(e); });

        // Down button
        const downBtn = document.createElement('button');
        downBtn.title = 'Next user message (↓)';
        downBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/></svg>';
        downBtn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); navigateUserMessages(1); });
        downBtn.addEventListener('contextmenu', (e) => { e.preventDefault(); e.stopPropagation(); showBorderToggle(e); });

        // YOLO mode toggle button
        const yoloBtn = document.createElement('button');
        yoloBtn.id = 'rtl-yolo-btn';
        yoloBtn.title = 'YOLO mode: auto-approve all tool calls';
        yoloBtn.textContent = '💪';
        if (yoloRunning) yoloBtn.classList.add('yolo-active');
        yoloBtn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); toggleYolo(); });
        yoloBtn.addEventListener('contextmenu', (e) => { e.preventDefault(); e.stopPropagation(); showYoloSettings(e); });

        nav.appendChild(upBtn);
        nav.appendChild(downBtn);
        nav.appendChild(yoloBtn);

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
                el.style.unicodeBidi = 'isolate';
                el.style.fontFamily = CONFIG.fontFamily;
                el.setAttribute('data-rtl-applied', 'true');
                if (el.tagName === 'LI') {
                    el.style.listStylePosition = 'inside';
                }
                injectRLM(el);
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

    // Expose YOLO mode toggle and settings
    window.toggleYOLO = toggleYolo;
    window.setYoloDelay = function(secs) { setYoloDelayMs(Math.round(secs * 1000)); console.log('YOLO delay set to ' + secs + 's'); };
    window.getYoloDelay = function() { return getYoloDelayMs() / 1000; };

    // Expose function to check RTL status
    window.checkRTL = function(text) {
        console.log(`Text: "${text}"`);
        console.log(`Contains RTL: ${containsRTL(text)}`);
    };

    console.log('🔄 RTL for VS Code Agents loaded. Use window.refreshRTL() to manually refresh.');
})();