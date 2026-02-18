const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const os = require('os');

const MARKER = 'RTL for VS Code Agents';
const SCRIPT_FILE = 'rtl-for-vs-code-agents.js';

function getConfig() {
    return vscode.workspace.getConfiguration('rtlForVsCodeAgents');
}

function getScriptContent(extensionPath) {
    const scriptPath = path.join(extensionPath, SCRIPT_FILE);
    return fs.readFileSync(scriptPath, 'utf8');
}

function listExtensionInstallations() {
    const home = os.homedir();
    const locations = [
        { label: 'VS Code', basePath: path.join(home, '.vscode', 'extensions') },
        { label: 'Cursor', basePath: path.join(home, '.cursor', 'extensions') },
        { label: 'Antigravity', basePath: path.join(home, '.antigravity', 'extensions') }
    ];

    // Extension patterns to search for
    const extensionPatterns = [
        {
            prefix: 'anthropic.claude-code-',
            type: 'claude-extension',
            webviewFile: path.join('webview', 'index.js')
        },
        {
            prefix: 'google.geminicodeassist-',
            type: 'gemini-extension',
            webviewFile: path.join('webview', 'app_bundle.js')
        }
    ];

    const results = [];

    for (const location of locations) {
        if (!fs.existsSync(location.basePath)) {
            continue;
        }

        const entries = fs.readdirSync(location.basePath, { withFileTypes: true });
        for (const entry of entries) {
            if (!entry.isDirectory()) continue;

            for (const pattern of extensionPatterns) {
                if (!entry.name.startsWith(pattern.prefix)) continue;

                const extensionDir = path.join(location.basePath, entry.name);
                const indexPath = path.join(extensionDir, pattern.webviewFile);
                results.push({
                    type: pattern.type,
                    location: location.label,
                    name: entry.name,
                    extensionDir,
                    indexPath
                });
            }
        }
    }

    return results;
}

function getAntigravityAppInstallation() {
    const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
    const appPath = path.join(localAppData, 'Programs', 'Antigravity');
    const chatPath = path.join(appPath, 'resources', 'app', 'extensions', 'antigravity', 'out', 'media', 'chat.js');

    if (fs.existsSync(chatPath)) {
        return {
            type: 'antigravity-app',
            location: 'Antigravity',
            name: 'Antigravity App',
            extensionDir: appPath,
            indexPath: chatPath
        };
    }

    return null;
}

function ensureBackup(indexPath) {
    const backupPath = `${indexPath}.backup`;
    if (!fs.existsSync(backupPath)) {
        fs.copyFileSync(indexPath, backupPath);
        return true;
    }
    return false;
}

function isInjected(content) {
    return content.includes(MARKER);
}

function needsInjection(indexPath) {
    if (!fs.existsSync(indexPath)) return false;
    const content = fs.readFileSync(indexPath, 'utf8');
    return !isInjected(content);
}

function injectScript(indexPath, scriptContent) {
    const original = fs.readFileSync(indexPath, 'utf8');
    if (isInjected(original)) {
        return { changed: false, reason: 'already-injected' };
    }

    ensureBackup(indexPath);

    const appended = `${original}\n\n// ${MARKER} (injected)\n${scriptContent}\n`;
    fs.writeFileSync(indexPath, appended, 'utf8');
    return { changed: true, reason: 'injected' };
}

async function confirmInjection(target) {
    let nameLine;
    if (target.type === 'antigravity-app') {
        nameLine = 'Antigravity: installation found requiring RTL injection.';
    } else if (target.type === 'gemini-extension') {
        nameLine = 'Gemini Code Assist: new version found requiring RTL injection.';
    } else {
        nameLine = 'Claude Code: new version found requiring RTL injection.';
    }

    const detail = target.name ? `\nVersion: ${target.name}` : '';

    const message = `${nameLine}${detail}\n\nRTL injection will modify a local file. Continue?`;
    const yes = 'Inject';
    const no = 'Not now';

    const choice = await vscode.window.showInformationMessage(message, yes, no);
    return choice === yes;
}

function showPostInjectNotice(targets) {
    const includesAntigravity = targets.some(t => t.type === 'antigravity-app');
    const includesWebviewExtension = targets.some(t => t.type === 'claude-extension' || t.type === 'gemini-extension');

    let message = 'RTL: injection successful.';
    if (includesWebviewExtension) {
        message += ' Reload required: Ctrl+Shift+P → "Reload Window".';
    }
    if (includesAntigravity) {
        message += ' Antigravity: restart the app.';
    }

    vscode.window.showInformationMessage(message);
}

