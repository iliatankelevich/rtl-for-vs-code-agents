# Changelog

## v7.2.0
- **Agent Questions RTL:** RTL support for Claude Code's `AskUserQuestion` popup (Plan Mode and other agent prompts) — question text, option labels, option descriptions, and navigation tab labels now align right when content is Hebrew/RTL
- **Agent Questions Input:** The free-text "Other" input inside agent question popups now switches to RTL when typing Hebrew
- **Selectors:** Added `[class*="questionTextLarge_"]`, `[class*="optionLabel_"]`, `[class*="optionDescription_"]`, `[class*="navTab_"]` to `chatSelectors`; added `[class*="otherInput_"] [contenteditable]` to `inputSelectors`

## v7.1.0
- **Copilot RTL Detection:** On startup, detects if the Copilot Custom CSS injection was lost after a VS Code update and notifies the user to re-enable it
- **English-only Notifications:** Converted all extension notifications from Hebrew/mixed to English-only to avoid BiDi rendering issues in VS Code's LTR notification UI
- **Code Cleanup:** Removed unused `buildTargetLabel` function

## v7.0.0
- **Gemini Code Assist:** Add RTL support for Google Gemini Code Assist chat (user messages, agent responses, and input box)
- **Auto Injection:** Extension now detects and injects RTL into Gemini Code Assist (`webview/app_bundle.js`)
- **Scripts:** Updated install/uninstall scripts (PS1, SH) with Gemini Code Assist support
- **Refactoring:** Generalized injection functions to support multiple extension types
- **Smart RTL Detection:** Detect direction by first strong Unicode character instead of first character (skips emojis, numbers, punctuation, bullets)
- **Majority Fallback:** When text starts with LTR but ≥30% of letters are RTL (e.g. `"1.1 Migration: הוספת שדות"`), apply RTL
- **List Bullets Fix:** Add `list-style-position: inside` to RTL list items so bullets don't disappear

## v6.0.0
- **Cursor Support:** Add Claude Code injection for Cursor IDE (`~/.cursor/extensions/`)
- **Auto Injection:** Extension now detects Claude Code in VS Code, Cursor, and Antigravity
- **Scripts:** Updated install.ps1, install.sh, uninstall.ps1, uninstall.sh with Cursor support

## v5.0.0
- **VS Code Extension:** Now available as a proper VS Code extension (.vsix)
- **Easy Installation:** Just install the extension - no manual scripts needed
- **Auto Injection:** Automatically detects and injects RTL into Claude Code
- **Selectors:** Update Claude Code selectors for new version (CSS modules with dynamic hashes)
- **Selectors:** Use partial class matching (`[class*="..."]`) for resilience against hash changes
- **User Messages:** Target outer wrapper with `[class*="message_"][class*="userMessageContainer_"]`
- **Agent Messages:** Target `[class*="timelineMessage_"]` and `[class*="root_"]` for timeline messages

## v4.3.3
- **Diagnostics:** Fix selector extraction (avoid attribute value noise)

## v4.3.2
- **Diagnostics:** Added Windows/Mac diagnostic scripts
- **Diagnostics:** Print selectors from injected files for verification

## v4.3.1
- **Scripts:** `install.sh` aligned with Windows behavior (Claude + Antigravity detection)
- **Uninstaller:** Added `uninstall.sh` for Mac/Linux

## v4.3.0
- **VS Code Extension:** Added a standard extension wrapper
- **Auto Inject:** Automatically detects new Claude Code versions and injects RTL
- **Commands & Settings:** Manual check/inject and Custom CSS configuration

## v4.2.1
- **Antigravity Chat:** Fix streaming RTL for Antigravity's built-in chat
- **Selectors:** Update Claude Code selectors (`.U.N`, `.U.e`)
- **Selectors:** Add Antigravity chat selectors (`.whitespace-pre-wrap`, `div.prose.prose-sm`)

## v4.2.0
- **Smarter Installer:** `install.ps1` and `install.sh` now detect and patch **all** installed versions of Claude Code (VS Code & Antigravity), ensuring RTL works even after extension updates or side-by-side installations.
- **Enhanced Uninstaller:** `uninstall.ps1` cleans up all detected versions.
- **Performance:** Optimized selectors (reverted unnecessary Shadow DOM traversals).

## v4.0.1
- **Unified Script:** Merged Google Antigravity support directly into the main `rtl-for-vs-code-agents.js`. No separate injection files needed.
- **Cleanup:** Removed deprecated separate script files.

## v4.0.0
- Add Claude Code injection for Antigravity
- Fix streaming messages RTL detection
- Update selectors for Claude Code 2.1.19
- Remove redundant script files
- Simplify codebase and README

## v3.0.5
- Add installation script screenshot to README

## v3.0.4
- Improve installer and documentation

## v3.0.3
- Fix user message selector for Claude Code

## v3.0.2
- Update selectors for Claude Code 2.1.5

## v3.0.0
- Fix input box RTL flickering in Copilot chat

## v2.0.0
- Add automated installation scripts
- Add RTL support for input boxes

## v1.0.0
- Initial release with GitHub Copilot Chat support
