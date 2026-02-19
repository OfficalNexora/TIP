param(
    [string]$ProjectRoot = (Split-Path -Parent $PSScriptRoot)
)

$source = Join-Path $ProjectRoot "app\mobile-ui"
$targets = @(
    (Join-Path $ProjectRoot "app\android\app\src\main\assets\public"),
    (Join-Path $ProjectRoot "app\ios\App\App\public"),
    (Join-Path $ProjectRoot "apps\mobile\web")
)

if (-not (Test-Path $source)) {
    throw "Missing source folder: $source"
}

foreach ($target in $targets) {
    if (-not (Test-Path $target)) {
        New-Item -ItemType Directory -Force -Path $target | Out-Null
    }

    Copy-Item -Force (Join-Path $source "index.html") (Join-Path $target "index.html")
    Copy-Item -Force (Join-Path $source "styles.css") (Join-Path $target "styles.css")
    Copy-Item -Force (Join-Path $source "app.js") (Join-Path $target "app.js")
}

Write-Output "Mobile UI synced from $source"
