[CmdletBinding()]
param(
	[string]$DistRoot,
	[string]$ServerSource
)

$ErrorActionPreference = 'Stop'
$defaultDistRoot = Join-Path $PSScriptRoot '..\dist\angular-ai-contacts\browser'
$defaultServerSource = Join-Path $PSScriptRoot '..\scripts\appservice-spa-server.js'
if (-not $DistRoot) {
	$DistRoot = $defaultDistRoot
}
if (-not $ServerSource) {
	$ServerSource = $defaultServerSource
}

$distPath = [System.IO.Path]::GetFullPath($DistRoot)
$serverPath = [System.IO.Path]::GetFullPath($ServerSource)
$serverTarget = Join-Path $distPath 'server.js'
$versionTarget = Join-Path $distPath 'version.json'
$repoRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$packageJsonPath = Join-Path $repoRoot 'package.json'

if (-not (Test-Path $distPath)) {
	throw "Build output not found at '$distPath'. Run 'npm run build:prod' first."
}

if (-not (Test-Path $serverPath)) {
	throw "Server source not found at '$serverPath'."
}

if (-not (Test-Path $packageJsonPath)) {
	throw "package.json not found at '$packageJsonPath'."
}

Copy-Item -Path $serverPath -Destination $serverTarget -Force

$packageJson = Get-Content -Path $packageJsonPath -Raw | ConvertFrom-Json
$buildTimestampUtc = (Get-Date).ToUniversalTime().ToString('o')
$gitCommit = $null
if (Get-Command git -ErrorAction SilentlyContinue) {
	$gitCommit = (git -C $repoRoot rev-parse --short HEAD 2>$null)
	if ($LASTEXITCODE -ne 0) {
		$gitCommit = $null
	}
}

$versionInfo = [ordered]@{
	appName = $packageJson.name
	appVersion = $packageJson.version
	buildTimestampUtc = $buildTimestampUtc
	gitCommit = $gitCommit
}

$versionInfo | ConvertTo-Json | Set-Content -Path $versionTarget -Encoding UTF8

Write-Host "Prepared UI package. Copied custom App Service server to '$serverTarget' and wrote '$versionTarget'."
