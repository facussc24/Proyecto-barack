$ErrorActionPreference = 'Stop'

# Ensure Node.js and npm are available
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host 'Node.js 18 o superior es necesario para compilar. Desc\u00e1rgalo desde https://nodejs.org/'
    exit 1
}

# Directory of this script
$scriptRoot   = $PSScriptRoot
$projectRoot  = Resolve-Path (Join-Path $scriptRoot '..')

function Test-Admin {
    $id         = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal  = New-Object Security.Principal.WindowsPrincipal($id)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

if (-not (Test-Admin)) {
    Write-Host "Requesting administrator privileges..."
    $psArgs = @(
        '-NoProfile'
        '-ExecutionPolicy'
        'Bypass'
        '-File'
        $MyInvocation.MyCommand.Path
    )
    Start-Process -FilePath 'powershell' -ArgumentList $psArgs -Verb RunAs
    exit
}

Push-Location $projectRoot

npm install
if ($LASTEXITCODE -ne 0) {
    Pop-Location
    exit $LASTEXITCODE
}

npm run build-exe
if ($LASTEXITCODE -ne 0) {
    Pop-Location
    exit $LASTEXITCODE
}

Pop-Location
