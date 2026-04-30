param(
    [switch]$Gui,
    [switch]$Cli,
    [switch]$Uninstall,
    [switch]$Check
)

$ErrorActionPreference = 'Stop'

$ExtensionId = 'com.hopeflow.toolbox'
$ExtensionFolderName = 'HopeFlow Toolbox'
$RootDir = Split-Path -Parent $PSScriptRoot
$UserCepRoot = Join-Path $env:APPDATA 'Adobe\CEP\extensions'
$InstallDir = Join-Path $UserCepRoot $ExtensionId
$BackupRoot = Join-Path $env:TEMP 'HopeFlowToolboxBackups'

function Write-Step {
    param([string]$Message)
    Write-Host "[HopeFlow] $Message"
}

function Test-PluginPackage {
    $required = @(
        'CSXS\manifest.xml',
        'dist\index.html',
        'ai-engine\src\server.py',
        'ai-engine\requirements.txt',
        'src\scripts\_runtime\bootstrap.jsx'
    )

    $missing = @()
    foreach ($item in $required) {
        $path = Join-Path $RootDir $item
        if (-not (Test-Path -LiteralPath $path)) {
            $missing += $item
        }
    }

    if ($missing.Count -gt 0) {
        throw "The package is incomplete. Missing: $($missing -join ', '). Run npm run build before packaging, or use a complete release zip."
    }
}

function Enable-CepDebugMode {
    for ($version = 9; $version -le 16; $version++) {
        $path = "HKCU:\Software\Adobe\CSXS.$version"
        if (-not (Test-Path $path)) {
            New-Item -Path $path -Force | Out-Null
        }
        New-ItemProperty -Path $path -Name 'PlayerDebugMode' -Value '1' -PropertyType String -Force | Out-Null
    }
}

function Remove-InstalledExtension {
    if (-not (Test-Path -LiteralPath $InstallDir)) {
        return
    }

    if (-not (Test-Path -LiteralPath $BackupRoot)) {
        New-Item -ItemType Directory -Path $BackupRoot -Force | Out-Null
    }

    $stamp = Get-Date -Format 'yyyyMMdd_HHmmss'
    $backupDir = Join-Path $BackupRoot "$ExtensionId-$stamp"

    try {
        Move-Item -LiteralPath $InstallDir -Destination $backupDir -Force
    } catch {
        Remove-Item -LiteralPath $InstallDir -Recurse -Force
    }
}

