[CmdletBinding()]
param(
	[string]$ResourceGroup = $env:AZURE_RG,
	[string]$UiWebAppName = $env:AZURE_UI_APP,
	[string]$Subscription = $env:AZURE_SUBSCRIPTION
)

$ErrorActionPreference = 'Stop'

function Invoke-AzCommand {
	param(
		[Parameter(Mandatory = $true)]
		[scriptblock]$Command,
		[Parameter(Mandatory = $true)]
		[string]$ErrorMessage
	)

	& $Command
	if ($LASTEXITCODE -ne 0) {
		throw $ErrorMessage
	}
}

if (-not $ResourceGroup) {
	throw "Resource group is required. Pass -ResourceGroup or set AZURE_RG."
}

if (-not $UiWebAppName) {
	throw "UI web app name is required. Pass -UiWebAppName or set AZURE_UI_APP."
}

if (-not (Get-Command az -ErrorAction SilentlyContinue)) {
	throw "Azure CLI (az) is not installed or not on PATH."
}

$zipCandidates = @(
	(Join-Path $PSScriptRoot '..\\angular-ui-posix.zip'),
	(Join-Path $PSScriptRoot '..\\angular-ui.zip')
) | ForEach-Object { [System.IO.Path]::GetFullPath($_) }

$zipPath = $zipCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1

if (-not $zipPath) {
	throw "Build artifact not found. Run 'npm run build:prod' and 'npm run zip:ui' first."
}

Write-Host "Checking Azure login state..."
$null = az account show --output none 2>$null
if ($LASTEXITCODE -ne 0) {
	throw "You are not logged in. Run 'az login' first."
}

if ($Subscription) {
	Write-Host "Selecting subscription '$Subscription'..."
	Invoke-AzCommand -Command { az account set --subscription $Subscription } -ErrorMessage "Failed to select subscription '$Subscription'."
}

Write-Host "Deploying '$zipPath' to web app '$UiWebAppName' in resource group '$ResourceGroup'..."
Invoke-AzCommand -Command {
	az webapp deploy --resource-group $ResourceGroup --name $UiWebAppName --src-path $zipPath --type zip
} -ErrorMessage "Web app deploy failed. Verify resource group and web app name."

Write-Host "Applying Linux startup command for SPA server with cache headers..."
Invoke-AzCommand -Command {
	az webapp config set --resource-group $ResourceGroup --name $UiWebAppName --startup-file "node /home/site/wwwroot/server.js"
} -ErrorMessage "Failed to set startup command."

Write-Host "Deployment completed."
