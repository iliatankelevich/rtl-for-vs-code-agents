#!/bin/bash
# RTL for VS Code Agents - Diagnostic Script (macOS)
# Reads only. No changes are made.

echo "============================================"
echo "RTL for VS Code Agents - Diagnostics (macOS)"
echo "============================================"
echo ""

echo "=== SUMMARY ==="

VSCODE_EXT_DIR="$HOME/.vscode/extensions"
ANTIGRAVITY_EXT_DIR="$HOME/.antigravity/extensions"
VSCODE_SETTINGS="$HOME/Library/Application Support/Code/User/settings.json"

CLAUDE_VSCODE=$(find "$VSCODE_EXT_DIR" -maxdepth 1 -type d -name "anthropic.claude-code-*" 2>/dev/null)
CLAUDE_ANTI=""
if [ -d "$ANTIGRAVITY_EXT_DIR" ]; then
    CLAUDE_ANTI=$(find "$ANTIGRAVITY_EXT_DIR" -maxdepth 1 -type d -name "anthropic.claude-code-*" 2>/dev/null)
fi

ANTI_CHAT_JS="/Applications/Antigravity.app/Contents/Resources/app/extensions/antigravity/out/media/chat.js"

echo "Claude VS Code versions found: $(echo "$CLAUDE_VSCODE" | sed '/^$/d' | wc -l | tr -d ' ')"
echo "Claude Antigravity versions found: $(echo "$CLAUDE_ANTI" | sed '/^$/d' | wc -l | tr -d ' ')"
echo "Antigravity chat.js exists: $( [ -f "$ANTI_CHAT_JS" ] && echo true || echo false )"
echo "Settings exists: $( [ -f "$VSCODE_SETTINGS" ] && echo true || echo false )"
echo ""

echo "=== DETAILS ==="

echo "\n-- Claude Code (VS Code) --"
if [ -z "$(echo "$CLAUDE_VSCODE" | sed '/^$/d')" ]; then
    echo "   None found"
else
    while read -r ext; do
        [ -z "$ext" ] && continue
        index_js="$ext/webview/index.js"
        backup="$index_js.backup"
        injected=false
        if [ -f "$index_js" ] && grep -q "RTL Support for VS Code AI Chat Agents" "$index_js"; then
            injected=true
        fi
        echo "   Name: $(basename "$ext")"
        echo "   Path: $ext"
        echo "   index.js exists: $( [ -f "$index_js" ] && echo true || echo false )"
        echo "   backup exists:   $( [ -f "$backup" ] && echo true || echo false )"
        echo "   injected marker: $injected"
        echo ""
    done <<< "$CLAUDE_VSCODE"
fi

echo "-- Claude Code (Antigravity) --"
if [ -z "$(echo "$CLAUDE_ANTI" | sed '/^$/d')" ]; then
    echo "   None found"
else
    while read -r ext; do
        [ -z "$ext" ] && continue
        index_js="$ext/webview/index.js"
        backup="$index_js.backup"
        injected=false
        if [ -f "$index_js" ] && grep -q "RTL Support for VS Code AI Chat Agents" "$index_js"; then
            injected=true
        fi
        echo "   Name: $(basename "$ext")"
        echo "   Path: $ext"
        echo "   index.js exists: $( [ -f "$index_js" ] && echo true || echo false )"
        echo "   backup exists:   $( [ -f "$backup" ] && echo true || echo false )"
        echo "   injected marker: $injected"
        echo ""
    done <<< "$CLAUDE_ANTI"
fi

echo "-- Antigravity chat.js --"
chat_injected=false
if [ -f "$ANTI_CHAT_JS" ] && grep -q "RTL Support for Google Antigravity" "$ANTI_CHAT_JS"; then
    chat_injected=true
fi
echo "   Path: $ANTI_CHAT_JS"
echo "   chat.js exists:  $( [ -f "$ANTI_CHAT_JS" ] && echo true || echo false )"
echo "   backup exists:   $( [ -f "$ANTI_CHAT_JS.backup" ] && echo true || echo false )"
echo "   injected marker: $chat_injected"

echo "\n-- settings.json --"
settings_has_imports=false
settings_contains_rtl=false
if [ -f "$VSCODE_SETTINGS" ]; then
    if grep -q '"vscode_custom_css\.imports"' "$VSCODE_SETTINGS"; then settings_has_imports=true; fi
    if grep -q "rtl-for-vscode-agents\.js" "$VSCODE_SETTINGS"; then settings_contains_rtl=true; fi
