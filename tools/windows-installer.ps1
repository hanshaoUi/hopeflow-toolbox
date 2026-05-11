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
$MinIllustratorVersion = [version]'23.0'
$MaxIllustratorVersion = [version]'99.9'

function Write-Step {
    param([string]$Message)
    Write-Host "[HopeFlow] $Message"
}

function Convert-ToVersion {
    param([string]$Value)

    if ([string]::IsNullOrWhiteSpace($Value)) {
        return $null
    }

    $match = [regex]::Match($Value, '\d+(\.\d+){0,3}')
    if (-not $match.Success) {
        return $null
    }

    try {
        return [version]$match.Value
    } catch {
        return $null
    }
}

function Get-IllustratorInstallations {
    $items = New-Object System.Collections.Generic.List[object]
    $seen = @{}

    function Add-IllustratorCandidate {
        param([string]$Path)

        if ([string]::IsNullOrWhiteSpace($Path)) {
            return
        }

        $resolved = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($Path)
        if (-not (Test-Path -LiteralPath $resolved -PathType Leaf)) {
            return
        }

        $key = $resolved.ToLowerInvariant()
        if ($seen.ContainsKey($key)) {
            return
        }
        $seen[$key] = $true

        $file = Get-Item -LiteralPath $resolved
        $version = Convert-ToVersion $file.VersionInfo.ProductVersion
        if ($null -eq $version) {
            $version = Convert-ToVersion $file.VersionInfo.FileVersion
        }

        $items.Add([pscustomobject]@{
            Name = $file.VersionInfo.ProductName
            Version = $version
            ProductVersion = $file.VersionInfo.ProductVersion
            Path = $resolved
            Compatible = ($null -ne $version -and $version -ge $MinIllustratorVersion -and $version -le $MaxIllustratorVersion)
        }) | Out-Null
    }

    $programRoots = @(
        ${env:ProgramFiles},
        ${env:ProgramFiles(x86)}
    ) | Where-Object { -not [string]::IsNullOrWhiteSpace($_) }

    foreach ($root in $programRoots) {
        $adobeRoot = Join-Path $root 'Adobe'
        if (Test-Path -LiteralPath $adobeRoot) {
            Get-ChildItem -LiteralPath $adobeRoot -Directory -Filter 'Adobe Illustrator*' -ErrorAction SilentlyContinue | ForEach-Object {
                Add-IllustratorCandidate (Join-Path $_.FullName 'Support Files\Contents\Windows\Illustrator.exe')
            }
        }
    }

    $appPathKeys = @(
        'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\Illustrator.exe',
        'HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\App Paths\Illustrator.exe',
        'HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\Illustrator.exe'
    )

    foreach ($key in $appPathKeys) {
        if (Test-Path $key) {
            try {
                $defaultPath = (Get-ItemProperty -Path $key).'(default)'
                Add-IllustratorCandidate $defaultPath
            } catch {
            }
        }
    }

    $uninstallRoots = @(
        'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall',
        'HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall',
        'HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall'
    )

    foreach ($root in $uninstallRoots) {
        if (-not (Test-Path $root)) {
            continue
        }

        Get-ChildItem -Path $root -ErrorAction SilentlyContinue | ForEach-Object {
            try {
                $entry = Get-ItemProperty -Path $_.PSPath
                if ($entry.DisplayName -like 'Adobe Illustrator*' -and $entry.InstallLocation) {
                    Add-IllustratorCandidate (Join-Path $entry.InstallLocation 'Support Files\Contents\Windows\Illustrator.exe')
                    Add-IllustratorCandidate (Join-Path $entry.InstallLocation 'Illustrator.exe')
                }
            } catch {
            }
        }
    }

    return @($items | Sort-Object -Property @{ Expression = { if ($_.Version) { $_.Version } else { [version]'0.0' } }; Descending = $true }, Path)
}

function Get-IllustratorSummary {
    $installations = @(Get-IllustratorInstallations)
    if ($installations.Count -eq 0) {
        return 'Illustrator：未检测到。支持版本：23.0 或更高版本。'
    }

    $lines = @('已检测到 Illustrator：')
    foreach ($item in $installations) {
        $versionText = if ($item.Version) { $item.Version.ToString() } elseif ($item.ProductVersion) { $item.ProductVersion } else { '未知版本' }
        $state = if ($item.Compatible) { '兼容' } else { '不兼容' }
        $lines += "- $versionText ($state)"
    }
    return ($lines -join "`r`n")
}

