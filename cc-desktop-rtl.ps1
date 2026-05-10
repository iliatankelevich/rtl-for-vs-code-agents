# Bootstrap launcher for CC-Desktop-RTL-Search-YOLO.ps1
# Usage:
#   irm https://raw.githubusercontent.com/GuyRonnen/rtl-for-vs-code-agents/main/cc-desktop-rtl.ps1 | iex
#
# Why this exists: the main script is UTF-8 with BOM (required so Windows
# PowerShell 5.1 can correctly parse its non-ASCII content). When a
# BOM-prefixed script is fetched and piped through iex, the leading BOM
# breaks the parser and turns comment lines into stray operators
# ("Missing expression after unary operator '-'", etc.). This bootstrap
# fetches the main script, strips the BOM, and runs it as a script block.

$ErrorActionPreference = 'Stop'
$mainUrl = 'https://raw.githubusercontent.com/GuyRonnen/rtl-for-vs-code-agents/main/CC-Desktop-RTL-Search-YOLO.ps1'

[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$src = (Invoke-WebRequest -Uri $mainUrl -UseBasicParsing).Content
$src = $src.TrimStart([char]0xFEFF)

& ([scriptblock]::Create($src))
