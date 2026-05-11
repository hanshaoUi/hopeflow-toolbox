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
$SetupName = "HopeFlow-Toolbox-$Version-Windows-Setup"
$SetupExePath = Join-Path $ReleaseRoot "$SetupName.exe"
$InstallerWorkDir = Join-Path $ReleaseRoot "$SetupName-work"
$IExpressWorkDir = Join-Path $env:TEMP "$SetupName-work"
$IExpressExePath = Join-Path $env:TEMP "$SetupName.exe"

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

foreach ($dir in @($InstallerWorkDir, $IExpressWorkDir)) {
    if (Test-Path -LiteralPath $dir) {
        Remove-Item -LiteralPath $dir -Recurse -Force
    }
}
New-Item -ItemType Directory -Path $InstallerWorkDir -Force | Out-Null
New-Item -ItemType Directory -Path $IExpressWorkDir -Force | Out-Null

$PayloadZipName = 'HopeFlow-Toolbox-Windows.zip'
$PayloadZipPath = Join-Path $InstallerWorkDir $PayloadZipName
Copy-Item -LiteralPath $ZipPath -Destination $PayloadZipPath -Force
Copy-Item -LiteralPath $ZipPath -Destination (Join-Path $IExpressWorkDir $PayloadZipName) -Force

$BootstrapPath = Join-Path $InstallerWorkDir 'setup-bootstrap.ps1'
$IExpressBootstrapPath = Join-Path $IExpressWorkDir 'setup-bootstrap.ps1'
$Bootstrap = @"
`$ErrorActionPreference = 'Stop'

`$payload = Join-Path `$PSScriptRoot '$PayloadZipName'
`$extractRoot = Join-Path `$env:TEMP ('HopeFlowToolboxSetup_' + [guid]::NewGuid().ToString('N'))

New-Item -ItemType Directory -Path `$extractRoot -Force | Out-Null
Expand-Archive -LiteralPath `$payload -DestinationPath `$extractRoot -Force

`$installer = Join-Path `$extractRoot 'HopeFlow-Installer.bat'
if (-not (Test-Path -LiteralPath `$installer)) {
    throw 'Installer package is incomplete. HopeFlow-Installer.bat was not found.'
}

`$process = Start-Process -FilePath `$installer -WorkingDirectory `$extractRoot -Wait -PassThru
exit `$process.ExitCode
"@
Set-Content -LiteralPath $BootstrapPath -Value $Bootstrap -Encoding UTF8
Set-Content -LiteralPath $IExpressBootstrapPath -Value $Bootstrap -Encoding UTF8

$SedPath = Join-Path $IExpressWorkDir "$SetupName.sed"
$Sed = @"
[Version]
Class=IEXPRESS
SEDVersion=3

[Options]
PackagePurpose=InstallApp
ShowInstallProgramWindow=0
HideExtractAnimation=1
UseLongFileName=1
InsideCompressed=0
CAB_FixedSize=0
CAB_ResvCodeSigning=0
RebootMode=N
InstallPrompt=
DisplayLicense=
FinishMessage=
TargetName=$IExpressExePath
FriendlyName=HopeFlow Toolbox Installer
AppLaunched=powershell.exe -NoProfile -ExecutionPolicy Bypass -File setup-bootstrap.ps1
PostInstallCmd=<None>
AdminQuietInstCmd=
UserQuietInstCmd=
SourceFiles=SourceFiles

[Strings]
FILE0=setup-bootstrap.ps1
FILE1=$PayloadZipName

[SourceFiles]
SourceFiles0=$IExpressWorkDir

[SourceFiles0]
%FILE0%=
%FILE1%=
"@
Set-Content -LiteralPath $SedPath -Value $Sed -Encoding ASCII

foreach ($path in @($SetupExePath, $IExpressExePath)) {
    if (Test-Path -LiteralPath $path) {
        Remove-Item -LiteralPath $path -Force
    }
}

$iexpress = Join-Path $env:SystemRoot 'System32\iexpress.exe'
if (-not (Test-Path -LiteralPath $iexpress)) {
    throw 'iexpress.exe was not found. Cannot create the Windows setup executable.'
}

& $iexpress /N /Q $SedPath
for ($i = 0; $i -lt 120 -and -not (Test-Path -LiteralPath $IExpressExePath); $i++) {
    Start-Sleep -Milliseconds 500
}
if (-not (Test-Path -LiteralPath $IExpressExePath)) {
    throw "Failed to create Windows setup executable: $SetupExePath"
}

$lastSize = -1
$stableCount = 0
for ($i = 0; $i -lt 120; $i++) {
    $currentSize = (Get-Item -LiteralPath $IExpressExePath).Length
    if ($currentSize -eq $lastSize -and $currentSize -gt 500kb) {
        $stableCount++
        if ($stableCount -ge 2) {
            break
        }
    } else {
        $stableCount = 0
    }

    $lastSize = $currentSize
    Start-Sleep -Milliseconds 500
}

if ((Get-Item -LiteralPath $IExpressExePath).Length -le 500kb) {
    throw "Created setup executable is incomplete: $IExpressExePath"
}
if ($null -ne $LASTEXITCODE -and $LASTEXITCODE -ne 0) {
    Write-Warning "iexpress.exe returned exit code $LASTEXITCODE, but the setup executable was created."
}

Copy-Item -LiteralPath $IExpressExePath -Destination $SetupExePath -Force
Copy-Item -LiteralPath $SedPath -Destination (Join-Path $InstallerWorkDir "$SetupName.sed") -Force
Write-Host "Windows setup executable created: $SetupExePath"
