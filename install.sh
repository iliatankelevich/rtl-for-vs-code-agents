#!/bin/bash

# RTL for VS Code Agents - Installation Script
# This script automates the installation process for Mac/Linux

echo "============================================"
echo "RTL for VS Code Agents - Installer"
echo "============================================"
echo ""

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Track which agents were configured
CONFIGURED_AGENTS=()

# Detect OS
if [[ "$OSTYPE" == "darwin"* ]]; then
    EXTENSIONS_DIR="$HOME/.vscode/extensions"
    CURSOR_EXT_DIR="$HOME/.cursor/extensions"
    ANTIGRAVITY_EXT_DIR="$HOME/.antigravity/extensions"

    # Support VS Code stable and Insiders
    VSCODE_DIR_CANDIDATES=()
    [[ -d "$HOME/Library/Application Support/Code" ]] && VSCODE_DIR_CANDIDATES+=("$HOME/Library/Application Support/Code")
    [[ -d "$HOME/Library/Application Support/Code - Insiders" ]] && VSCODE_DIR_CANDIDATES+=("$HOME/Library/Application Support/Code - Insiders")
else
    EXTENSIONS_DIR="$HOME/.vscode/extensions"
    CURSOR_EXT_DIR="$HOME/.cursor/extensions"
    ANTIGRAVITY_EXT_DIR="$HOME/.antigravity/extensions"

    # Support VS Code stable and Insiders
    VSCODE_DIR_CANDIDATES=()
    [[ -d "$HOME/.config/Code" ]] && VSCODE_DIR_CANDIDATES+=("$HOME/.config/Code")
    [[ -d "$HOME/.config/Code - Insiders" ]] && VSCODE_DIR_CANDIDATES+=("$HOME/.config/Code - Insiders")
fi