function Copy-PluginFiles {
    if (-not (Test-Path -LiteralPath $UserCepRoot)) {
        New-Item -ItemType Directory -Path $UserCepRoot -Force | Out-Null
    }

    Remove-InstalledExtension
    New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null

    $exclude = @(
        '.git',
        '.claude',
        '.vscode',
        'node_modules',
        'hopeflow-docs'
    )

    $robocopyArgs = @(
        "`"$RootDir`"",
        "`"$InstallDir`"",
        '/E',
        '/NFL',
        '/NDL',
        '/NJH',
        '/NJS',
        '/NP',
        '/XD'
    )

    foreach ($item in $exclude) {
        $robocopyArgs += "`"$(Join-Path $RootDir $item)`""
    }

    $robocopyCommand = 'robocopy.exe ' + ($robocopyArgs -join ' ')
    cmd.exe /c $robocopyCommand | Out-Null
    $code = $LASTEXITCODE
    if ($code -ge 8) {
        throw "Failed to copy plugin files. Robocopy exit code: $code"
    }
}

function Install-HopeFlow {
    Write-Step 'Checking package...'
    Test-PluginPackage

    Write-Step 'Enabling CEP debug mode...'
    Enable-CepDebugMode

    Write-Step 'Copying extension files...'
    Copy-PluginFiles

    Write-Step "Installed to: $InstallDir"
}

function Uninstall-HopeFlow {
    if (Test-Path -LiteralPath $InstallDir) {
        Remove-Item -LiteralPath $InstallDir -Recurse -Force
    }
}

function Show-Gui {
    Add-Type -AssemblyName System.Windows.Forms
    Add-Type -AssemblyName System.Drawing

    [System.Windows.Forms.Application]::EnableVisualStyles()

    $form = New-Object System.Windows.Forms.Form
    $form.Text = 'HopeFlow Toolbox Installer'
    $form.StartPosition = 'CenterScreen'
    $form.Size = New-Object System.Drawing.Size(520, 360)
    $form.FormBorderStyle = 'FixedDialog'
    $form.MaximizeBox = $false

    $title = New-Object System.Windows.Forms.Label
    $title.Text = 'HopeFlow Toolbox'
    $title.Font = New-Object System.Drawing.Font('Segoe UI', 16, [System.Drawing.FontStyle]::Bold)
    $title.AutoSize = $true
    $title.Location = New-Object System.Drawing.Point(24, 22)
    $form.Controls.Add($title)

    $desc = New-Object System.Windows.Forms.Label
    $desc.Text = "Install the Illustrator CEP extension for the current Windows user.`r`nClose Illustrator before installing or uninstalling."
    $desc.Font = New-Object System.Drawing.Font('Segoe UI', 9)
    $desc.AutoSize = $true
    $desc.Location = New-Object System.Drawing.Point(27, 62)
    $form.Controls.Add($desc)

    $pathLabel = New-Object System.Windows.Forms.Label
    $pathLabel.Text = "Install path: $InstallDir"
    $pathLabel.Font = New-Object System.Drawing.Font('Segoe UI', 8)
    $pathLabel.AutoSize = $false
    $pathLabel.Size = New-Object System.Drawing.Size(455, 36)
    $pathLabel.Location = New-Object System.Drawing.Point(27, 108)
    $form.Controls.Add($pathLabel)

    $status = New-Object System.Windows.Forms.TextBox
    $status.Multiline = $true
    $status.ReadOnly = $true
    $status.ScrollBars = 'Vertical'
    $status.Size = New-Object System.Drawing.Size(455, 105)
    $status.Location = New-Object System.Drawing.Point(27, 148)
    $status.Text = 'Ready.'
    $form.Controls.Add($status)

    function Set-Status([string]$text) {
        $status.Text = $text
        $status.SelectionStart = $status.Text.Length
        $status.ScrollToCaret()
        $form.Refresh()
    }

    $installButton = New-Object System.Windows.Forms.Button
    $installButton.Text = 'Install / Update'
    $installButton.Size = New-Object System.Drawing.Size(140, 34)
    $installButton.Location = New-Object System.Drawing.Point(27, 272)
    $form.Controls.Add($installButton)

    $uninstallButton = New-Object System.Windows.Forms.Button
    $uninstallButton.Text = 'Uninstall'
    $uninstallButton.Size = New-Object System.Drawing.Size(110, 34)
    $uninstallButton.Location = New-Object System.Drawing.Point(178, 272)
    $form.Controls.Add($uninstallButton)

    $closeButton = New-Object System.Windows.Forms.Button
    $closeButton.Text = 'Close'
    $closeButton.Size = New-Object System.Drawing.Size(90, 34)
    $closeButton.Location = New-Object System.Drawing.Point(392, 272)
    $form.Controls.Add($closeButton)

    $installButton.Add_Click({
        try {
            $installButton.Enabled = $false
            $uninstallButton.Enabled = $false
            Set-Status 'Installing...'
            Install-HopeFlow
            Set-Status "Install complete.`r`nRestart Illustrator, then open Window > Extensions > HopeFlow Toolbox."
        } catch {
            Set-Status "Install failed:`r`n$($_.Exception.Message)"
            [System.Windows.Forms.MessageBox]::Show($_.Exception.Message, 'Install failed', 'OK', 'Error') | Out-Null
        } finally {
            $installButton.Enabled = $true
            $uninstallButton.Enabled = $true
        }
    })

    $uninstallButton.Add_Click({
        try {
            $installButton.Enabled = $false
            $uninstallButton.Enabled = $false
            Set-Status 'Uninstalling...'
            Uninstall-HopeFlow
            Set-Status 'Uninstall complete.'
        } catch {
            Set-Status "Uninstall failed:`r`n$($_.Exception.Message)"
            [System.Windows.Forms.MessageBox]::Show($_.Exception.Message, 'Uninstall failed', 'OK', 'Error') | Out-Null
        } finally {
            $installButton.Enabled = $true
            $uninstallButton.Enabled = $true
        }
    })

    $closeButton.Add_Click({ $form.Close() })

    [void]$form.ShowDialog()
}

try {
    if ($Gui) {
        Show-Gui
    } elseif ($Check) {
        Test-PluginPackage
        Write-Step 'Package check passed.'
    } elseif ($Uninstall) {
        Uninstall-HopeFlow
    } else {
        Install-HopeFlow
    }
} catch {
    Write-Host "[ERROR] $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
