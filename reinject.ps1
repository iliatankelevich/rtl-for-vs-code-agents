$indexPath = 'C:\Users\guyro\.vscode\extensions\anthropic.claude-code-2.0.75-win32-x64\webview\index.js'
$rtlScript = 'c:\Users\guyro\.vscode\extensions\rtl-for-vs-code-agents\claude-code-rtl-simple.js'

# Read current file
$content = [System.IO.File]::ReadAllBytes($indexPath)
Write-Host "Current size: $($content.Length) bytes"

# Truncate to remove old RTL script (approximately 8552 bytes)
$originalSize = $content.Length - 8552
$originalContent = $content[0..($originalSize-1)]
[System.IO.File]::WriteAllBytes($indexPath, [byte[]]$originalContent)
Write-Host "Truncated to: $($originalContent.Length) bytes"

# Inject new RTL script
Get-Content $rtlScript | Add-Content $indexPath
$newSize = (Get-Item $indexPath).Length
Write-Host "After injection: $newSize bytes"
Write-Host "Done!"
