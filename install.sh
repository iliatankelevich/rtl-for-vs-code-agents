#!/bin/bash

# RTL for VS Code Agents - Installation Script
# This script automates the installation process for Mac/Linux

echo "============================================"
echo "RTL for VS Code Agents - Installer"
echo "============================================"
echo ""

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Detect OS
if [[ "$OSTYPE" == "darwin"* ]]; then
    VSCODE_DIR="$HOME/Library/Application Support/Code"
    EXTENSIONS_DIR="$HOME/.vscode/extensions"
else
    VSCODE_DIR="$HOME/.config/Code"
    EXTENSIONS_DIR="$HOME/.vscode/extensions"
fi

SETTINGS_FILE="$VSCODE_DIR/User/settings.json"

# 1. Find Claude Code extension folder
echo "Step 1: Locating Claude Code extension..."
# Find all versions
CLAUDE_EXTENSIONS=$(find "$EXTENSIONS_DIR" -maxdepth 1 -type d -name "anthropic.claude-code-*")

if [ -n "$CLAUDE_EXTENSIONS" ]; then
    echo "Found Claude Code versions:"
    echo "$CLAUDE_EXTENSIONS" | while read -r match; do
        echo "   - $(basename "$match")"
    done

    # Ask user if they want to inject into Claude Code
    read -p $'\nDo you want to inject RTL support into ALL found Claude Code versions? (y/n): ' INJECT_CLAUDE

    if [[ "$INJECT_CLAUDE" =~ ^[Yy]$ ]]; then
        echo "$CLAUDE_EXTENSIONS" | while read -r CLAUDE_EXTENSION; do
            WEBVIEW_PATH="$CLAUDE_EXTENSION/webview"
            INDEX_JS="$WEBVIEW_PATH/index.js"
            
            echo "   Processing: $(basename "$CLAUDE_EXTENSION")"

            if [ -f "$INDEX_JS" ]; then
                # Backup
                BACKUP_PATH="$INDEX_JS.backup"
                if [ ! -f "$BACKUP_PATH" ]; then
                    cp "$INDEX_JS" "$BACKUP_PATH"
                    echo "      Backup created: index.js.backup"
                else
                    echo "      Backup already exists"
                fi

                # Inject - Use main script content instead of simple script
                # Read the main script content, escape backslashes and special characters for sed
                # Note: This is complex in shell, simpler to concatenate
                
                # Check if already injected
                if grep -q "RTL Support for VS Code AI Chat Agents" "$INDEX_JS"; then
                    echo "      RTL script already injected!"
                else
                    echo "" >> "$INDEX_JS"
                    cat "$SCRIPT_DIR/rtl-for-vs-code-agents.js" >> "$INDEX_JS"
                    echo "      RTL script injected successfully!"
                fi
            else
                echo "      Error: index.js not found in webview folder"
            fi
        done
    fi
else
    echo "   Claude Code extension not found"
    echo "   Skipping Claude Code injection"
fi

echo ""

# 2. Set up Custom CSS and JS Loader
echo "Step 2: Configuring Custom CSS and JS Loader..."
echo "   Settings file: $SETTINGS_FILE"

# Ask user where to save the main script
echo ""
echo "Where do you want to save the RTL script?"
echo "   Default: $HOME/vscode-custom"
read -p "Press Enter for default, or enter custom path: " CUSTOM_PATH

if [ -z "$CUSTOM_PATH" ]; then
    CUSTOM_PATH="$HOME/vscode-custom"
fi

# Create directory if it doesn't exist
if [ ! -d "$CUSTOM_PATH" ]; then
    mkdir -p "$CUSTOM_PATH"
    echo "   Created directory: $CUSTOM_PATH"
fi

# Copy the main RTL script
DEST_SCRIPT="$CUSTOM_PATH/rtl-for-vscode-agents.js"
cp "$SCRIPT_DIR/rtl-for-vs-code-agents.js" "$DEST_SCRIPT"
echo "   Copied rtl-for-vscode-agents.js"

# Update settings.json
if [ -f "$SETTINGS_FILE" ]; then
    # Convert path to file:/// format
    FILE_URL="file://$DEST_SCRIPT"

    # Check if jq is available for JSON manipulation
    if command -v jq &> /dev/null; then
        # Use jq to safely update JSON
        TMP_FILE=$(mktemp)
        if jq --arg url "$FILE_URL" '. + {"vscode_custom_css.imports": [.["vscode_custom_css.imports"][]?, $url] | unique}' "$SETTINGS_FILE" > "$TMP_FILE"; then
            mv "$TMP_FILE" "$SETTINGS_FILE"
            echo "   Settings updated successfully!"
        else
            rm "$TMP_FILE"
            echo "   Error updating settings. Please add manually:"
            echo "   \"vscode_custom_css.imports\": [\"$FILE_URL\"]"
        fi
    else
        # Manual instruction if jq is not available
        echo "   Please add the following to your settings.json manually:"
        echo "   \"vscode_custom_css.imports\": [\"$FILE_URL\"]"
    fi
else
    echo "   Error: settings.json not found at $SETTINGS_FILE"
    echo "   Please create it and add:"
    echo "   \"vscode_custom_css.imports\": [\"file://$DEST_SCRIPT\"]"
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
echo "RTL support will now work in Copilot and Claude Code!"
echo ""

# Ask if user wants to restart VS Code
read -p "Do you want to restart VS Code now? (y/n): " RESTART_VSCODE

if [[ "$RESTART_VSCODE" =~ ^[Yy]$ ]]; then
    echo "Restarting VS Code..."
    # Kill VS Code
    pkill -f "Visual Studio Code" 2>/dev/null || pkill -f "code" 2>/dev/null
    sleep 2
    # Start VS Code
    if command -v code &> /dev/null; then
        code &
    else
        echo "VS Code command not found. Please start it manually."
    fi
fi

echo ""
echo "Installation script completed!"
