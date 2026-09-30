param(
    [string]$Version = '1.2.0'
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

# Vérifier que vendor/ correspond à vendor/dependencies.json avant de zipper.
$dependenciesPath = Join-Path (Join-Path $projectRoot 'vendor') 'dependencies.json'
if (-not (Test-Path -LiteralPath $dependenciesPath)) { throw 'vendor/dependencies.json introuvable. Exécutez npm run vendor:build.' }
$manifest = Get-Content -LiteralPath $dependenciesPath -Raw | ConvertFrom-Json
$vendorSha256 = [System.Security.Cryptography.SHA256]::Create()
try {
    foreach ($entry in $manifest.files.PSObject.Properties) {
        $filePath = Join-Path (Join-Path $projectRoot 'vendor') $entry.Name
        if (-not (Test-Path -LiteralPath $filePath)) { throw "Fichier vendor manquant : $($entry.Name)." }
        $vendorStream = [System.IO.File]::OpenRead($filePath)
        try {
            $computed = ([System.BitConverter]::ToString($vendorSha256.ComputeHash($vendorStream)) -replace '-', '').ToLowerInvariant()
        } finally {
            $vendorStream.Dispose()
        }
        if ($computed -ne $entry.Value.ToLowerInvariant()) { throw "SHA-256 vendor incohérent pour $($entry.Name). Exécutez npm run vendor:build." }
    }
} finally {
    $vendorSha256.Dispose()
}

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
