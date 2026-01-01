# RTL for Claude Code - Installation Script
# This script automates the installation of RTL support for Claude Code

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "RTL for Claude Code - Installer" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Get script directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Find Claude Code extension
Write-Host "Step 1: Locating Claude Code extension..." -ForegroundColor Yellow
$ExtensionsPath = "$env:USERPROFILE\.vscode\extensions"
$ClaudeExtension = Get-ChildItem -Path $ExtensionsPath -Filter "anthropic.claude-code-*" -Directory | Select-Object -First 1

if ($ClaudeExtension) {
    Write-Host "   Found: $($ClaudeExtension.Name)" -ForegroundColor Green

    $WebviewPath = Join-Path $ClaudeExtension.FullName "webview"
    $IndexJs = Join-Path $WebviewPath "index.js"

    if (Test-Path $IndexJs) {
        Write-Host "   Found index.js" -ForegroundColor Green

        # Ask user if they want to inject
        $InjectClaude = Read-Host "`nDo you want to inject RTL support into Claude Code? (y/n)"

        if ($InjectClaude -eq 'y' -or $InjectClaude -eq 'Y') {
            # Backup
            $BackupPath = "$IndexJs.backup"
            if (-not (Test-Path $BackupPath)) {
                Copy-Item $IndexJs $BackupPath
                Write-Host "   Backup created: index.js.backup" -ForegroundColor Green
            } else {
                Write-Host "   Backup already exists" -ForegroundColor Yellow
            }

            # Read the JS file
            $JsContent = Get-Content $IndexJs -Raw

            # Read RTL script
            $RtlScript = Get-Content (Join-Path $ScriptDir "rtl-for-vs-code-agents.js") -Raw

            # Check if already injected
            if ($JsContent -match "RTL for VS Code Agents") {
                Write-Host "   RTL script already injected!" -ForegroundColor Yellow
            } else {
                # Append the script to the end of index.js
                $JsContent += "`n`n// RTL Support for Claude Code`n"
                $JsContent += $RtlScript

                # Write back to file
                Set-Content -Path $IndexJs -Value $JsContent -NoNewline
                Write-Host "   RTL script injected successfully!" -ForegroundColor Green
            }
        }
    } else {
        Write-Host "   Error: index.js not found at expected location" -ForegroundColor Red
        Write-Host "   Expected: $IndexJs" -ForegroundColor Gray
    }
} else {
    Write-Host "   Claude Code extension not found at $ExtensionsPath" -ForegroundColor Yellow
    Write-Host "   Please install Claude Code extension first" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Installation Complete!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Restart VS Code" -ForegroundColor White
Write-Host "2. RTL support will be active in Claude Code!" -ForegroundColor White
Write-Host ""

# Ask if user wants to restart VS Code
$RestartVSCode = Read-Host "Do you want to restart VS Code now? (y/n)"
if ($RestartVSCode -eq 'y' -or $RestartVSCode -eq 'Y') {
    Write-Host "Restarting VS Code..." -ForegroundColor Cyan
    # Close VS Code if running
    Get-Process -Name "Code" -ErrorAction SilentlyContinue | Stop-Process -Force
    Start-Sleep -Seconds 2
    # Start VS Code
    Start-Process "code"
}

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
