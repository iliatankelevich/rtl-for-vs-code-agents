# RTL for VS Code Agents - Diagnostic Script (Windows)
# Reads only. No changes are made.

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "RTL for VS Code Agents - Diagnostics" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

$Report = [ordered]@{}

function Extract-SelectorsFromFile {
    param([string]$FilePath)

    $result = [ordered]@{
        chatSelectors = @()
        inputSelectors = @()
    }

    if (-not (Test-Path $FilePath)) {
        return $result
    }

    $content = Get-Content $FilePath -Raw -ErrorAction SilentlyContinue
    if (-not $content) { return $result }

    $chatMatch = [regex]::Match($content, 'chatSelectors\s*:\s*\[(?<block>[\s\S]*?)\]\s*,')
    if ($chatMatch.Success) {
        $result.chatSelectors = [regex]::Matches($chatMatch.Groups['block'].Value, "'([^']+)'|\"([^\"]+)\"") | ForEach-Object { if ($_.Groups[1].Value) { $_.Groups[1].Value } else { $_.Groups[2].Value } }
    }

    $inputMatch = [regex]::Match($content, 'inputSelectors\s*:\s*\[(?<block>[\s\S]*?)\]\s*,')
    if ($inputMatch.Success) {
        $result.inputSelectors = [regex]::Matches($inputMatch.Groups['block'].Value, "'([^']+)'|\"([^\"]+)\"") | ForEach-Object { if ($_.Groups[1].Value) { $_.Groups[1].Value } else { $_.Groups[2].Value } }
    }

    return $result
}

# Helper: scan Claude Code extensions
function Scan-ClaudeExtensions {
    param([string]$BasePath, [string]$LocationLabel)

    $results = @()
    if (Test-Path $BasePath) {
        $exts = Get-ChildItem -Path $BasePath -Filter "anthropic.claude-code-*" -Directory -ErrorAction SilentlyContinue
        foreach ($ext in $exts) {
            $indexJs = Join-Path $ext.FullName "webview\index.js"
            $backup = "$indexJs.backup"
            $hasIndex = Test-Path $indexJs
            $hasBackup = Test-Path $backup
            $injected = $false
            if ($hasIndex) {
                $content = Get-Content $indexJs -Raw -ErrorAction SilentlyContinue
                if ($content -match "RTL Support for VS Code AI Chat Agents") {
                    $injected = $true
                }
            }
            $results += [ordered]@{
                name = $ext.Name
                path = $ext.FullName
                indexJsExists = $hasIndex
                backupExists = $hasBackup
                injectedMarkerFound = $injected
            }
        }
    }
    return $results
}

# Claude Code (VS Code)
$vsExtPath = "$env:USERPROFILE\.vscode\extensions"
$Report["claudeVSCode"] = Scan-ClaudeExtensions -BasePath $vsExtPath -LocationLabel "VS Code"

# Claude Code (Antigravity)
$antiExtPath = "$env:USERPROFILE\.antigravity\extensions"
$Report["claudeAntigravity"] = Scan-ClaudeExtensions -BasePath $antiExtPath -LocationLabel "Antigravity"

# Antigravity chat.js
$antiAppPath = "$env:LOCALAPPDATA\Programs\Antigravity"
$chatJs = Join-Path $antiAppPath "resources\app\extensions\antigravity\out\media\chat.js"
$chatBackup = "$chatJs.backup"
$chatInjected = $false
if (Test-Path $chatJs) {
    $chatContent = Get-Content $chatJs -Raw -ErrorAction SilentlyContinue
    if ($chatContent -match "RTL Support for Google Antigravity") { $chatInjected = $true }
}
$Report["antigravityChat"] = [ordered]@{
    antigravityPath = $antiAppPath
    chatJsExists = (Test-Path $chatJs)
    chatBackupExists = (Test-Path $chatBackup)
    injectedMarkerFound = $chatInjected
    chatJsPath = $chatJs
}

