# RTL for Code Agents

Right-to-Left (RTL) support for AI chat agents in VS Code / Antigravity / Cursor


Automatically detects Hebrew, Arabic, Persian, and other RTL languages and applies proper RTL styling.

## Features

### NEW
- **User message navigation (↑↓)** — jump between user messages in Claude Code with cyclic up/down buttons in the input footer
![Check for updates](ReadmeImages/UserMessageNavigation.png)

- **User message accent borders** — coral border on user messages in Claude Code and Copilot Chat
- **Check for updates** - Any RTL issues? Click the RTL status bar button to check for updates! Also - The extension checks for updates every time you restart VS CODE.
![Check for updates](ReadmeImages/CheckForUpdates.png)

- **Conversation History RTL** — session titles in the history dropdown align right for RTL content, with a wider and taller dropdown

- **Agent Questions RTL support** — question text, options, and navigation tabs align right in Plan Mode and other agent prompts

### Core Features
- **Automatic RTL** — detects RTL textion for Hebrew, Arabic, Persian, Urdu, and more
- Code blocks remain LTR
- **Input box RTL support**
- Works with GitHub Copilot Chat, Claude Code (VS Code, Cursor, Antigravity), Gemini Code Assist, and Antigravity Chat
- Automatic injection into Claude Code and Gemini Code Assist (no manual setup needed)

## Preview

