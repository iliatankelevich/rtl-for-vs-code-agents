#!/bin/bash

# RTL for VS Code Agents - Uninstall Script
# This script removes all RTL injections and restores original files (Mac/Linux)

echo "============================================"
echo "RTL for VS Code Agents - Uninstaller"
echo "============================================"
echo ""

RESTORED_COUNT=0
ERROR_COUNT=0

# Helper function to restore Claude Code backup
restore_claude_backup() {
    local extension_path="$1"
    local location="$2"

    local index_js="$extension_path/webview/index.js"
    local backup_path="$index_js.backup"

    if [ -f "$backup_path" ]; then
        if rm -f "$index_js" && mv "$backup_path" "$index_js"; then
            echo "   OK Restored index.js from backup ($location)"
            return 0
        else
            echo "   X Error restoring index.js ($location)"
            return 1
        fi
    else
        echo "   - No backup found ($location)"
        return 2
    fi
}

# Detect OS paths
if [[ "$OSTYPE" == "darwin"* ]]; then
    VSCODE_DIR="$HOME/Library/Application Support/Code"
    EXTENSIONS_DIR="$HOME/.vscode/extensions"
    ANTIGRAVITY_EXT_DIR="$HOME/.antigravity/extensions"
else
    VSCODE_DIR="$HOME/.config/Code"
    EXTENSIONS_DIR="$HOME/.vscode/extensions"
    ANTIGRAVITY_EXT_DIR="$HOME/.antigravity/extensions"
fi

SETTINGS_FILE="$VSCODE_DIR/User/settings.json"

# 1. Restore Claude Code

echo "Step 1: Restoring Claude Code..."

CLAUDE_VSCODE_EXTENSIONS=$(find "$EXTENSIONS_DIR" -maxdepth 1 -type d -name "anthropic.claude-code-*" 2>/dev/null)
CLAUDE_ANTIGRAVITY_EXTENSIONS=""
if [ -d "$ANTIGRAVITY_EXT_DIR" ]; then
    CLAUDE_ANTIGRAVITY_EXTENSIONS=$(find "$ANTIGRAVITY_EXT_DIR" -maxdepth 1 -type d -name "anthropic.claude-code-*" 2>/dev/null)
fi

if [ -n "$CLAUDE_VSCODE_EXTENSIONS" ]; then
    while read -r ext; do
        [ -z "$ext" ] && continue
        echo "   Processing VS Code ($(basename "$ext"))..."
        restore_claude_backup "$ext" "VS Code"
        case $? in
            0) RESTORED_COUNT=$((RESTORED_COUNT + 1)) ;;
            1) ERROR_COUNT=$((ERROR_COUNT + 1)) ;;
        esac
    done <<< "$CLAUDE_VSCODE_EXTENSIONS"
fi

if [ -n "$CLAUDE_ANTIGRAVITY_EXTENSIONS" ]; then
    while read -r ext; do
        [ -z "$ext" ] && continue
        echo "   Processing Antigravity ($(basename "$ext"))..."
        restore_claude_backup "$ext" "Antigravity"
        case $? in
            0) RESTORED_COUNT=$((RESTORED_COUNT + 1)) ;;
            1) ERROR_COUNT=$((ERROR_COUNT + 1)) ;;
        esac
    done <<< "$CLAUDE_ANTIGRAVITY_EXTENSIONS"
fi

if [ -z "$CLAUDE_VSCODE_EXTENSIONS" ] && [ -z "$CLAUDE_ANTIGRAVITY_EXTENSIONS" ]; then
    echo "   - Claude Code extension not found"
fi

echo ""

# 2. Restore Google Antigravity

echo "Step 2: Restoring Google Antigravity..."

ANTIGRAVITY_CHAT_JS=""
if [[ "$OSTYPE" == "darwin"* ]]; then
    ANTIGRAVITY_CHAT_JS="/Applications/Antigravity.app/Contents/Resources/app/extensions/antigravity/out/media/chat.js"
else
    if [ -f "/opt/Antigravity/resources/app/extensions/antigravity/out/media/chat.js" ]; then
        ANTIGRAVITY_CHAT_JS="/opt/Antigravity/resources/app/extensions/antigravity/out/media/chat.js"
    elif [ -f "$HOME/.local/share/Antigravity/resources/app/extensions/antigravity/out/media/chat.js" ]; then
        ANTIGRAVITY_CHAT_JS="$HOME/.local/share/Antigravity/resources/app/extensions/antigravity/out/media/chat.js"
    fi
fi

if [ -n "$ANTIGRAVITY_CHAT_JS" ] && [ -f "$ANTIGRAVITY_CHAT_JS" ]; then
    BACKUP_PATH="$ANTIGRAVITY_CHAT_JS.backup"

    if [ -f "$BACKUP_PATH" ]; then
        if rm -f "$ANTIGRAVITY_CHAT_JS" && mv "$BACKUP_PATH" "$ANTIGRAVITY_CHAT_JS"; then
            echo "   OK Restored chat.js from backup"
            RESTORED_COUNT=$((RESTORED_COUNT + 1))
        else
            echo "   X Error restoring chat.js"
            ERROR_COUNT=$((ERROR_COUNT + 1))
        fi
    else
        echo "   - No backup found (chat.js.backup)"
    fi
else
    echo "   - Google Antigravity not found"
fi

echo ""

# 3. Clean up settings.json (optional)

echo "Step 3: Cleaning settings.json..."

if [ -f "$SETTINGS_FILE" ]; then
    read -p "Do you want to remove RTL script from settings.json? (y/n): " REMOVE_FROM_SETTINGS

    if [[ "$REMOVE_FROM_SETTINGS" =~ ^[Yy]$ ]]; then
        RAW_CONTENT="$(cat "$SETTINGS_FILE")"

        if echo "$RAW_CONTENT" | grep -Eq "rtl-for-vscode-agents\.js"; then
            UPDATED_CONTENT=$(printf "%s" "$RAW_CONTENT" | perl -0777 -pe 's/(?m)^\s*"[^"]*rtl-for-vscode-agents\.js[^"]*",?\s*\r?\n?//g; s/,(\s*[\r\n]*\s*[\,\]])/$1/g; s/,(\s*\])/$1/g;')
            printf "%s" "$UPDATED_CONTENT" > "$SETTINGS_FILE"
            echo "   OK Removed RTL script from settings.json"
            RESTORED_COUNT=$((RESTORED_COUNT + 1))
        else
            echo "   - RTL script not found in settings.json"
        fi
    else
        echo "   - Skipped settings.json cleanup"
    fi
else
    echo "   - settings.json not found"
fi

echo ""
echo "============================================"
echo "Uninstall Complete!"
echo "============================================"
echo ""
echo "Summary:"
echo "   Files restored: $RESTORED_COUNT"
echo "   Errors: $ERROR_COUNT"
echo ""

if [ $RESTORED_COUNT -gt 0 ]; then
    echo "Next steps:"
    echo "1. Restart VS Code and Antigravity"
    echo "2. RTL support has been removed"
    echo ""

    read -p "Do you want to restart VS Code now? (y/n): " RESTART_VSCODE
    if [[ "$RESTART_VSCODE" =~ ^[Yy]$ ]]; then
        echo "Restarting VS Code..."
        pkill -f "Visual Studio Code" 2>/dev/null || pkill -f "code" 2>/dev/null
        sleep 2
        if command -v code &> /dev/null; then
            code &
        else
            echo "VS Code command not found. Please start it manually."
        fi
    fi
fi

echo ""
read -n 1 -s -r -p "Press any key to exit..."
echo ""