# Pick VS Code config folder
if [ ${#VSCODE_DIR_CANDIDATES[@]} -eq 0 ]; then
    # Fallback to stable default
    if [[ "$OSTYPE" == "darwin"* ]]; then
        VSCODE_DIR="$HOME/Library/Application Support/Code"
    else
        VSCODE_DIR="$HOME/.config/Code"
    fi
elif [ ${#VSCODE_DIR_CANDIDATES[@]} -eq 1 ]; then
    VSCODE_DIR="${VSCODE_DIR_CANDIDATES[0]}"
else
    echo ""
    echo "Multiple VS Code profiles found:" 
    for i in "${!VSCODE_DIR_CANDIDATES[@]}"; do
        echo "  [$((i+1))] ${VSCODE_DIR_CANDIDATES[$i]}"
    done
    read -p "Select which settings.json to update (1-${#VSCODE_DIR_CANDIDATES[@]}): " VS_CODE_PICK
    if [[ "$VS_CODE_PICK" =~ ^[0-9]+$ ]] && [ "$VS_CODE_PICK" -ge 1 ] && [ "$VS_CODE_PICK" -le ${#VSCODE_DIR_CANDIDATES[@]} ]; then
        VSCODE_DIR="${VSCODE_DIR_CANDIDATES[$((VS_CODE_PICK-1))]}"
    else
        VSCODE_DIR="${VSCODE_DIR_CANDIDATES[0]}"
        echo "Invalid choice; defaulting to: $VSCODE_DIR"
    fi
fi

SETTINGS_FILE="$VSCODE_DIR/User/settings.json"

# 1. Find Claude Code extension folder
echo "Step 1: Locating Claude Code extension..."
# Find all versions
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
    echo "   Found in VS Code:"
    echo "$CLAUDE_VSCODE_EXTENSIONS" | while read -r match; do
        echo "   - $(basename "$match")"
    done
fi
if [ -n "$CLAUDE_CURSOR_EXTENSIONS" ]; then
    echo "   Found in Cursor:"
    echo "$CLAUDE_CURSOR_EXTENSIONS" | while read -r match; do
        echo "   - $(basename "$match")"
    done
fi
if [ -n "$CLAUDE_ANTIGRAVITY_EXTENSIONS" ]; then
    echo "   Found in Antigravity:"
    echo "$CLAUDE_ANTIGRAVITY_EXTENSIONS" | while read -r match; do
        echo "   - $(basename "$match")"
    done
fi

if [ -n "$CLAUDE_VSCODE_EXTENSIONS" ] || [ -n "$CLAUDE_CURSOR_EXTENSIONS" ] || [ -n "$CLAUDE_ANTIGRAVITY_EXTENSIONS" ]; then
    # Ask user if they want to inject into Claude Code
    read -p $'\nDo you want to inject RTL support into ALL found Claude Code versions? (y/n): ' INJECT_CLAUDE

    if [[ "$INJECT_CLAUDE" =~ ^[Yy]$ ]]; then
        if [ -n "$CLAUDE_VSCODE_EXTENSIONS" ]; then
            while read -r CLAUDE_EXTENSION; do
                [ -z "$CLAUDE_EXTENSION" ] && continue
                WEBVIEW_PATH="$CLAUDE_EXTENSION/webview"
                INDEX_JS="$WEBVIEW_PATH/index.js"

                echo "   Injecting into VS Code ($(basename "$CLAUDE_EXTENSION"))..."

                if [ -f "$INDEX_JS" ]; then
                    # Backup
                    BACKUP_PATH="$INDEX_JS.backup"
                    if [ ! -f "$BACKUP_PATH" ]; then
                        cp "$INDEX_JS" "$BACKUP_PATH"
                        echo "      Backup created: index.js.backup"
                    else
                        echo "      Backup already exists"
                    fi

                    echo "" >> "$INDEX_JS"
                    cat "$SCRIPT_DIR/rtl-for-vs-code-agents.js" >> "$INDEX_JS"
                    echo "      RTL script injected successfully!"

                    if [[ ! " ${CONFIGURED_AGENTS[*]} " =~ " Claude Code (VS Code) " ]]; then
                        CONFIGURED_AGENTS+=("Claude Code (VS Code)")
                    fi
                else
                    echo "      Error: index.js not found in webview folder"
                fi
            done <<< "$CLAUDE_VSCODE_EXTENSIONS"
        fi

        if [ -n "$CLAUDE_CURSOR_EXTENSIONS" ]; then
            while read -r CLAUDE_EXTENSION; do
                [ -z "$CLAUDE_EXTENSION" ] && continue
                WEBVIEW_PATH="$CLAUDE_EXTENSION/webview"
                INDEX_JS="$WEBVIEW_PATH/index.js"

                echo "   Injecting into Cursor ($(basename "$CLAUDE_EXTENSION"))..."

                if [ -f "$INDEX_JS" ]; then
                    # Backup
                    BACKUP_PATH="$INDEX_JS.backup"
                    if [ ! -f "$BACKUP_PATH" ]; then
                        cp "$INDEX_JS" "$BACKUP_PATH"
                        echo "      Backup created: index.js.backup"
                    else
                        echo "      Backup already exists"
                    fi

                    echo "" >> "$INDEX_JS"
                    cat "$SCRIPT_DIR/rtl-for-vs-code-agents.js" >> "$INDEX_JS"
                    echo "      RTL script injected successfully!"

                    if [[ ! " ${CONFIGURED_AGENTS[*]} " =~ " Claude Code (Cursor) " ]]; then
                        CONFIGURED_AGENTS+=("Claude Code (Cursor)")
                    fi
                else
                    echo "      Error: index.js not found in webview folder"
                fi
            done <<< "$CLAUDE_CURSOR_EXTENSIONS"
        fi

        if [ -n "$CLAUDE_ANTIGRAVITY_EXTENSIONS" ]; then
            while read -r CLAUDE_EXTENSION; do
                [ -z "$CLAUDE_EXTENSION" ] && continue
                WEBVIEW_PATH="$CLAUDE_EXTENSION/webview"
                INDEX_JS="$WEBVIEW_PATH/index.js"

                echo "   Injecting into Antigravity ($(basename "$CLAUDE_EXTENSION"))..."

                if [ -f "$INDEX_JS" ]; then
                    # Backup
                    BACKUP_PATH="$INDEX_JS.backup"
                    if [ ! -f "$BACKUP_PATH" ]; then
                        cp "$INDEX_JS" "$BACKUP_PATH"
                        echo "      Backup created: index.js.backup"
                    else
                        echo "      Backup already exists"
                    fi

                    echo "" >> "$INDEX_JS"
                    cat "$SCRIPT_DIR/rtl-for-vs-code-agents.js" >> "$INDEX_JS"
                    echo "      RTL script injected successfully!"

                    if [[ ! " ${CONFIGURED_AGENTS[*]} " =~ " Claude Code (Antigravity) " ]]; then
                        CONFIGURED_AGENTS+=("Claude Code (Antigravity)")
                    fi
                else
                    echo "      Error: index.js not found in webview folder"
                fi
            done <<< "$CLAUDE_ANTIGRAVITY_EXTENSIONS"
        fi
    fi
else
    echo "   Claude Code extension not found"
    echo "   Skipping Claude Code injection"
fi

echo ""

# 2. Find Gemini Code Assist extension
echo "Step 2: Locating Gemini Code Assist extension..."
GEMINI_VSCODE_EXTENSIONS=$(find "$EXTENSIONS_DIR" -maxdepth 1 -type d -name "google.geminicodeassist-*" 2>/dev/null)
GEMINI_CURSOR_EXTENSIONS=""
if [ -d "$CURSOR_EXT_DIR" ]; then
    GEMINI_CURSOR_EXTENSIONS=$(find "$CURSOR_EXT_DIR" -maxdepth 1 -type d -name "google.geminicodeassist-*" 2>/dev/null)
fi

if [ -n "$GEMINI_VSCODE_EXTENSIONS" ]; then
    echo "   Found in VS Code:"
    echo "$GEMINI_VSCODE_EXTENSIONS" | while read -r match; do
        echo "   - $(basename "$match")"
    done
fi
if [ -n "$GEMINI_CURSOR_EXTENSIONS" ]; then
    echo "   Found in Cursor:"
    echo "$GEMINI_CURSOR_EXTENSIONS" | while read -r match; do
        echo "   - $(basename "$match")"
    done
fi

if [ -n "$GEMINI_VSCODE_EXTENSIONS" ] || [ -n "$GEMINI_CURSOR_EXTENSIONS" ]; then
    read -p $'\nDo you want to inject RTL support into ALL found Gemini Code Assist versions? (y/n): ' INJECT_GEMINI

    if [[ "$INJECT_GEMINI" =~ ^[Yy]$ ]]; then
        if [ -n "$GEMINI_VSCODE_EXTENSIONS" ]; then
            while read -r GEMINI_EXTENSION; do
                [ -z "$GEMINI_EXTENSION" ] && continue
                APP_BUNDLE_JS="$GEMINI_EXTENSION/webview/app_bundle.js"

                echo "   Injecting into VS Code ($(basename "$GEMINI_EXTENSION"))..."

                if [ -f "$APP_BUNDLE_JS" ]; then
                    # Backup
                    BACKUP_PATH="$APP_BUNDLE_JS.backup"
                    if [ ! -f "$BACKUP_PATH" ]; then
                        cp "$APP_BUNDLE_JS" "$BACKUP_PATH"
                        echo "      Backup created: app_bundle.js.backup"
                    else
                        echo "      Backup already exists"
                    fi

                    echo "" >> "$APP_BUNDLE_JS"
                    cat "$SCRIPT_DIR/rtl-for-vs-code-agents.js" >> "$APP_BUNDLE_JS"
                    echo "      RTL script injected successfully!"

                    if [[ ! " ${CONFIGURED_AGENTS[*]} " =~ " Gemini Code Assist (VS Code) " ]]; then
                        CONFIGURED_AGENTS+=("Gemini Code Assist (VS Code)")
                    fi
                else
                    echo "      Error: app_bundle.js not found in webview folder"
                fi
            done <<< "$GEMINI_VSCODE_EXTENSIONS"
        fi

        if [ -n "$GEMINI_CURSOR_EXTENSIONS" ]; then
            while read -r GEMINI_EXTENSION; do
                [ -z "$GEMINI_EXTENSION" ] && continue
                APP_BUNDLE_JS="$GEMINI_EXTENSION/webview/app_bundle.js"

                echo "   Injecting into Cursor ($(basename "$GEMINI_EXTENSION"))..."

                if [ -f "$APP_BUNDLE_JS" ]; then
                    # Backup
                    BACKUP_PATH="$APP_BUNDLE_JS.backup"
                    if [ ! -f "$BACKUP_PATH" ]; then
                        cp "$APP_BUNDLE_JS" "$BACKUP_PATH"
                        echo "      Backup created: app_bundle.js.backup"
                    else
                        echo "      Backup already exists"
                    fi

                    echo "" >> "$APP_BUNDLE_JS"
                    cat "$SCRIPT_DIR/rtl-for-vs-code-agents.js" >> "$APP_BUNDLE_JS"
                    echo "      RTL script injected successfully!"

                    if [[ ! " ${CONFIGURED_AGENTS[*]} " =~ " Gemini Code Assist (Cursor) " ]]; then
                        CONFIGURED_AGENTS+=("Gemini Code Assist (Cursor)")
                    fi
                else
                    echo "      Error: app_bundle.js not found in webview folder"
                fi
            done <<< "$GEMINI_CURSOR_EXTENSIONS"
        fi
    fi
else
    echo "   Gemini Code Assist extension not found"
    echo "   Skipping Gemini Code Assist injection"
fi

echo ""

# 3. Find Google Antigravity (if installed)
echo "Step 3: Locating Google Antigravity..."

ANTIGRAVITY_CHAT_JS=""
if [[ "$OSTYPE" == "darwin"* ]]; then
    ANTIGRAVITY_CHAT_JS="/Applications/Antigravity.app/Contents/Resources/app/extensions/antigravity/out/media/chat.js"
else
    # Common Linux locations (best-effort)
    if [ -f "/opt/Antigravity/resources/app/extensions/antigravity/out/media/chat.js" ]; then
        ANTIGRAVITY_CHAT_JS="/opt/Antigravity/resources/app/extensions/antigravity/out/media/chat.js"
    elif [ -f "$HOME/.local/share/Antigravity/resources/app/extensions/antigravity/out/media/chat.js" ]; then
        ANTIGRAVITY_CHAT_JS="$HOME/.local/share/Antigravity/resources/app/extensions/antigravity/out/media/chat.js"
    fi
fi

if [ -n "$ANTIGRAVITY_CHAT_JS" ] && [ -f "$ANTIGRAVITY_CHAT_JS" ]; then
    echo "   Found: Antigravity"
    read -p $'\nDo you want to inject RTL support into Antigravity? (y/n): ' INJECT_ANTIGRAVITY

    if [[ "$INJECT_ANTIGRAVITY" =~ ^[Yy]$ ]]; then
        # Backup
        BACKUP_PATH="$ANTIGRAVITY_CHAT_JS.backup"
        if [ ! -f "$BACKUP_PATH" ]; then
            cp "$ANTIGRAVITY_CHAT_JS" "$BACKUP_PATH"
            echo "   Backup created: chat.js.backup"
        else
            echo "   Backup already exists"
        fi

        # Check if already injected
        if grep -q "RTL Support for Google Antigravity" "$ANTIGRAVITY_CHAT_JS"; then
            echo "   RTL script already injected!"
        else
            echo "" >> "$ANTIGRAVITY_CHAT_JS"
            echo "// RTL Support for Google Antigravity" >> "$ANTIGRAVITY_CHAT_JS"
            cat "$SCRIPT_DIR/rtl-for-vs-code-agents.js" >> "$ANTIGRAVITY_CHAT_JS"
            echo "   RTL script injected successfully!"
            CONFIGURED_AGENTS+=("Antigravity")
        fi
    fi
else
    echo "   Google Antigravity not found"
    echo "   Skipping Antigravity injection"
fi

echo ""

# 4. Set up Custom CSS and JS Loader
echo "Step 4: Configuring Custom CSS and JS Loader..."
echo "   Settings file: $SETTINGS_FILE"

# Ask user where to save the main script
echo ""
echo "Where do you want to save the RTL script?"
echo "   Default: $HOME/vscode-custom"
read -p "Press Enter for default, or enter custom path: " CUSTOM_PATH

if [ -z "$CUSTOM_PATH" ]; then
    CUSTOM_PATH="$HOME/vscode-custom"
fi

# Expand ~ if provided
CUSTOM_PATH="${CUSTOM_PATH/#\~/$HOME}"

# Create directory if it doesn't exist
if [ ! -d "$CUSTOM_PATH" ]; then
    mkdir -p "$CUSTOM_PATH"
    echo "   Created directory: $CUSTOM_PATH"
fi

# Copy the main RTL script
DEST_SCRIPT="$CUSTOM_PATH/rtl-for-vscode-agents.js"
cp "$SCRIPT_DIR/rtl-for-vs-code-agents.js" "$DEST_SCRIPT"
echo "   Copied rtl-for-vscode-agents.js"

CONFIGURED_AGENTS+=("Copilot")

# Update settings.json
# Convert path to file:/// format (handles spaces)
if command -v python3 &> /dev/null; then
    FILE_URL=$(python3 - <<'PY'
import pathlib, sys
path = sys.argv[1]
print(pathlib.Path(path).expanduser().resolve().as_uri())
PY
    "$DEST_SCRIPT")
else
    # Fallback: basic conversion (spaces -> %20)
    FILE_URL="file:///$DEST_SCRIPT"
    FILE_URL="${FILE_URL// /%20}"
fi

# Ensure settings.json exists
SETTINGS_DIR="$(dirname "$SETTINGS_FILE")"
mkdir -p "$SETTINGS_DIR"
if [ ! -f "$SETTINGS_FILE" ]; then
    echo "{}" > "$SETTINGS_FILE"
fi

RAW_CONTENT="$(cat "$SETTINGS_FILE")"

if echo "$RAW_CONTENT" | grep -Fq "$FILE_URL"; then
    echo "   Script already in settings.json"
elif echo "$RAW_CONTENT" | grep -Eq '"vscode_custom_css\.imports"'; then
    UPDATED_CONTENT=$(printf "%s" "$RAW_CONTENT" | perl -0777 -pe 's/("vscode_custom_css\.imports"\s*:\s*\[)/$1\n        "'"$FILE_URL"'",/s')
    printf "%s" "$UPDATED_CONTENT" > "$SETTINGS_FILE"
    echo "   Updated vscode_custom_css.imports"
else
    NEW_PROPERTY="\"vscode_custom_css.imports\": [\"$FILE_URL\"],"
    UPDATED_CONTENT=$(printf "%s" "$RAW_CONTENT" | perl -0777 -pe 's/^\s*\{/{\n    '"$NEW_PROPERTY"'/s')
    printf "%s" "$UPDATED_CONTENT" > "$SETTINGS_FILE"
    echo "   Added vscode_custom_css.imports to settings"
fi

# Verify update
if grep -Fq "$FILE_URL" "$SETTINGS_FILE"; then
    echo "   Settings updated successfully!"
else
    echo "   Warning: Could not verify settings update. Please add manually:"
    echo "   \"vscode_custom_css.imports\": [\"$FILE_URL\"]"
fi

echo ""
echo "============================================"
echo "Installation Complete!"
echo "============================================"
echo ""
echo "Next steps:"
echo "1. Install 'Custom CSS and JS Loader' extension if you haven't already"
echo "2. Press Cmd+Shift+P (Mac) or Ctrl+Shift+P (Linux) and run 'Enable Custom CSS and JS'"
echo "3. Restart VS Code"
echo ""
if [ ${#CONFIGURED_AGENTS[@]} -eq 1 ]; then
    AGENTS_LIST="${CONFIGURED_AGENTS[0]}"
elif [ ${#CONFIGURED_AGENTS[@]} -eq 2 ]; then
    AGENTS_LIST="${CONFIGURED_AGENTS[0]} and ${CONFIGURED_AGENTS[1]}"
else
    LAST_INDEX=$((${#CONFIGURED_AGENTS[@]} - 1))
    LAST_AGENT="${CONFIGURED_AGENTS[$LAST_INDEX]}"
    OTHER_AGENTS=()
    for ((i=0; i<LAST_INDEX; i++)); do
        OTHER_AGENTS+=("${CONFIGURED_AGENTS[$i]}")
    done
    AGENTS_LIST="$(printf "%s, " "${OTHER_AGENTS[@]}")"
    AGENTS_LIST="${AGENTS_LIST%, }"
    AGENTS_LIST="$AGENTS_LIST, and $LAST_AGENT"
fi

echo "RTL support will now work in $AGENTS_LIST!"
echo ""

echo ""
echo "Installation complete!"
echo "Reload VS Code to apply changes: Ctrl+Shift+P -> Reload Window"
echo ""
echo "Installation script completed!"