### Click to watch me demonstrate it:
[![RTL for VS Code Agents - Preview](ReadmeImages/YouTubPreview.png)](https://youtu.be/9-sickqyI6Q)

### Full RTL Support in Major Code Agents:
Copilot, Claude Code & Gemini Code Assist!

RTL is automatically applied for all RTL texts in: user messages, agent responses, input box, and even agent questions in Plan Mode. All align right for RTL content:

![Gemini Code Assist RTL](ReadmeImages/ExtensionDescAndGeminiSupport.png)

### Agent Questions in Plan Mode

When Claude Code asks you questions (e.g. in Plan Mode), the popup now fully supports RTL — question text, option labels, descriptions, and navigation tabs all align right for Hebrew/RTL content. The free-text "Other" input also switches to RTL automatically.

![Agent Questions RTL](ReadmeImages/RTLinAgentQuestions.png)

### Conversation History List

Session titles in the chat history dropdown now align right for RTL content. The dropdown is wider and taller, and titles wrap instead of being truncated. The current session title in the header also wraps and grows with content.

![Conversation History RTL](ReadmeImages/RTLingConversationHistoryList.png)

### Check for updates

Any RTL issues? Click the RTL status bar button to check for updates!
Also - The extension checks for updates every time you restart VS CODE.

![Check for updates](ReadmeImages/CheckForUpdates.png)


## Installation

### VSIX Installation (Recommended)

1. Download the latest `.vsix` file from [Releases](https://github.com/GuyRonnen/rtl-for-vs-code-agents/releases)
2. In VS Code: `Ctrl+Shift+X` → `...` → "Install from VSIX..."
![Install from VSIX](ReadmeImages/InstallVSIX.png)

3. Select the downloaded file
4. Restart VS Code

That's it! The extension automatically injects RTL support into Claude Code and Gemini Code Assist - no additional setup needed.

### To Enable RTL in GitHub Copilot Chat also:

Copilot Chat requires the [Custom CSS and JS Loader](https://marketplace.visualstudio.com/items?itemName=be5invis.vscode-custom-css) extension:

1. Install [this](https://marketplace.visualstudio.com/items?itemName=be5invis.vscode-custom-css) extension
2. Run command (Ctrl+Shift+P): **RTL for VS Code Agents: Configure Custom CSS Loader**
3. Run command (Ctrl+Shift+P): **Enable Custom CSS and JS** (from Custom CSS extension)
4. Restart VS Code


## And what about RTL for web chats!?
### (i.e. Claude.ai / NotebookLM / Perplexity / ChatGPT) and SaaSs (i.e. Slack / Monday / Heptabse)
### I've got you there also!!
[![Multi-RTL Chrome Extension](ReadmeImages/Multi-RTL-Chrome.png)](https://multi-rtl.interact-ed.online)

is all you need!



## Now back to RTL for VS Code Agents:

<details>
<summary>Commands</summary>

- **RTL for VS Code Agents: Check and Inject Claude Code** - Manually check and inject RTL into Claude Code
- **RTL for VS Code Agents: Configure Custom CSS Loader** - Configure Custom CSS extension for Copilot
- **RTL for VS Code Agents: Check for Updates** - Check GitHub for a newer version and install it
- **RTL for VS Code Agents: Remove All RTL Injections** - Restore all original files (run before uninstalling the extension)
</details>

<details>
<summary>Settings</summary>

| Setting | Default | Description |
|---------|---------|-------------|
| `rtlForVsCodeAgents.autoInject` | `true` | Automatically inject RTL into new Claude Code versions |
| `rtlForVsCodeAgents.checkIntervalHours` | `0` | How often to check (0 = startup only) |
| `rtlForVsCodeAgents.autoConfigureCustomCss` | `false` | Automatically configure Custom CSS Loader |
| `rtlForVsCodeAgents.autoCheckUpdates` | `true` | Automatically check for extension updates from GitHub on startup |
| `rtlForVsCodeAgents.updateCheckIntervalHours` | `24` | How often to check for updates (0 = startup only) |
</details>

<details>
<summary>Troubleshooting</summary>

| Problem | Solution |
|---------|----------|
| "[Unsupported]" in title bar | Normal - this is expected when using Custom CSS |
| RTL not working in Claude Code / Gemini | Run "Check and Inject Claude Code" command |
| RTL not working in Copilot | Run "Configure Custom CSS Loader", then "Enable Custom CSS and JS" |
| RTL stopped after VS Code update | The extension will notify you automatically — click "Enable Custom CSS" and run "Reload Window" |
</details>

<details>
<summary>Manual Installation (Advanced)</summary>

For manual installation or troubleshooting, scripts are available:

### Windows
```powershell
powershell -ExecutionPolicy Bypass -File .\install.ps1
```

### Mac/Linux
```bash
./install.sh
```

### Diagnostics
```powershell
# Windows
powershell -ExecutionPolicy Bypass -File .\diagnose-rtl.ps1

# Mac/Linux
./diagnose-rtl.sh
```
</details>
<details>
<summary>Changelog</summary>

### v8.0.1
- **Fix BiDi ordering in mixed Hebrew/English lines:** Lines starting with bold text followed by English in parentheses (e.g. `**term** (English explanation)`) now correctly align RTL. Fixed by injecting RLM anchors and switching from `unicode-bidi: plaintext` to `isolate`.

### v8.0.0
- **User message navigation (↑↓):** Jump between user messages in Claude Code chat with cyclic up/down buttons in the input footer
- **Copilot user message borders:** User messages in GitHub Copilot Chat now have a coral accent border matching Claude Code
- **Improve reload notifications:** Add 'Reload Window' button to all injections and removals — soft reload instead of manual Ctrl+Shift+P
- **Install/Uninstall scripts:** No longer force-restart VS Code — reload happens via extension notification button

### v7.5.6
- **Broad bidi-override fix:** Cancel Claude Code's `unicode-bidi: bidi-override` across all chat content (tables, lists, headings, etc.) — not just RTL-marked elements

### v7.5.5
- **Permission reject input RTL:** The free-text input in permission dialogs (e.g. "Make this edit?") now switches to RTL when typing Hebrew

### v7.5.4
- **Fix bidi-override on history title:** Session title and history list items now get `data-rtl-applied` marker so the bidi-override CSS fix covers them too

### v7.5.3
- **Fix Claude Code bidi-override:** Counter the global `* { unicode-bidi: bidi-override }` rule added in Claude Code v2.1.63 that broke all RTL text rendering

### v7.5.2
- **Fix Custom CSS stale imports:** Auto-update no longer accumulates old entries in `vscode_custom_css.imports` — old RTL paths are cleaned up automatically on each configure

### v7.5.1
- **Status Bar Quick Menu:** Click the `RTL v7.5.1` button in the status bar to open a quick menu with all extension actions — also triggers an update check in the background

### v7.5.0
- **Auto-Update:** Check for new versions from GitHub and install with one click — no more manual VSIX downloads
- **Status Bar Button:** Shows current version in the bottom bar; highlights when an update is available
- **Update Settings:** `autoCheckUpdates` and `updateCheckIntervalHours` control automatic checking
- **Post-Update Re-injection:** After updating, old RTL injections are automatically restored and re-injected with the new script
- **Remove Injections Command:** New "Remove All RTL Injections" command to cleanly restore all files before uninstalling

### v7.3.1
- **Session Title Line Clamp:** Session title limited to 3 lines, preventing long prompts from overflowing
- **UI Accent Borders:** Light purple border on history header, coral border on user messages

### v7.3.0
- **Conversation History RTL:** Session titles in the history dropdown align right for Hebrew/RTL content
- **History Dropdown UI:** Wider and taller dropdown, session names wrap instead of being truncated
- **Session Header Button:** Current session title wraps and grows with content instead of being clipped

### v7.2.0
- **Agent Questions RTL:** Question text, option labels, descriptions, and nav tabs in Claude Code's agent prompts (Plan Mode) now align right for Hebrew/RTL content
- **Agent Questions Input:** The "Other" free-text input in agent popups switches to RTL when typing Hebrew

### v7.1.0
- **Copilot RTL Detection:** Auto-detects if Copilot injection was lost after a VS Code update and notifies
- **English-only Notifications:** Fixes BiDi rendering issues in VS Code's notification UI

### v7.0.0
- **Gemini Code Assist:** RTL support for Google Gemini Code Assist chat
- **Auto Injection:** Detects and injects into Gemini Code Assist automatically
- **Smart RTL Detection:** Direction based on first strong character (skips emojis, numbers, bullets)
- **Majority Fallback:** Mixed Hebrew/English text (≥30% RTL letters) correctly detected as RTL
- **List Bullets Fix:** RTL list items no longer lose their bullets

### v6.0.0
- **Cursor Support:** Claude Code in Cursor now supported
- **Auto Injection:** Detects Claude Code in VS Code, Cursor, and Antigravity

### v5.0.0
- **VS Code Extension:** Now available as a proper VS Code extension (.vsix)
- **Selectors:** Update Claude Code selectors for new version

### v4.3.3
- **Diagnostics:** Fix selector extraction

### v4.2.1
- **Antigravity Chat:** Fix streaming RTL
- **Selectors:** Update Claude Code and Antigravity selectors

</details>

<details>
<summary>Older versions</summary>

### v4.2.0
- Smarter installer - detects all Claude Code versions

### v4.0.0
- Add Claude Code injection for Antigravity
- Fix streaming messages RTL detection

### v3.0.0
- Fix input box RTL flickering

### v2.0.0
- Add automated installation scripts
- Add RTL support for input boxes

### v1.0.0
- Initial release with GitHub Copilot Chat support

</details>

## License

GPL-3.0
