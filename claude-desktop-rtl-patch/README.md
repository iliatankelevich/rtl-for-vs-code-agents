# Claude Desktop RTL + Search + YOLO

Enhanced RTL (Right-to-Left) support for **Claude Desktop on Windows**, with built-in conversation search and YOLO auto-approve tools.

It automatically detects Hebrew/Arabic text direction without breaking English or code blocks.

Based on `claude-desktop-rtl-patch` by `shraga100`, with additional features and modifications.

## What it does

* **Auto-detects RTL text** in Claude's responses and input box

* **Search in conversation (`🔍`)** - opens a search bar, highlights matches in the current chat, and lets you jump between results with `↑` / `↓` or `Enter` / `Shift+Enter`

* **YOLO mode (`💪`)** - auto-approves permission prompts with a countdown and `NO!` cancel button. Right-click the button to change the delay (`0` = instant) and toggle `Auto Approve Plans` (off by default), so `Accept this plan?` stays manual unless you explicitly enable it

* **Keeps code blocks LTR** - no broken formatting

* **Creates backups** of all modified files with full restore support

* **Automated Updates** - optional background service that automatically re-applies the patch after Claude updates

## Quick Install

Open **PowerShell** and run:

`irm https://raw.githubusercontent.com/GuyRonnen/rtl-for-vs-code-agents/main/CC-Desktop-RTL-Search-YOLO.ps1 | iex`

A UAC prompt will appear - click **Yes** to grant administrator privileges.

> **Alternative:** Download `CC-Desktop-RTL-Search-YOLO.ps1` and right-click -> **Run with PowerShell**

## Requirements

* **Windows 10/11** with Claude Desktop installed

  Download Claude Desktop from [claude.ai](https://downloads.claude.ai/releases/win32/ClaudeSetup.exe)

* **Node.js** installed (`npx` must be available in PATH)

* **Administrator privileges** (the script will request elevation automatically)

> **Windows Only:** This specific patch is for Windows.
>
> **Mac Users:** Try [toboly's mac patch](https://github.com/toboly/claude-desktop-rtl-patch-mac) or [soguy's mac patch](https://github.com/soguy/claude-desktop-rtl-mac). *(Note: I have not personally tested these Mac versions, use at your own risk).*

## Menu Options

When you run the script, you will see the following interactive menu:

| Option | Description |
| ----- | ----- |
| **1. Install** | Backs up originals and injects RTL support |
| **2. Restore** | Reverts all changes from backup files |
| **3. Create Shortcut** | Creates a desktop shortcut for quick 1-click updates |
| **4. Enable Auto Re-Patch** | Installs a watcher to re-patch Claude automatically after updates |
| **5. Disable Auto Re-Patch** | Removes the background watcher |
| **6. Exit** | Close the patcher |

## In-App Buttons

After patching, Claude Desktop gets a small tool dock:

* `🔍` toggles **Search in conversation**
* `💪` toggles **YOLO mode**
* Right-click `💪` to change the countdown delay in seconds

## Keeping the Patch Updated (Automation)

Claude Desktop updates frequently, and each update overwrites the patch. To make maintenance easier, the patcher includes two helpful features:

1. **Desktop Shortcut (Option 3):** Creates a shortcut on your Desktop named "Update Claude RTL". Double-clicking it silently fetches and applies the latest patch without reopening the menu.

2. **Auto-Updater Service (Option 4):** Sets up a lightweight Windows Scheduled Task. It runs quietly in the background, detects when a new `claude.exe` version is launched, and automatically downloads and applies the patch. When finished, it shows a short Windows notification.

## How it works (Technical)

Claude Desktop is an Electron application distributed as a **digitally signed** package. Adding RTL support requires modifying the JavaScript inside the app, which breaks the integrity checks Anthropic uses to verify it. The patch handles this in three phases:

### Phase 1 - ASAR Injection

Claude's UI code lives inside `app.asar`, a read-only archive format used by Electron. The script:

1. Extracts the ASAR archive using `npx asar`

2. Injects a small JavaScript snippet into the renderer files - this snippet detects RTL characters in real time and applies the correct text direction

3. Repacks the ASAR and computes the new SHA-256 hash of its header

### Phase 2 - Hash Replacement in `claude.exe`

`claude.exe` contains the original ASAR hash hardcoded as an ASCII string. The script performs a **direct byte-level search-and-replace** inside the binary to update it to the new hash, so the app accepts the modified ASAR.

### Phase 3 - Certificate Swap in `cowork-svc.exe`

`cowork-svc.exe` is a background service that verifies the authenticity of `claude.exe` using Anthropic's embedded certificate. After re-signing `claude.exe` with a new self-signed certificate, the script:

1. Locates the original Anthropic X.509 certificate inside `cowork-svc.exe` using binary pattern matching (searching for `0x30 0x82` near the string `"Anthropic, PBC"`)

2. Generates a self-signed certificate small enough to fit in the same byte slot

3. Replaces the original certificate in-place, padding with `0x00` to preserve file size and binary offsets

4. Re-signs both `claude.exe` and `cowork-svc.exe` with the new certificate

5. Adds the certificate to the Windows trusted root store (`LocalMachine\Root`)

All original files are backed up before any changes. If anything fails, an automatic rollback restores the originals.

## Disclaimer

> **Please read before installing.**

This patch modifies the internal binaries of Claude Desktop in ways that are **not authorized by Anthropic**. Specifically, it:

* It replaces Anthropic's code-signing certificate inside `cowork-svc.exe` with a self-signed certificate

* It adds that self-signed certificate to your Windows **trusted root certificate store**

* It bypasses the application's integrity verification mechanism

**By installing this patch you accept the following:**

1. **Use at your own risk.** The authors take no responsibility for system damage, data loss, or application instability.

2. **Anthropic may terminate your account** if they detect unauthorized modifications to their software, per their Terms of Service.

3. **Keep the repository trusted.** If this repository were ever compromised, running the install command could execute malicious code with administrator privileges. Always verify the source before running any `irm | iex` command.

4. **This patch is temporary.** Claude Desktop updates will overwrite the patched files. You may need to re-run the installer after each update (or use the built-in Auto-Updater).

5. **Not a permanent solution.** This exists only until Anthropic adds native RTL support. Please upvote and request this feature through official Anthropic channels.

This project is open source (MIT). Contributions to improve RTL accuracy are welcome - PRs are open.

## Troubleshooting

**"Node.js (npx) is required"** - Install Node.js from [nodejs.org](https://nodejs.org/) and reopen PowerShell.

**Service won't start after patching** - Run the script again and choose **Restore** (option 2), then **Install** (option 1).

**Claude updated and the patch broke** - Run the "Update Claude RTL" desktop shortcut, or use the Auto-Updater. If doing it manually, delete any `.bak` files in the Claude app directory and run the installer again.

**Search or YOLO buttons disappeared** - Restart Claude Desktop. The patch re-attaches the floating dock automatically after SPA re-renders, but a full restart is the fastest reset if Claude updated mid-session.

## Uninstall

Run the script and choose option **2 (Restore)**. This restores all original files from backup and removes the self-signed certificate from your Windows certificate store. If you installed the Auto-Updater, choose option **5** to disable it.

## License

MIT
