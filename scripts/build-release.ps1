param(
    [string]$Version = '1.0.4'
)

$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$releaseRoot = Join-Path $projectRoot '.release'
$stagingRoot = Join-Path $releaseRoot 'staging'
$bundleRoot = Join-Path $stagingRoot 'Sealarca-Desk'

if (Test-Path $stagingRoot) {
    $resolvedRelease = (Resolve-Path $stagingRoot).Path
    if (-not $resolvedRelease.StartsWith($projectRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
        throw 'Refusing to remove a release directory outside the project.'
    }
    Remove-Item -LiteralPath $stagingRoot -Recurse -Force
}

New-Item -ItemType Directory -Path $bundleRoot -Force | Out-Null

foreach ($directory in @('css', 'images', 'js', 'vendor')) {
    Copy-Item -LiteralPath (Join-Path $projectRoot $directory) -Destination (Join-Path $bundleRoot $directory) -Recurse -Force
}

foreach ($file in @('index.html', 'LICENSE', 'CHANGELOG.md', 'SECURITY.md', 'RELEASE_NOTES.md', 'README.md', 'README.fr.md', 'README.de.md', 'README.it.md', 'README.es.md')) {
    Copy-Item -LiteralPath (Join-Path $projectRoot $file) -Destination (Join-Path $bundleRoot $file) -Force
}

$archiveName = "Sealarca-Desk-v$Version.zip"
$archivePath = Join-Path $releaseRoot $archiveName
$checksumPath = Join-Path $releaseRoot "Sealarca-Desk-v$Version.sha256"

Compress-Archive -LiteralPath $bundleRoot -DestinationPath $archivePath -CompressionLevel Optimal -Force
$sha256 = [System.Security.Cryptography.SHA256]::Create()
try {
    $stream = [System.IO.File]::OpenRead($archivePath)
    try {
        $hashBytes = $sha256.ComputeHash($stream)
    } finally {
        $stream.Dispose()
    }
} finally {
    $sha256.Dispose()
}
$hash = ([System.BitConverter]::ToString($hashBytes) -replace '-', '').ToLowerInvariant()
Set-Content -LiteralPath $checksumPath -Value "$hash  $archiveName" -Encoding ascii

Remove-Item -LiteralPath $stagingRoot -Recurse -Force
Write-Output "Created $archivePath"
Write-Output "SHA-256: $hash"