# settings.json (VS Code + Insiders)
$settingsPaths = @(
    "$env:APPDATA\Code\User\settings.json",
    "$env:APPDATA\Code - Insiders\User\settings.json"
)
$settingsReports = @()
foreach ($settingsPath in $settingsPaths) {
    $settingsHasImport = $false
    $settingsContainsRtl = $false
    if (Test-Path $settingsPath) {
        $raw = Get-Content $settingsPath -Raw -ErrorAction SilentlyContinue
        if ($raw -match '"vscode_custom_css\.imports"') { $settingsHasImport = $true }
        if ($raw -match "rtl-for-vscode-agents\.js") { $settingsContainsRtl = $true }
    }
    $settingsReports += [ordered]@{
        settingsPath = $settingsPath
        exists = (Test-Path $settingsPath)
        hasCustomCssImports = $settingsHasImport
        containsRtlScript = $settingsContainsRtl
    }
}
$Report["settings"] = $settingsReports

# Check common RTL script locations
$commonPaths = @(
    "$env:USERPROFILE\vscode-custom\rtl-for-vscode-agents.js",
    "$env:USERPROFILE\rtl-for-vscode-agents.js"
)
$foundScripts = @()
foreach ($p in $commonPaths) {
    if (Test-Path $p) { $foundScripts += $p }
}
$Report["rtlScriptFiles"] = $foundScripts

# Selectors from RTL script
$selectorsPath = Join-Path $PSScriptRoot "rtl-for-vs-code-agents.js"
$chatSelectors = @()
$inputSelectors = @()
if (Test-Path $selectorsPath) {
    $scriptContent = Get-Content $selectorsPath -Raw -ErrorAction SilentlyContinue

    $chatMatch = [regex]::Match($scriptContent, 'chatSelectors\s*:\s*\[(?<block>[\s\S]*?)\]\s*,')
    if ($chatMatch.Success) {
        $chatSelectors = [regex]::Matches($chatMatch.Groups['block'].Value, "'([^']+)'|\"([^\"]+)\"") | ForEach-Object { if ($_.Groups[1].Value) { $_.Groups[1].Value } else { $_.Groups[2].Value } }
    }

    $inputMatch = [regex]::Match($scriptContent, 'inputSelectors\s*:\s*\[(?<block>[\s\S]*?)\]\s*,')
    if ($inputMatch.Success) {
        $inputSelectors = [regex]::Matches($inputMatch.Groups['block'].Value, "'([^']+)'|\"([^\"]+)\"") | ForEach-Object { if ($_.Groups[1].Value) { $_.Groups[1].Value } else { $_.Groups[2].Value } }
    }
}

# Output summary
Write-Host "=== SUMMARY ===" -ForegroundColor Yellow
Write-Host "Claude VS Code versions found: $($Report.claudeVSCode.Count)"
Write-Host "Claude Antigravity versions found: $($Report.claudeAntigravity.Count)"
Write-Host "Antigravity chat.js exists: $($Report.antigravityChat.chatJsExists)"
Write-Host "Settings files found: $(( $Report.settings | Where-Object { $_.exists } ).Count)"
Write-Host ""

Write-Host "=== DETAILS ===" -ForegroundColor Yellow

Write-Host "\n-- Claude Code (VS Code) --" -ForegroundColor Cyan
if ($Report.claudeVSCode.Count -eq 0) {
    Write-Host "   None found" -ForegroundColor Gray
} else {
    foreach ($item in $Report.claudeVSCode) {
        Write-Host "   Name: $($item.name)"
        Write-Host "   Path: $($item.path)"
        Write-Host "   index.js exists: $($item.indexJsExists)"
        Write-Host "   backup exists:   $($item.backupExists)"
        Write-Host "   injected marker: $($item.injectedMarkerFound)"
        Write-Host ""
    }
}

Write-Host "-- Claude Code (Antigravity) --" -ForegroundColor Cyan
if ($Report.claudeAntigravity.Count -eq 0) {
    Write-Host "   None found" -ForegroundColor Gray
} else {
    foreach ($item in $Report.claudeAntigravity) {
        Write-Host "   Name: $($item.name)"
        Write-Host "   Path: $($item.path)"
        Write-Host "   index.js exists: $($item.indexJsExists)"
        Write-Host "   backup exists:   $($item.backupExists)"
        Write-Host "   injected marker: $($item.injectedMarkerFound)"
        Write-Host ""
    }
}

