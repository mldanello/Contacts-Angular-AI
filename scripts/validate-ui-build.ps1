[CmdletBinding()]
param(
	[string]$DistRoot
)

$ErrorActionPreference = 'Stop'
$defaultDistRoot = Join-Path $PSScriptRoot '..\dist\angular-ai-contacts\browser'
if (-not $DistRoot) {
	$DistRoot = $defaultDistRoot
}
$distPath = [System.IO.Path]::GetFullPath($DistRoot)

if (-not (Test-Path $distPath)) {
	throw "Build output not found at '$distPath'. Run 'npm run build:prod' first."
}

$jsFiles = Get-ChildItem -Path $distPath -Filter '*.js' -File
if (-not $jsFiles -or $jsFiles.Count -eq 0) {
	throw "No JavaScript bundles found in '$distPath'."
}

$hashedJs = $jsFiles | Where-Object { $_.Name -match '-[A-Za-z0-9]{8,}\.js$' }
if (-not $hashedJs -or $hashedJs.Count -eq 0) {
	throw "No hashed JavaScript bundles found. Expected filenames like 'main-<hash>.js'."
}

$disallowedUnhashed = @('main.js', 'polyfills.js', 'styles.css')
$presentUnhashed = @()
foreach ($fileName in $disallowedUnhashed) {
	if (Test-Path (Join-Path $distPath $fileName)) {
		$presentUnhashed += $fileName
	}
}

if ($presentUnhashed.Count -gt 0) {
	throw "Found unhashed critical assets: $($presentUnhashed -join ', '). Ensure production build with output hashing is enabled."
}

Write-Host "UI build validation passed. Hashed bundles detected in '$distPath'."
