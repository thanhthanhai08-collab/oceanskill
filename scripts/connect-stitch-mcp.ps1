$ErrorActionPreference = "Stop"

$sourcePath = Join-Path $HOME ".gemini\config\mcp_config.json"
$targetPath = Join-Path $HOME ".codex\config.toml"
$backupPath = Join-Path $HOME ".codex\config.toml.pre-stitch.bak"

if (-not (Test-Path -LiteralPath $sourcePath)) {
  throw "Antigravity MCP configuration was not found."
}

if (-not (Test-Path -LiteralPath $targetPath)) {
  throw "Codex configuration was not found."
}

$source = Get-Content -Raw -LiteralPath $sourcePath | ConvertFrom-Json
$stitch = $source.mcpServers.StitchMCP

if (-not $stitch) {
  throw "StitchMCP is not configured in Antigravity."
}

$current = Get-Content -Raw -LiteralPath $targetPath
if ($current -match '(?m)^\[mcp_servers\.stitch\]$') {
  Write-Output "Stitch MCP is already configured in Codex."
  exit 0
}

Copy-Item -LiteralPath $targetPath -Destination $backupPath -Force

$command = $stitch.command | ConvertTo-Json -Compress
$arguments = $stitch.args | ConvertTo-Json -Compress
$block = @"

[mcp_servers.stitch]
command = $command
args = $arguments
startup_timeout_sec = 120
"@

Add-Content -LiteralPath $targetPath -Value $block -Encoding utf8
Write-Output "Stitch MCP configuration added to Codex. Restart Codex to load it."
