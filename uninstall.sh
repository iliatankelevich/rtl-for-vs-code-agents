#!/bin/bash

# RTL for VS Code Agents - Uninstall Script
# This script removes all RTL injections and restores original files (Mac/Linux)

echo "============================================"
echo "RTL for VS Code Agents - Uninstaller"
echo "============================================"
echo ""

RESTORED_COUNT=0
ERROR_COUNT=0

# Helper function to restore a webview file from backup
restore_webview_backup() {
    local extension_path="$1"
    local webview_file="$2"
    local location="$3"

    local target_js="$extension_path/$webview_file"
    local backup_path="$target_js.backup"
    local file_name="$(basename "$webview_file")"

    if [ -f "$backup_path" ]; then
        if rm -f "$target_js" && mv "$backup_path" "$target_js"; then
            echo "   OK Restored $file_name from backup ($location)"
            return 0
        else
            echo "   X Error restoring $file_name ($location)"
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
    CURSOR_EXT_DIR="$HOME/.cursor/extensions"
    ANTIGRAVITY_EXT_DIR="$HOME/.antigravity/extensions"
else
    VSCODE_DIR="$HOME/.config/Code"
    EXTENSIONS_DIR="$HOME/.vscode/extensions"
    CURSOR_EXT_DIR="$HOME/.cursor/extensions"
    ANTIGRAVITY_EXT_DIR="$HOME/.antigravity/extensions"
fi

SETTINGS_FILE="$VSCODE_DIR/User/settings.json"

# 1. Restore Claude Code

echo "Step 1: Restoring Claude Code..."

CLAUDE_VSCODE_EXTENSIONS=$(find "$EXTENSIONS_DIR" -maxdepth 1 -type d -name "anthropic.claude-code-*" 2>/dev/null)
CLAUDE_CURSOR_EXTENSIONS=""
if [ -d "$CURSOR_EXT_DIR" ]; then
    CLAUDE_CURSOR_EXTENSIONS=$(find "$CURSOR_EXT_DIR" -maxdepth 1 -type d -name "anthropic.claude-code-*" 2>/dev/null)
fi
CLAUDE_ANTIGRAVITY_EXTENSIONS=""
if [ -d "$ANTIGRAVITY_EXT_DIR" ]; then
    CLAUDE_ANTIGRAVITY_EXTENSIONS=$(find "$ANTIGRAVITY_EXT_DIR" -maxdepth 1 -type d -name "anthropic.claude-code-*" 2>/dev/null)
fi

if [ -n "$CLAUDE_VSCODE_EXTENSIONS" ]; then
    while read -r ext; do
        [ -z "$ext" ] && continue
        echo "   Processing VS Code ($(basename "$ext"))..."
        restore_webview_backup "$ext" "webview/index.js" "VS Code"
        case $? in
            0) RESTORED_COUNT=$((RESTORED_COUNT + 1)) ;;
            1) ERROR_COUNT=$((ERROR_COUNT + 1)) ;;
        esac
    done <<< "$CLAUDE_VSCODE_EXTENSIONS"
fi

if [ -n "$CLAUDE_CURSOR_EXTENSIONS" ]; then
    while read -r ext; do
        [ -z "$ext" ] && continue
        echo "   Processing Cursor ($(basename "$ext"))..."
        restore_webview_backup "$ext" "webview/index.js" "Cursor"
        case $? in
            0) RESTORED_COUNT=$((RESTORED_COUNT + 1)) ;;
            1) ERROR_COUNT=$((ERROR_COUNT + 1)) ;;
        esac
    done <<< "$CLAUDE_CURSOR_EXTENSIONS"
fi

if [ -n "$CLAUDE_ANTIGRAVITY_EXTENSIONS" ]; then
    while read -r ext; do
        [ -z "$ext" ] && continue
        echo "   Processing Antigravity ($(basename "$ext"))..."
        restore_webview_backup "$ext" "webview/index.js" "Antigravity"
        case $? in
            0) RESTORED_COUNT=$((RESTORED_COUNT + 1)) ;;
            1) ERROR_COUNT=$((ERROR_COUNT + 1)) ;;
        esac
    done <<< "$CLAUDE_ANTIGRAVITY_EXTENSIONS"
fi

if [ -z "$CLAUDE_VSCODE_EXTENSIONS" ] && [ -z "$CLAUDE_CURSOR_EXTENSIONS" ] && [ -z "$CLAUDE_ANTIGRAVITY_EXTENSIONS" ]; then
    echo "   - Claude Code extension not found"
fi

echo ""

# 2. Restore Gemini Code Assist

echo "Step 2: Restoring Gemini Code Assist..."

GEMINI_VSCODE_EXTENSIONS=$(find "$EXTENSIONS_DIR" -maxdepth 1 -type d -name "google.geminicodeassist-*" 2>/dev/null)
GEMINI_CURSOR_EXTENSIONS=""
if [ -d "$CURSOR_EXT_DIR" ]; then
    GEMINI_CURSOR_EXTENSIONS=$(find "$CURSOR_EXT_DIR" -maxdepth 1 -type d -name "google.geminicodeassist-*" 2>/dev/null)
fi

if [ -n "$GEMINI_VSCODE_EXTENSIONS" ]; then
    while read -r ext; do
        [ -z "$ext" ] && continue
        echo "   Processing VS Code ($(basename "$ext"))..."
        restore_webview_backup "$ext" "webview/app_bundle.js" "VS Code"
        case $? in
            0) RESTORED_COUNT=$((RESTORED_COUNT + 1)) ;;
            1) ERROR_COUNT=$((ERROR_COUNT + 1)) ;;
        esac
    done <<< "$GEMINI_VSCODE_EXTENSIONS"
fi

if [ -n "$GEMINI_CURSOR_EXTENSIONS" ]; then
    while read -r ext; do
        [ -z "$ext" ] && continue
        echo "   Processing Cursor ($(basename "$ext"))..."
        restore_webview_backup "$ext" "webview/app_bundle.js" "Cursor"
        case $? in
            0) RESTORED_COUNT=$((RESTORED_COUNT + 1)) ;;
            1) ERROR_COUNT=$((ERROR_COUNT + 1)) ;;
        esac
    done <<< "$GEMINI_CURSOR_EXTENSIONS"
fi

if [ -z "$GEMINI_VSCODE_EXTENSIONS" ] && [ -z "$GEMINI_CURSOR_EXTENSIONS" ]; then
    echo "   - Gemini Code Assist extension not found"
fi

echo ""

# 3. Restore Google Antigravity

echo "Step 3: Restoring Google Antigravity..."

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

# 4. Clean up settings.json (optional)

echo "Step 4: Cleaning settings.json..."

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
    echo "1. Reload VS Code to apply changes: Ctrl+Shift+P -> Reload Window"
    echo "2. RTL support has been removed"
    echo ""
fi

echo ""
read -n 1 -s -r -p "Press any key to exit..."
echo ""