fi
echo "   Path: $VSCODE_SETTINGS"
echo "   exists:              $( [ -f "$VSCODE_SETTINGS" ] && echo true || echo false )"
echo "   has custom imports:  $settings_has_imports"
echo "   contains RTL script: $settings_contains_rtl"

echo "\n-- RTL script files --"
found_any=false
for p in "$HOME/vscode-custom/rtl-for-vscode-agents.js" "$HOME/rtl-for-vscode-agents.js"; do
    if [ -f "$p" ]; then
        found_any=true
        echo "   $p"
    fi
done
if [ "$found_any" = false ]; then
    echo "   None found"
fi

extract_selectors() {
    local file="$1"
    local type="$2"
    local block
    if [ "$type" = "chat" ]; then
        block=$(awk '/chatSelectors: *\[/{flag=1;next} /\]/{if(flag){flag=0}} flag{print}' "$file")
    else
        block=$(awk '/inputSelectors: *\[/{flag=1;next} /\]/{if(flag){flag=0}} flag{print}' "$file")
    fi
    printf "%s" "$block" | grep -o "'[^']\+'" | sed "s/'//g"
}

print_selectors() {
    local label="$1"
    local file="$2"
    echo "   $label"
    if [ ! -f "$file" ]; then
        echo "     File not found: $file"
        return
    fi

    echo "     Chat selectors:"
    chat_list=$(extract_selectors "$file" "chat")
    if [ -z "$chat_list" ]; then
        echo "       None found"
    else
        while read -r sel; do
            [ -z "$sel" ] && continue
            echo "       $sel"
        done <<< "$chat_list"
    fi

    echo "     Input selectors:"
    input_list=$(extract_selectors "$file" "input")
    if [ -z "$input_list" ]; then
        echo "       None found"
    else
        while read -r sel; do
            [ -z "$sel" ] && continue
            echo "       $sel"
        done <<< "$input_list"
    fi
}

echo "\n-- Selectors (from injected files) --"
if [ -n "$(echo "$CLAUDE_VSCODE" | sed '/^$/d')" ]; then
    while read -r ext; do
        [ -z "$ext" ] && continue
        print_selectors "Claude VS Code ($(basename "$ext"))" "$ext/webview/index.js"
    done <<< "$CLAUDE_VSCODE"
fi

if [ -n "$(echo "$CLAUDE_ANTI" | sed '/^$/d')" ]; then
    while read -r ext; do
        [ -z "$ext" ] && continue
        print_selectors "Claude Antigravity ($(basename "$ext"))" "$ext/webview/index.js"
    done <<< "$CLAUDE_ANTI"
fi

if [ -f "$ANTI_CHAT_JS" ]; then
    print_selectors "Antigravity chat.js" "$ANTI_CHAT_JS"
fi

echo "\n-- Selectors (from rtl-for-vs-code-agents.js) --"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RTL_SCRIPT="$SCRIPT_DIR/rtl-for-vs-code-agents.js"
if [ ! -f "$RTL_SCRIPT" ]; then
    echo "   Script not found at: $RTL_SCRIPT"
else
    echo "   Chat selectors:"
    chat_list=$(extract_selectors "$RTL_SCRIPT" "chat")
    if [ -z "$chat_list" ]; then
        echo "     None found"
    else
        while read -r sel; do
            [ -z "$sel" ] && continue
            echo "     $sel"
        done <<< "$chat_list"
    fi

    echo "   Input selectors:"
    input_list=$(extract_selectors "$RTL_SCRIPT" "input")
    if [ -z "$input_list" ]; then
        echo "     None found"
    else
        while read -r sel; do
            [ -z "$sel" ] && continue
            echo "     $sel"
        done <<< "$input_list"
    fi
fi

echo "\n-- Other selectors used (hardcoded) --"
other_selectors=(
    "div.code"
    "pre"
    "code"
    "p"
    "li"
    "h1"
    "h2"
    "h3"
    "h4"
    "h5"
    "h6"
    "ul"
    "ol"
    ".monaco-editor"
    ".view-lines"
    ".view-line"
)
for sel in "${other_selectors[@]}"; do
    echo "   $sel"
done
