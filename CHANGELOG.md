# Changelog

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
