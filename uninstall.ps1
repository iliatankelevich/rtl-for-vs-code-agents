# RTL for VS Code Agents - Uninstall Script
# This script removes all RTL injections and restores original files

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "RTL for VS Code Agents - Uninstaller" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

$RestoredCount = 0
$ErrorCount = 0

# Helper function to restore a webview file from backup
function Restore-WebviewBackup {
    param($ExtensionPath, $WebviewFile, $Location)

    $TargetJs = Join-Path $ExtensionPath $WebviewFile
    $BackupPath = "$TargetJs.backup"
    $FileName = Split-Path $WebviewFile -Leaf

    if (Test-Path $BackupPath) {
        try {
            Remove-Item $TargetJs -Force
            Move-Item $BackupPath $TargetJs
            Write-Host "   OK Restored $FileName from backup ($Location)" -ForegroundColor Green
            return $true
        } catch {
            Write-Host "   X Error restoring $FileName ($Location): $_" -ForegroundColor Red
            return $false
        }
    } else {
        Write-Host "   - No backup found ($Location)" -ForegroundColor Gray
        return $null
    }
}

# 1. Restore Claude Code
Write-Host "Step 1: Restoring Claude Code..." -ForegroundColor Yellow

# Check VS Code - Find ALL versions
$VSCodeExtPath = "$env:USERPROFILE\.vscode\extensions"
$ClaudeVSCodeList = Get-ChildItem -Path $VSCodeExtPath -Filter "anthropic.claude-code-*" -Directory -ErrorAction SilentlyContinue

if ($ClaudeVSCodeList.Count -gt 0) {
    foreach ($ext in $ClaudeVSCodeList) {
        Write-Host "   Processing VS Code ($($ext.Name))..." -ForegroundColor Cyan
        $result = Restore-WebviewBackup -ExtensionPath $ext.FullName -WebviewFile "webview\index.js" -Location "VS Code"
        if ($result -eq $true) { $RestoredCount++ }
        elseif ($result -eq $false) { $ErrorCount++ }
    }
}

# Check Cursor - Find ALL versions
$CursorExtPath = "$env:USERPROFILE\.cursor\extensions"
$ClaudeCursorList = @()
if (Test-Path $CursorExtPath) {
    $ClaudeCursorList = Get-ChildItem -Path $CursorExtPath -Filter "anthropic.claude-code-*" -Directory -ErrorAction SilentlyContinue

    if ($ClaudeCursorList.Count -gt 0) {
        foreach ($ext in $ClaudeCursorList) {
            Write-Host "   Processing Cursor ($($ext.Name))..." -ForegroundColor Cyan
            $result = Restore-WebviewBackup -ExtensionPath $ext.FullName -WebviewFile "webview\index.js" -Location "Cursor"
            if ($result -eq $true) { $RestoredCount++ }
            elseif ($result -eq $false) { $ErrorCount++ }
        }
    }
}

# Check Antigravity - Find ALL versions
$AntigravityExtPath = "$env:USERPROFILE\.antigravity\extensions"
$ClaudeAntigravityList = @()
if (Test-Path $AntigravityExtPath) {
    $ClaudeAntigravityList = Get-ChildItem -Path $AntigravityExtPath -Filter "anthropic.claude-code-*" -Directory -ErrorAction SilentlyContinue
    
    if ($ClaudeAntigravityList.Count -gt 0) {
        foreach ($ext in $ClaudeAntigravityList) {
            Write-Host "   Processing Antigravity ($($ext.Name))..." -ForegroundColor Cyan
            $result = Restore-WebviewBackup -ExtensionPath $ext.FullName -WebviewFile "webview\index.js" -Location "Antigravity"
            if ($result -eq $true) { $RestoredCount++ }
            elseif ($result -eq $false) { $ErrorCount++ }
        }
    }
}

if ($ClaudeVSCodeList.Count -eq 0 -and $ClaudeCursorList.Count -eq 0 -and (-not (Test-Path $AntigravityExtPath) -or $ClaudeAntigravityList.Count -eq 0)) {
    Write-Host "   - Claude Code extension not found" -ForegroundColor Gray
}

Write-Host ""

# 2. Restore Gemini Code Assist
Write-Host "Step 2: Restoring Gemini Code Assist..." -ForegroundColor Yellow

$GeminiVSCodeList = Get-ChildItem -Path $VSCodeExtPath -Filter "google.geminicodeassist-*" -Directory -ErrorAction SilentlyContinue

if ($GeminiVSCodeList.Count -gt 0) {
    foreach ($ext in $GeminiVSCodeList) {
        Write-Host "   Processing VS Code ($($ext.Name))..." -ForegroundColor Cyan
        $result = Restore-WebviewBackup -ExtensionPath $ext.FullName -WebviewFile "webview\app_bundle.js" -Location "VS Code"
        if ($result -eq $true) { $RestoredCount++ }
        elseif ($result -eq $false) { $ErrorCount++ }
    }
}

$GeminiCursorList = @()
if (Test-Path $CursorExtPath) {
    $GeminiCursorList = Get-ChildItem -Path $CursorExtPath -Filter "google.geminicodeassist-*" -Directory -ErrorAction SilentlyContinue

    if ($GeminiCursorList.Count -gt 0) {
        foreach ($ext in $GeminiCursorList) {
            Write-Host "   Processing Cursor ($($ext.Name))..." -ForegroundColor Cyan
            $result = Restore-WebviewBackup -ExtensionPath $ext.FullName -WebviewFile "webview\app_bundle.js" -Location "Cursor"
            if ($result -eq $true) { $RestoredCount++ }
            elseif ($result -eq $false) { $ErrorCount++ }
        }
    }
}

if ($GeminiVSCodeList.Count -eq 0 -and $GeminiCursorList.Count -eq 0) {
    Write-Host "   - Gemini Code Assist extension not found" -ForegroundColor Gray
}

Write-Host ""

# 3. Restore Google Antigravity
Write-Host "Step 3: Restoring Google Antigravity..." -ForegroundColor Yellow
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

# 4. Clean up settings.json (optional)
Write-Host "Step 4: Cleaning settings.json..." -ForegroundColor Yellow
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
    Write-Host "1. Reload VS Code to apply changes: Ctrl+Shift+P -> Reload Window" -ForegroundColor White
    Write-Host "2. RTL support has been removed" -ForegroundColor White
    Write-Host ""
}

Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Cyan
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