async function checkAndInject(context, options = {}) {
    const { quiet = false, interactive = false, notifyNoChanges = false } = options;
    const config = getConfig();

    if (!config.get('autoInject', true) && quiet) {
        return;
    }

    const scriptContent = getScriptContent(context.extensionPath);
    const installations = listExtensionInstallations();
    const antigravityApp = getAntigravityAppInstallation();
    const targets = antigravityApp ? [...installations, antigravityApp] : installations;

    if (targets.length === 0) {
        if (!quiet && notifyNoChanges) {
            vscode.window.showInformationMessage('RTL: no installations of Claude Code, Gemini Code Assist or Antigravity found.');
        }
        return;
    }

    const injectedPaths = new Set(context.globalState.get('rtlForVsCodeAgents.injectedPaths', []));
    const updatedPaths = [];
    const errors = [];

    for (const install of targets) {
        if (!fs.existsSync(install.indexPath)) {
            continue;
        }

        if (!needsInjection(install.indexPath)) {
            continue;
        }

        if (interactive) {
            const approved = await confirmInjection(install);
            if (!approved) {
                continue;
            }
        }

        try {
            const result = injectScript(install.indexPath, scriptContent);
            if (result.changed) {
                injectedPaths.add(install.indexPath);
                updatedPaths.push(install);
            }
        } catch (error) {
            errors.push({ install, error });
        }
    }

    await context.globalState.update('rtlForVsCodeAgents.injectedPaths', Array.from(injectedPaths));
    await context.globalState.update('rtlForVsCodeAgents.lastCheck', Date.now());

    if (!quiet) {
        if (updatedPaths.length > 0) {
            showPostInjectNotice(updatedPaths);
        } else if (errors.length === 0 && notifyNoChanges) {
            vscode.window.showInformationMessage('RTL injection: nothing to update.');
        }

        if (errors.length > 0) {
            const message = errors[0].error?.message || 'Unknown error';
            vscode.window.showWarningMessage(`RTL injection: some injections failed — error: ${message}`);
        }
    }
}

async function configureCustomCss(context, options = {}) {
    const { quiet = false } = options;
    const scriptPath = path.join(context.extensionPath, SCRIPT_FILE);
    const fileUrl = `file:///${scriptPath.replace(/\\/g, '/')}`;

    const config = vscode.workspace.getConfiguration();
    const imports = config.get('vscode_custom_css.imports', []);

    if (!Array.isArray(imports)) {
        if (!quiet) {
            vscode.window.showWarningMessage('vscode_custom_css.imports is not an array. Please fix it manually.');
        }
        return;
    }

    if (!imports.includes(fileUrl)) {
        imports.push(fileUrl);
        await config.update('vscode_custom_css.imports', imports, vscode.ConfigurationTarget.Global);
        if (!quiet) {
            vscode.window.showInformationMessage('Added RTL script to vscode_custom_css.imports. Run “Enable Custom CSS and JS” and restart VS Code.');
        }
    } else if (!quiet) {
        vscode.window.showInformationMessage('RTL script already configured in vscode_custom_css.imports.');
    }

    const customCssExt = vscode.extensions.getExtension('be5invis.vscode-custom-css');
    if (!customCssExt && !quiet) {
        const install = await vscode.window.showInformationMessage(
            'Custom CSS and JS Loader is required for Copilot RTL. Install now?',
            'Install'
        );
        if (install === 'Install') {
            await vscode.commands.executeCommand('workbench.extensions.installExtension', 'be5invis.vscode-custom-css');
        }
    }
}

function isCopilotInjectionActive() {
    try {
        const htmlPath = path.join(vscode.env.appRoot, 'out', 'vs', 'workbench', 'workbench.desktop.main.html');
        if (!fs.existsSync(htmlPath)) return null;
        const htmlContent = fs.readFileSync(htmlPath, 'utf8');

        const config = vscode.workspace.getConfiguration();
        const imports = config.get('vscode_custom_css.imports', []);
        if (!Array.isArray(imports) || imports.length === 0) return null;

        const rtlImports = imports.filter(url => typeof url === 'string' && url.includes('rtl-for-vs'));
        if (rtlImports.length === 0) return null;

        return rtlImports.some(url => htmlContent.includes(url));
    } catch (e) {
        return null;
    }
}

async function checkCopilotStatus() {
    const isActive = isCopilotInjectionActive();
    if (isActive === null || isActive === true) return;

    const reEnable = 'Enable Custom CSS';
    const choice = await vscode.window.showWarningMessage(
        'Copilot RTL: injection lost after VS Code update. Re-enable: "Enable Custom CSS and JS" + Reload Window.',
        reEnable,
        'Dismiss'
    );
    if (choice === reEnable) {
        await vscode.commands.executeCommand('workbench.action.showCommands');
        vscode.window.showInformationMessage('Search "Enable Custom CSS and JS", press Enter, then run "Reload Window".');
    }
}

function scheduleAutoCheck(context) {
    const config = getConfig();
    if (!config.get('autoInject', true)) {
        return;
    }

    const hours = Number(config.get('checkIntervalHours', 0)) || 0;
    if (hours <= 0) {
        return;
    }

    const intervalMs = hours * 60 * 60 * 1000;
    const handle = setInterval(() => {
        checkAndInject(context, { quiet: false, interactive: true, notifyNoChanges: false });
    }, intervalMs);

    context.subscriptions.push({ dispose: () => clearInterval(handle) });
}

function maybeAutoConfigureCustomCss(context) {
    const config = getConfig();
    if (config.get('autoConfigureCustomCss', false)) {
        configureCustomCss(context, { quiet: true });
    }
}

function activate(context) {
    console.log('RTL for VS Code Agents: Activating...');

    context.subscriptions.push(
        vscode.commands.registerCommand('rtlForVsCodeAgents.checkAndInject', () => checkAndInject(context, { quiet: false, interactive: true, notifyNoChanges: true })),
        vscode.commands.registerCommand('rtlForVsCodeAgents.configureCustomCss', () => configureCustomCss(context))
    );

    checkAndInject(context, { quiet: false, interactive: true, notifyNoChanges: false });
    checkCopilotStatus();
    scheduleAutoCheck(context);
    maybeAutoConfigureCustomCss(context);

    console.log('RTL for VS Code Agents: Activated successfully!');
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
};
