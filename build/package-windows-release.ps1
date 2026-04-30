param(
    [switch]$SkipBuild
)

$ErrorActionPreference = 'Stop'

$RootDir = Split-Path -Parent $PSScriptRoot
$PackageJsonPath = Join-Path $RootDir 'package.json'
$PackageJson = Get-Content -Path $PackageJsonPath -Raw | ConvertFrom-Json
$Version = $PackageJson.version
$ReleaseRoot = Join-Path $RootDir 'release'
$PackageName = "HopeFlow-Toolbox-$Version-Windows"
$StageDir = Join-Path $ReleaseRoot $PackageName
$ZipPath = Join-Path $ReleaseRoot "$PackageName.zip"

function Copy-RequiredItem {
    param(
        [string]$Name
    )

    $source = Join-Path $RootDir $Name
    $target = Join-Path $StageDir $Name

    if (-not (Test-Path -LiteralPath $source)) {
        throw "Missing required release item: $Name"
    }

    $parent = Split-Path -Parent $target
    if ($parent -and -not (Test-Path -LiteralPath $parent)) {
        New-Item -ItemType Directory -Path $parent -Force | Out-Null
    }

    Copy-Item -LiteralPath $source -Destination $target -Recurse -Force
}

if (-not $SkipBuild) {
    Push-Location $RootDir
    try {
        npm run build
    } finally {
        Pop-Location
    }
}

if (Test-Path -LiteralPath $StageDir) {
    Remove-Item -LiteralPath $StageDir -Recurse -Force
}
if (-not (Test-Path -LiteralPath $ReleaseRoot)) {
    New-Item -ItemType Directory -Path $ReleaseRoot -Force | Out-Null
}
New-Item -ItemType Directory -Path $StageDir -Force | Out-Null

$items = @(
    'CSXS',
    'ai-engine',
    'dist',
    'src',
    'tools',
    'HopeFlow-Installer.bat',
    'install.bat',
    'INSTALL-WINDOWS.md',
    'README.md',
    'package.json'
)

foreach ($item in $items) {
    Copy-RequiredItem $item
}

if (Test-Path -LiteralPath $ZipPath) {
    Remove-Item -LiteralPath $ZipPath -Force
}

Compress-Archive -Path (Join-Path $StageDir '*') -DestinationPath $ZipPath -Force
Write-Host "Windows release package created: $ZipPath"
