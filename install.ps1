# dsh-skill · DeepSeek Harness Official Plugin & Skill Development Kit Windows Installer
# Usage in PowerShell:
#   irm https://raw.githubusercontent.com/realchendahuang/dsh-skill/main/install.ps1 | iex
# Pin a specific version (tag or "main"):
#   $env:DSH_SKILL_VERSION = "v0.2.1"; irm https://raw.githubusercontent.com/realchendahuang/dsh-skill/main/install.ps1 | iex

param(
    [string]$Version = $env:DSH_SKILL_VERSION
)

$ErrorActionPreference = "Stop"

$Repo = "realchendahuang/dsh-skill"

Write-Host @"

   ___  _____ __  __   ____  __ ___ __   __
  / _ \/ __/ // / /  / __/ / //_// // / / /
 / // /\ \/ _  / /__ \ \  / ,<  / // /_/ /_
/____/___/_//_/____/___/ /_/|_|/_//_/____(_)
  DeepSeek Harness Plugin & Skill Development Kit (Windows)
"@ -ForegroundColor Cyan

# Pin to the latest GitHub release tag for reproducible installs.
if (-not $Version) {
    Write-Host "Resolving latest dsh-skill release..." -ForegroundColor Yellow
    try {
        $Version = (Invoke-RestMethod -Uri "https://api.github.com/repos/$Repo/releases/latest" -UseBasicParsing).tag_name
    } catch {
        $Version = $null
    }
}
if (-not $Version -or $Version -eq "main") {
    if (-not $Version) {
        Write-Host "Warning: could not resolve the latest release; falling back to the main branch." -ForegroundColor Yellow
    }
    $ZipUrl = "https://github.com/$Repo/archive/refs/heads/main.zip"
} else {
    $ZipUrl = "https://github.com/$Repo/archive/refs/tags/$Version.zip"
}

$UserHome = $env:USERPROFILE
$Targets = @{
    "DSH"               = Join-Path $UserHome ".dsh\skills\dsh-plugin-dev"
    "Claude Code"       = Join-Path $UserHome ".claude\skills\dsh-plugin-dev"
    "Codex / Universal" = Join-Path $UserHome ".agents\skills\dsh-plugin-dev"
    "Antigravity"       = Join-Path $UserHome ".gemini\config\skills\dsh-plugin-dev"
}

$TempDir = Join-Path $env:TEMP ("dsh-skill-" + [Guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Path $TempDir -Force | Out-Null

try {
    Write-Host "Fetching dsh-skill $Version from GitHub..." -ForegroundColor Yellow
    $ZipFile = Join-Path $TempDir "dsh-skill.zip"
    Invoke-WebRequest -Uri $ZipUrl -OutFile $ZipFile -UseBasicParsing

    $ExtractDir = Join-Path $TempDir "extracted"
    Expand-Archive -Path $ZipFile -DestinationPath $ExtractDir -Force
    # Tag archives extract into a version-suffixed directory (e.g. dsh-skill-0.2.1)
    $SourceDir = (Get-ChildItem -Path $ExtractDir -Directory | Select-Object -First 1).FullName

    Write-Host "`nDeploying skills to AI Agent discovery directories:" -ForegroundColor White
    foreach ($entry in $Targets.GetEnumerator()) {
        $dest = $entry.Value
        New-Item -ItemType Directory -Path $dest -Force | Out-Null
        $items = @("SKILL.md", "references", "playbooks", "templates", "bin", "cordis.patch.yml")
        foreach ($item in $items) {
            $srcItem = Join-Path $SourceDir $item
            if (Test-Path $srcItem) {
                Copy-Item -Path $srcItem -Destination $dest -Recurse -Force
            }
        }
        Write-Host "  ✔ $($entry.Key.PadRight(18)) -> $dest" -ForegroundColor Green
    }

    # Install CLI cmd shim
    $LocalBin = Join-Path $UserHome ".local\bin"
    New-Item -ItemType Directory -Path $LocalBin -Force | Out-Null
    $ShimCmd = Join-Path $LocalBin "dsh-skill.cmd"
    $NodeScript = Join-Path $Targets["Codex / Universal"] "bin\dsh-skill.mjs"

    $CmdContent = "@echo off`r`nwhere node >nul 2>nul`r`nif %errorlevel% neq 0 (`r`n  echo Error: Node.js is required to execute dsh-skill CLI.`r`n  exit /b 1`r`n)`r`nnode `"$NodeScript`" %*`r`n"
    Set-Content -Path $ShimCmd -Value $CmdContent -Encoding ASCII
    Write-Host "  ✔ CLI (PATH)         -> $ShimCmd" -ForegroundColor Green

    Write-Host "`nInstallation succeeded!" -ForegroundColor Green
    Write-Host "You can now run:" -ForegroundColor White
    Write-Host "  dsh-skill status              # Check agent platform status" -ForegroundColor Cyan
    Write-Host "  dsh-skill init dsh-my-tools   # Scaffold a new DSH plugin" -ForegroundColor Cyan
    Write-Host "  dsh-skill check .             # Verify plugin specifications" -ForegroundColor Cyan
}
finally {
    if (Test-Path $TempDir) {
        Remove-Item -Path $TempDir -Recurse -Force -ErrorAction SilentlyContinue
    }
}
