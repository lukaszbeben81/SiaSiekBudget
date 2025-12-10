<#
Upload release assets to GitHub Release by tag.

Usage:
  - Ensure environment variable `GITHUB_TOKEN` is set (recommended):
      $env:GITHUB_TOKEN = 'ghp_...'

  - From repo root run (PowerShell):
      .\scripts\upload-release-assets.ps1

  - Or pass token explicitly (less secure):
      .\scripts\upload-release-assets.ps1 -Token 'ghp_...'

This script will:
  - Read `release/latest.yml` to determine the main installer filename (`path`).
  - Upload the installer, its `.blockmap`, and `latest.yml` to the GitHub Release with tag `v1.2.3`.
  - If an asset with the same name already exists in the release, it will be deleted first.

Notes:
  - Requires a GitHub token with `repo` scope. Do NOT paste tokens into public places.
  - Defaults assume repository `lukaszbeben81/SiaSiekBudget` and tag `v1.2.3`.
#>

param(
    [string]$Owner = 'lukaszbeben81',
    [string]$Repo  = 'SiaSiekBudget',
    [string]$Tag   = 'v1.2.3',
    [string]$Token = $env:GITHUB_TOKEN,
    [string]$ReleaseDir = "release"
)

function Abort([string]$msg){ Write-Error $msg; exit 1 }

if (-not $Token) { Abort 'GITHUB_TOKEN not provided. Set $env:GITHUB_TOKEN or use -Token parameter.' }

$latestPath = Join-Path $ReleaseDir 'latest.yml'
if (-not (Test-Path $latestPath)) { Abort "Cannot find $latestPath" }

# Extract the `path:` value from latest.yml
$pathLine = Select-String -Path $latestPath -Pattern '^path:\s*(.+)$' -SimpleMatch
if (-not $pathLine) { Abort "Could not parse 'path' in $latestPath" }

$exeName = $pathLine.Matches[0].Groups[1].Value.Trim()
$exeFile = Join-Path $ReleaseDir $exeName
$blockmapFile = "$exeFile.blockmap"

Write-Host "Installer file determined: $exeFile"

if (-not (Test-Path $exeFile)) { Abort "Installer file not found: $exeFile" }
if (-not (Test-Path $blockmapFile)) { Write-Warning "Blockmap not found: $blockmapFile (continuing, but blockmap won't be uploaded)" }

# Get release by tag
$headers = @{ Authorization = "token $Token"; 'User-Agent' = 'upload-release-assets-script' }
try {
    $release = Invoke-RestMethod -Uri "https://api.github.com/repos/$Owner/$Repo/releases/tags/$Tag" -Headers $headers -ErrorAction Stop
} catch {
    Abort "Failed to fetch release for tag $Tag: $_" 
}

$uploadUrlTemplate = $release.upload_url
if (-not $uploadUrlTemplate) { Abort 'Release upload_url not found in response.' }

function Ensure-DeletedExistingAsset([string]$assetName){
    $existing = $release.assets | Where-Object { $_.name -eq $assetName }
    if ($existing) {
        foreach ($a in $existing) {
            Write-Host "Deleting existing asset: $($a.name) (id $($a.id))"
            $delUrl = "https://api.github.com/repos/$Owner/$Repo/releases/assets/$($a.id)"
            Invoke-RestMethod -Method Delete -Uri $delUrl -Headers $headers -ErrorAction Stop
        }
    }
}

function Upload-Asset([string]$filePath){
    if (-not (Test-Path $filePath)) { Write-Warning "File not found, skipping: $filePath"; return }
    $fileName = [IO.Path]::GetFileName($filePath)
    Ensure-DeletedExistingAsset $fileName
    $escaped = [System.Uri]::EscapeDataString($fileName)
    $uploadUrl = $uploadUrlTemplate -replace '\{\?name,label\}', "?name=$escaped"
    Write-Host "Uploading $fileName to $uploadUrl"
    try {
        $resp = Invoke-WebRequest -Uri $uploadUrl -Headers $headers -Method Post -InFile $filePath -ContentType 'application/octet-stream' -UseBasicParsing -ErrorAction Stop
        Write-Host "Uploaded: $fileName"
    } catch {
        Write-Error "Upload failed for $fileName: $_"
    }
}

# Upload files: installer, blockmap (if exists), latest.yml
Upload-Asset $exeFile
if (Test-Path $blockmapFile) { Upload-Asset $blockmapFile }
Upload-Asset $latestPath

# Verify latest.yml is downloadable
$downloadUrl = "https://github.com/$Owner/$Repo/releases/download/$Tag/latest.yml"
Write-Host "Verifying download URL: $downloadUrl"
try {
    $resp = Invoke-WebRequest -Uri $downloadUrl -Method Head -ErrorAction Stop -UseBasicParsing
    Write-Host "Download URL OK (status $($resp.StatusCode))"
} catch {
    Write-Warning "Could not verify download URL. The release may not be updated yet or GitHub might not have finished processing assets: $_"
}

Write-Host "Done. If there were no errors, assets should be visible on GitHub Release for tag $Tag."
