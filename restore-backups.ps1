# Quick restore script
Write-Host "Restoring backups..." -ForegroundColor Yellow

# Restore Claude Code
$ExtensionsPath = "$env:USERPROFILE\.vscode\extensions"
$ClaudeExtension = Get-ChildItem -Path $ExtensionsPath -Filter "anthropic.claude-code-*" -Directory | Select-Object -First 1
if ($ClaudeExtension) {
    $WebviewPath = Join-Path $ClaudeExtension.FullName "webview"
    $IndexJs = Join-Path $WebviewPath "index.js"
    $BackupPath = "$IndexJs.backup"
    if (Test-Path $BackupPath) {
        Remove-Item $IndexJs -Force
        Move-Item $BackupPath $IndexJs
        Write-Host "✓ Claude Code: Restored from backup" -ForegroundColor Green
    } else {
        Write-Host "- Claude Code: No backup found" -ForegroundColor Gray
    }
} else {
    Write-Host "- Claude Code: Not found" -ForegroundColor Gray
}

# Restore Antigravity
$AntigravityPath = "$env:LOCALAPPDATA\Programs\Antigravity"
if (Test-Path $AntigravityPath) {
    $ChatJsPath = Join-Path $AntigravityPath "resources\app\extensions\antigravity\out\media\chat.js"
    $BackupPath = "$ChatJsPath.backup"
    if (Test-Path $BackupPath) {
        Remove-Item $ChatJsPath -Force
        Move-Item $BackupPath $ChatJsPath
        Write-Host "✓ Antigravity: Restored from backup" -ForegroundColor Green
    } else {
        Write-Host "- Antigravity: No backup found" -ForegroundColor Gray
    }
} else {
    Write-Host "- Antigravity: Not found" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Done! Now you can run install.ps1 again" -ForegroundColor Cyan
