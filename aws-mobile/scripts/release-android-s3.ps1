[CmdletBinding(PositionalBinding = $false)]
param(
    [Parameter(Mandatory = $true)]
    [string]$BucketName,

    [ValidateSet("development", "preview", "production")]
    [string]$Profile = "preview",
    [string]$S3Prefix = "releases",
    [string]$Version = "1.0.0",
    [int]$PresignExpiresInSeconds = 604800,
    [string]$Region = "",
    [string]$CloudFrontDomain = "",
    [string]$CloudFrontPathPrefix = "",
    [string]$AliasKey = ""
)

$ErrorActionPreference = "Stop"

$awsExe = ""

function Require-Command {
    param([string]$Name)

    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "Missing required command: $Name"
    }
}

Write-Host "[1/5] Checking required tools..." -ForegroundColor Cyan
Require-Command "node"
Require-Command "npx"

if ([string]::IsNullOrWhiteSpace($BucketName)) {
    throw "BucketName is required. Example: -BucketName ims-internal-manager-system"
}

$awsCommand = Get-Command aws -ErrorAction SilentlyContinue
if ($awsCommand) {
    $awsExe = $awsCommand.Source
}
else {
    $defaultAwsPath = "C:\Program Files\Amazon\AWSCLIV2\aws.exe"
    if (Test-Path $defaultAwsPath) {
        $awsExe = $defaultAwsPath
    }
    else {
        throw "Missing required command: aws"
    }
}

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$fileName = "ims-android-$Version-$timestamp.apk"
$s3Key = "$S3Prefix/$fileName"
$localApkPath = Join-Path $env:TEMP $fileName

Write-Host "[2/5] Building Android APK with EAS profile '$Profile'..." -ForegroundColor Cyan
$buildJsonRaw = npx --yes eas-cli build --platform android --profile $Profile --wait --json --non-interactive
if ($LASTEXITCODE -ne 0) {
    throw "EAS build failed."
}

try {
    $buildData = $buildJsonRaw | ConvertFrom-Json
}
catch {
    throw "Could not parse JSON output from EAS build."
}

if ($buildData -is [System.Array]) {
    $buildData = $buildData[-1]
}

$artifactUrl = $buildData.artifacts.buildUrl
if (-not $artifactUrl) {
    $artifactUrl = $buildData.artifacts.applicationArchiveUrl
}

if (-not $artifactUrl) {
    throw "Could not find artifact URL in EAS build output."
}

Write-Host "[3/5] Downloading APK artifact..." -ForegroundColor Cyan
Invoke-WebRequest -Uri $artifactUrl -OutFile $localApkPath

Write-Host "[4/5] Uploading APK to S3 bucket '$BucketName'..." -ForegroundColor Cyan
$dest = "s3://$BucketName/$s3Key"
if ([string]::IsNullOrWhiteSpace($Region)) {
    & $awsExe s3 cp $localApkPath $dest --content-type "application/vnd.android.package-archive"
}
else {
    & $awsExe s3 cp $localApkPath $dest --region $Region --content-type "application/vnd.android.package-archive"
}
if ($LASTEXITCODE -ne 0) {
    throw "S3 upload failed."
}

$downloadObjectKey = $s3Key
$aliasDest = ""
if (-not [string]::IsNullOrWhiteSpace($AliasKey)) {
    $downloadObjectKey = $AliasKey.Trim().TrimStart('/')
    $aliasDest = "s3://$BucketName/$downloadObjectKey"

    Write-Host "      Publishing alias object '$downloadObjectKey'..." -ForegroundColor DarkCyan
    if ([string]::IsNullOrWhiteSpace($Region)) {
        & $awsExe s3 cp $localApkPath $aliasDest --content-type "application/vnd.android.package-archive"
    }
    else {
        & $awsExe s3 cp $localApkPath $aliasDest --region $Region --content-type "application/vnd.android.package-archive"
    }
    if ($LASTEXITCODE -ne 0) {
        throw "S3 alias upload failed."
    }
}

if ([string]::IsNullOrWhiteSpace($CloudFrontDomain)) {
    Write-Host "[5/5] Generating presigned download link..." -ForegroundColor Cyan
    $presignDest = "s3://$BucketName/$downloadObjectKey"
    if ([string]::IsNullOrWhiteSpace($Region)) {
        $downloadUrl = & $awsExe s3 presign $presignDest --expires-in $PresignExpiresInSeconds
    }
    else {
        $downloadUrl = & $awsExe s3 presign $presignDest --expires-in $PresignExpiresInSeconds --region $Region
    }
    if ($LASTEXITCODE -ne 0) {
        throw "Could not generate presigned URL."
    }
    $downloadUrl = $downloadUrl.Trim()
    $downloadLabel = "Download link (presigned S3)"
}
else {
    Write-Host "[5/5] Generating CloudFront download link..." -ForegroundColor Cyan

    $normalizedCloudFrontDomain = $CloudFrontDomain.Trim()
    if ($normalizedCloudFrontDomain.StartsWith("https://", [System.StringComparison]::OrdinalIgnoreCase)) {
        $normalizedCloudFrontDomain = $normalizedCloudFrontDomain.Substring(8)
    }
    elseif ($normalizedCloudFrontDomain.StartsWith("http://", [System.StringComparison]::OrdinalIgnoreCase)) {
        $normalizedCloudFrontDomain = $normalizedCloudFrontDomain.Substring(7)
    }
    $normalizedCloudFrontDomain = $normalizedCloudFrontDomain.TrimEnd('/')

    $normalizedPathPrefix = $CloudFrontPathPrefix.Trim().Trim('/')
    $objectPath = $downloadObjectKey
    if (-not [string]::IsNullOrWhiteSpace($normalizedPathPrefix)) {
        $objectPath = "$normalizedPathPrefix/$downloadObjectKey"
    }

    $downloadUrl = "https://$normalizedCloudFrontDomain/$objectPath"
    $downloadLabel = "Download link (CloudFront)"
}

Write-Host ""
Write-Host "Android release completed successfully." -ForegroundColor Green
Write-Host "S3 object: $dest"
if (-not [string]::IsNullOrWhiteSpace($aliasDest)) {
    Write-Host "S3 alias object: $aliasDest"
}
Write-Host "Local APK: $localApkPath"
Write-Host "${downloadLabel}:"
Write-Host $downloadUrl -ForegroundColor Yellow
