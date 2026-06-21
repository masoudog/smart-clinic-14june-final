param(
    [string]$Environment = "dev"
)

$ErrorActionPreference = "Stop"

$awsProfile = "dm-develop-admin"
$awsRegion = "us-east-1"
$stackName = "clinic-crm-$Environment"

Write-Host ""
Write-Host "🎨 Deploying frontend to S3 + CloudFront" -ForegroundColor Cyan
Write-Host "Environment: $Environment"
Write-Host ""

# Get bucket and distribution from CloudFormation
Write-Host "📋 Retrieving deployment configuration..." -ForegroundColor Yellow

$outputs = aws cloudformation describe-stacks `
    --stack-name $stackName `
    --region $awsRegion `
    --profile $awsProfile `
    --query 'Stacks[0].Outputs' `
    --output json | ConvertFrom-Json

$frontendBucket = ($outputs | Where-Object { $_.OutputKey -eq 'FrontendBucketName' }).OutputValue
$cloudfrontDist = ($outputs | Where-Object { $_.OutputKey -eq 'CloudFrontDistributionId' }).OutputValue

if (-not $frontendBucket) {
    Write-Host "[ERROR] Could not find Frontend Bucket from CloudFormation" -ForegroundColor Red
    exit 1
}

Write-Host "📦 Uploading files to S3..." -ForegroundColor Yellow
Write-Host "Bucket: $frontendBucket"
Write-Host ""

# Upload all files with cache headers
aws s3 sync out/ "s3://$frontendBucket" `
    --region $awsRegion `
    --profile $awsProfile `
    --delete `
    --cache-control "max-age=31536000,immutable" `
    --exclude "index.html" `
    --exclude "404.html" `
    --exclude "_next/*" | ForEach-Object { Write-Host $_ }

Write-Host ""

# Upload HTML with no cache
aws s3 sync out/ "s3://$frontendBucket" `
    --region $awsRegion `
    --profile $awsProfile `
    --include "index.html" `
    --include "404.html" `
    --cache-control "max-age=0,no-cache,no-store,must-revalidate" | ForEach-Object { Write-Host $_ }

Write-Host "[OK] Files uploaded to S3" -ForegroundColor Green
Write-Host ""

# Invalidate CloudFront cache
if ($cloudfrontDist) {
    Write-Host "[INFO] Invalidating CloudFront cache..." -ForegroundColor Yellow
    aws cloudfront create-invalidation `
        --distribution-id $cloudfrontDist `
        --paths "/*" `
        --region $awsRegion `
        --profile $awsProfile | ForEach-Object { Write-Host $_ }
    Write-Host "[OK] CloudFront cache invalidated" -ForegroundColor Green
} else {
    Write-Host "[WARN] CloudFront Distribution ID not found. Skipping cache invalidation." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[SUCCESS] Frontend deployment complete!" -ForegroundColor Green
Write-Host ""