function Test-CompatibleIllustrator {
    $installations = @(Get-IllustratorInstallations)
    return ($installations | Where-Object { $_.Compatible } | Select-Object -First 1) -ne $null
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

    Write-Step 'Checking Illustrator...'
    if (-not (Test-CompatibleIllustrator)) {
        throw '未检测到兼容的 Adobe Illustrator。HopeFlow Toolbox 需要 Illustrator 23.0 或更高版本。'
    }

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
    $form.Text = 'HopeFlow Toolbox 安装器'
    $form.StartPosition = 'CenterScreen'
    $form.Size = New-Object System.Drawing.Size(560, 430)
    $form.FormBorderStyle = 'FixedDialog'
    $form.MaximizeBox = $false
    $form.Font = New-Object System.Drawing.Font('Microsoft YaHei UI', 9)

    $title = New-Object System.Windows.Forms.Label
    $title.Text = 'HopeFlow Toolbox'
    $title.Font = New-Object System.Drawing.Font('Segoe UI', 16, [System.Drawing.FontStyle]::Bold)
    $title.AutoSize = $true
    $title.Location = New-Object System.Drawing.Point(24, 22)
    $form.Controls.Add($title)

    $desc = New-Object System.Windows.Forms.Label
    $desc.Text = "为当前 Windows 用户安装 Illustrator CEP 扩展。`r`n安装前会自动检测 Illustrator 版本，请先关闭 Illustrator。"
    $desc.Font = New-Object System.Drawing.Font('Segoe UI', 9)
    $desc.AutoSize = $true
    $desc.Location = New-Object System.Drawing.Point(27, 62)
    $form.Controls.Add($desc)

    $pathLabel = New-Object System.Windows.Forms.Label
    $pathLabel.Text = "安装位置：$InstallDir"
    $pathLabel.Font = New-Object System.Drawing.Font('Segoe UI', 8)
    $pathLabel.AutoSize = $false
    $pathLabel.Size = New-Object System.Drawing.Size(500, 36)
    $pathLabel.Location = New-Object System.Drawing.Point(27, 108)
    $form.Controls.Add($pathLabel)

    $hostLabel = New-Object System.Windows.Forms.Label
    $hostLabel.Text = Get-IllustratorSummary
    $hostLabel.Font = New-Object System.Drawing.Font('Segoe UI', 8)
    $hostLabel.AutoSize = $false
    $hostLabel.Size = New-Object System.Drawing.Size(500, 58)
    $hostLabel.Location = New-Object System.Drawing.Point(27, 145)
    $form.Controls.Add($hostLabel)

    $status = New-Object System.Windows.Forms.TextBox
    $status.Multiline = $true
    $status.ReadOnly = $true
    $status.ScrollBars = 'Vertical'
    $status.Size = New-Object System.Drawing.Size(500, 105)
    $status.Location = New-Object System.Drawing.Point(27, 212)
    $status.Text = '准备就绪。'
    $form.Controls.Add($status)

    function Set-Status([string]$text) {
        $status.Text = $text
        $status.SelectionStart = $status.Text.Length
        $status.ScrollToCaret()
        $form.Refresh()
    }

    $installButton = New-Object System.Windows.Forms.Button
    $installButton.Text = '安装 / 更新'
    $installButton.Size = New-Object System.Drawing.Size(140, 34)
    $installButton.Location = New-Object System.Drawing.Point(27, 338)
    $form.Controls.Add($installButton)

    $uninstallButton = New-Object System.Windows.Forms.Button
    $uninstallButton.Text = '卸载'
    $uninstallButton.Size = New-Object System.Drawing.Size(110, 34)
    $uninstallButton.Location = New-Object System.Drawing.Point(178, 338)
    $form.Controls.Add($uninstallButton)

    $refreshButton = New-Object System.Windows.Forms.Button
    $refreshButton.Text = '重新检测'
    $refreshButton.Size = New-Object System.Drawing.Size(90, 34)
    $refreshButton.Location = New-Object System.Drawing.Point(299, 338)
    $form.Controls.Add($refreshButton)

    $closeButton = New-Object System.Windows.Forms.Button
    $closeButton.Text = '关闭'
    $closeButton.Size = New-Object System.Drawing.Size(90, 34)
    $closeButton.Location = New-Object System.Drawing.Point(437, 338)
    $form.Controls.Add($closeButton)

    $installButton.Add_Click({
        try {
            $installButton.Enabled = $false
            $uninstallButton.Enabled = $false
            Set-Status '正在安装...'
            Install-HopeFlow
            Set-Status "安装完成。`r`n请重启 Illustrator，然后打开：窗口 > 扩展 > HopeFlow Toolbox。"
        } catch {
            Set-Status "安装失败：`r`n$($_.Exception.Message)"
            [System.Windows.Forms.MessageBox]::Show($_.Exception.Message, '安装失败', 'OK', 'Error') | Out-Null
        } finally {
            $installButton.Enabled = $true
            $uninstallButton.Enabled = $true
        }
    })

    $uninstallButton.Add_Click({
        try {
            $installButton.Enabled = $false
            $uninstallButton.Enabled = $false
            Set-Status '正在卸载...'
            Uninstall-HopeFlow
            Set-Status '卸载完成。'
        } catch {
            Set-Status "卸载失败：`r`n$($_.Exception.Message)"
            [System.Windows.Forms.MessageBox]::Show($_.Exception.Message, '卸载失败', 'OK', 'Error') | Out-Null
        } finally {
            $installButton.Enabled = $true
            $uninstallButton.Enabled = $true
        }
    })

    $refreshButton.Add_Click({
        $hostLabel.Text = Get-IllustratorSummary
        Set-Status '检测结果已刷新。'
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
