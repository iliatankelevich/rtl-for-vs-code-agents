# RTL for VS Code Agents - Uninstall Script
# This script removes all RTL injections and restores original files

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "RTL for VS Code Agents - Uninstaller" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

$RestoredCount = 0
$ErrorCount = 0

# Helper function to restore Claude Code backup
function Restore-ClaudeCodeBackup {
    param($ExtensionPath, $Location)

    $IndexJs = Join-Path $ExtensionPath "webview\index.js"
    $BackupPath = "$IndexJs.backup"

    if (Test-Path $BackupPath) {
        try {
            Remove-Item $IndexJs -Force
            Move-Item $BackupPath $IndexJs
            Write-Host "   OK Restored index.js from backup ($Location)" -ForegroundColor Green
            return $true
        } catch {
            Write-Host "   X Error restoring index.js ($Location): $_" -ForegroundColor Red
            return $false
        }
    } else {
        Write-Host "   - No backup found ($Location)" -ForegroundColor Gray
        return $null
    }
}

# 1. Restore Claude Code
Write-Host "Step 1: Restoring Claude Code..." -ForegroundColor Yellow

# Check VS Code
$VSCodeExtPath = "$env:USERPROFILE\.vscode\extensions"
$ClaudeVSCode = Get-ChildItem -Path $VSCodeExtPath -Filter "anthropic.claude-code-*" -Directory -ErrorAction SilentlyContinue | Select-Object -First 1

if ($ClaudeVSCode) {
    $result = Restore-ClaudeCodeBackup -ExtensionPath $ClaudeVSCode.FullName -Location "VS Code"
    if ($result -eq $true) { $RestoredCount++ }
    elseif ($result -eq $false) { $ErrorCount++ }
}

# Check Antigravity
$AntigravityExtPath = "$env:USERPROFILE\.antigravity\extensions"
if (Test-Path $AntigravityExtPath) {
    $ClaudeAntigravity = Get-ChildItem -Path $AntigravityExtPath -Filter "anthropic.claude-code-*" -Directory -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($ClaudeAntigravity) {
        $result = Restore-ClaudeCodeBackup -ExtensionPath $ClaudeAntigravity.FullName -Location "Antigravity"
        if ($result -eq $true) { $RestoredCount++ }
        elseif ($result -eq $false) { $ErrorCount++ }
    }
}

if (-not $ClaudeVSCode -and -not $ClaudeAntigravity) {
    Write-Host "   - Claude Code extension not found" -ForegroundColor Gray
}

Write-Host ""

# 2. Restore Google Antigravity
Write-Host "Step 2: Restoring Google Antigravity..." -ForegroundColor Yellow
$AntigravityPath = "$env:LOCALAPPDATA\Programs\Antigravity"

if (Test-Path $AntigravityPath) {
    $ChatJsPath = Join-Path $AntigravityPath "resources\app\extensions\antigravity\out\media\chat.js"
    $BackupPath = "$ChatJsPath.backup"

    if (Test-Path $BackupPath) {
        try {
            Remove-Item $ChatJsPath -Force
            Move-Item $BackupPath $ChatJsPath
            Write-Host "   OK Restored chat.js from backup" -ForegroundColor Green
            $RestoredCount++
        } catch {
            Write-Host "   X Error restoring chat.js: $_" -ForegroundColor Red
            $ErrorCount++
        }
    } else {
        Write-Host "   - No backup found (chat.js.backup)" -ForegroundColor Gray
    }
} else {
    Write-Host "   - Google Antigravity not found" -ForegroundColor Gray
}

Write-Host ""

# 3. Clean up settings.json (optional)
Write-Host "Step 3: Cleaning settings.json..." -ForegroundColor Yellow
$SettingsPath = "$env:APPDATA\Code\User\settings.json"

if (Test-Path $SettingsPath) {
    $RemoveFromSettings = Read-Host "Do you want to remove RTL script from settings.json? (y/n)"

    if ($RemoveFromSettings -eq 'y' -or $RemoveFromSettings -eq 'Y') {
        try {
            # Read file content
            $RawContent = Get-Content $SettingsPath -Raw

            # Check if file contains RTL script reference
            if ($RawContent -match "rtl-for-vscode-agents\.js") {
                # Use regex to remove the RTL script line (handles JSON with comments)
                # Match the line containing rtl-for-vscode-agents.js and optional trailing comma
                $UpdatedContent = $RawContent -replace '(?m)^\s*"[^"]*rtl-for-vscode-agents\.js[^"]*",?\s*\r?\n?', ''

                # Clean up any resulting double commas or trailing commas before ]
                $UpdatedContent = $UpdatedContent -replace ',(\s*[\r\n]*\s*[,\]])', '$1'
                $UpdatedContent = $UpdatedContent -replace ',(\s*\])', '$1'

                # Save the updated content
                $UpdatedContent | Set-Content $SettingsPath -NoNewline
                Write-Host "   OK Removed RTL script from settings.json" -ForegroundColor Green
                $RestoredCount++
            } else {
                Write-Host "   - RTL script not found in settings.json" -ForegroundColor Gray
            }
        } catch {
            Write-Host "   X Error updating settings.json: $_" -ForegroundColor Red
            $ErrorCount++
        }
    } else {
        Write-Host "   - Skipped settings.json cleanup" -ForegroundColor Gray
    }
} else {
    Write-Host "   - settings.json not found" -ForegroundColor Gray
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Uninstall Complete!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Summary:" -ForegroundColor Yellow
Write-Host "   Files restored: $RestoredCount" -ForegroundColor $(if ($RestoredCount -gt 0) { "Green" } else { "Gray" })
Write-Host "   Errors: $ErrorCount" -ForegroundColor $(if ($ErrorCount -gt 0) { "Red" } else { "Gray" })
Write-Host ""

if ($RestoredCount -gt 0) {
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Restart VS Code and Antigravity" -ForegroundColor White
    Write-Host "2. RTL support has been removed" -ForegroundColor White
    Write-Host ""

    # Ask if user wants to restart
    $Restart = Read-Host "Do you want to restart VS Code now? (y/n)"
    if ($Restart -eq 'y' -or $Restart -eq 'Y') {
        Write-Host "Restarting VS Code..." -ForegroundColor Cyan
        Get-Process -Name "Code" -ErrorAction SilentlyContinue | Stop-Process -Force
        Start-Sleep -Seconds 2
        Start-Process "code"
    }
}

Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Cyan
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