Write-Host "-- Antigravity chat.js --" -ForegroundColor Cyan
Write-Host "   Path: $($Report.antigravityChat.chatJsPath)"
Write-Host "   chat.js exists:  $($Report.antigravityChat.chatJsExists)"
Write-Host "   backup exists:   $($Report.antigravityChat.chatBackupExists)"
Write-Host "   injected marker: $($Report.antigravityChat.injectedMarkerFound)"

Write-Host "\n-- settings.json --" -ForegroundColor Cyan
if (($Report.settings | Where-Object { $_.exists }).Count -eq 0) {
    Write-Host "   None found" -ForegroundColor Gray
    Write-Host "   Expected paths:" -ForegroundColor Gray
    foreach ($s in $settingsPaths) { Write-Host "   - $s" -ForegroundColor Gray }
} else {
    foreach ($s in $Report.settings) {
        if (-not $s.exists) { continue }
        Write-Host "   Path: $($s.settingsPath)"
        Write-Host "   exists:              $($s.exists)"
        Write-Host "   has custom imports:  $($s.hasCustomCssImports)"
        Write-Host "   contains RTL script: $($s.containsRtlScript)"
        Write-Host ""
    }
}

Write-Host "\n-- RTL script files --" -ForegroundColor Cyan
if ($Report.rtlScriptFiles.Count -eq 0) {
    Write-Host "   None found" -ForegroundColor Gray
} else {
    foreach ($p in $Report.rtlScriptFiles) {
        Write-Host "   $p"
    }
}

Write-Host "\n-- Selectors (from injected files) --" -ForegroundColor Cyan
function Print-Selectors {
    param([string]$Label, [string]$FilePath)

    Write-Host "   $Label"
    if (-not (Test-Path $FilePath)) {
        Write-Host "     File not found: $FilePath" -ForegroundColor Gray
        return
    }

    $selectors = Extract-SelectorsFromFile -FilePath $FilePath
    Write-Host "     Chat selectors:"
    if ($selectors.chatSelectors.Count -eq 0) {
        Write-Host "       None found" -ForegroundColor Gray
    } else {
        foreach ($sel in $selectors.chatSelectors) {
            Write-Host "       $sel"
        }
    }

    Write-Host "     Input selectors:"
    if ($selectors.inputSelectors.Count -eq 0) {
        Write-Host "       None found" -ForegroundColor Gray
    } else {
        foreach ($sel in $selectors.inputSelectors) {
            Write-Host "       $sel"
        }
    }
}

foreach ($item in $Report.claudeVSCode) {
    $indexJsPath = Join-Path $item.path "webview\index.js"
    Print-Selectors -Label "Claude VS Code ($($item.name))" -FilePath $indexJsPath
}

foreach ($item in $Report.claudeAntigravity) {
    $indexJsPath = Join-Path $item.path "webview\index.js"
    Print-Selectors -Label "Claude Antigravity ($($item.name))" -FilePath $indexJsPath
}

if ($Report.antigravityChat.chatJsExists) {
    Print-Selectors -Label "Antigravity chat.js" -FilePath $Report.antigravityChat.chatJsPath
}

Write-Host "\n-- Selectors (from local rtl-for-vs-code-agents.js) --" -ForegroundColor Cyan
if (-not (Test-Path $selectorsPath)) {
    Write-Host "   Script not found at: $selectorsPath" -ForegroundColor Gray
} else {
    Write-Host "   Chat selectors:"
    if ($chatSelectors.Count -eq 0) {
        Write-Host "     None found" -ForegroundColor Gray
    } else {
        foreach ($sel in $chatSelectors) {
            Write-Host "     $sel"
        }
    }

    Write-Host "   Input selectors:"
    if ($inputSelectors.Count -eq 0) {
        Write-Host "     None found" -ForegroundColor Gray
    } else {
        foreach ($sel in $inputSelectors) {
            Write-Host "     $sel"
        }
    }
}

Write-Host "\n-- Other selectors used (hardcoded) --" -ForegroundColor Cyan
$otherSelectors = @(
    'div.code',
    'pre',
    'code',
    'p',
    'li',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'ul',
    'ol',
    '.monaco-editor',
    '.view-lines',
    '.view-line'
)
foreach ($sel in $otherSelectors) {
    Write-Host "   $sel"
}
