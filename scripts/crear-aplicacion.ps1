$ErrorActionPreference = 'Stop'

# Directory of this script
$scriptRoot = $PSScriptRoot
$projectRoot = Resolve-Path "$scriptRoot/.."

function Test-Admin {
    $id = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($id)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

if (-not (Test-Admin)) {
    Write-Host "Requesting administrator privileges..."
    $args = "-NoProfile -ExecutionPolicy Bypass -File `\"$($MyInvocation.MyCommand.Path)`\""
    Start-Process -FilePath "powershell" -ArgumentList $args -Verb RunAs
    exit
}

Push-Location $projectRoot

npm install
if ($LASTEXITCODE -ne 0) { Pop-Location; exit $LASTEXITCODE }

npm run build-exe
if ($LASTEXITCODE -ne 0) { Pop-Location; exit $LASTEXITCODE }

Pop-Location
