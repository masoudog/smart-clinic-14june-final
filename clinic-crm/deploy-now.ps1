param([string]$Environment = "dev")

$ErrorActionPreference = "Stop"
$awsProfile = "dm-develop-admin"
$awsRegion = "us-east-1"
$stackName = "clinic-crm-$Environment"

Write-Host ""
Write-Host "===========================================" -ForegroundColor Green
Write-Host "SMART CLINIC CRM - AWS DEPLOYMENT" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Green
Write-Host ""

Write-Host "[1/3] Deploying DynamoDB, S3, CloudFront..." -ForegroundColor Yellow

aws cloudformation deploy `
    --template-file template-simple.yaml `
    --stack-name $stackName `
    --region $awsRegion `
    --profile $awsProfile `
    --parameter-overrides Environment=$Environment `
    --no-fail-on-empty-changeset

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Deployment failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[2/3] Retrieving AWS outputs..." -ForegroundColor Yellow

$outputs = aws cloudformation describe-stacks `
    --stack-name $stackName `
    --region $awsRegion `
    --profile $awsProfile `
    --query 'Stacks[0].Outputs' `
    --output json | ConvertFrom-Json

Write-Host ""
Write-Host "===========================================" -ForegroundColor Green
Write-Host "AWS DEPLOYMENT COMPLETE" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Green
Write-Host ""

foreach ($output in $outputs) {
    Write-Host "$($output.OutputKey):" -ForegroundColor Cyan
    Write-Host "  $($output.OutputValue)" -ForegroundColor White
    Write-Host ""
}

Write-Host "[3/3] Saving configuration..." -ForegroundColor Yellow

$frontendBucket = ($outputs | Where-Object { $_.OutputKey -eq 'FrontendBucketName' }).OutputValue
$cloudfrontDomain = ($outputs | Where-Object { $_.OutputKey -eq 'CloudFrontDomainName' }).OutputValue

$env = @"
AWS_REGION=$awsRegion
AWS_PROFILE=$awsProfile
NEXT_PUBLIC_FRONTEND_BUCKET=$frontendBucket
NEXT_PUBLIC_CLOUDFRONT_DOMAIN=$cloudfrontDomain
"@

Set-Content -Path ".env.local" -Value $env -Encoding UTF8

Write-Host ""
Write-Host "[SUCCESS] Backend is ready!" -ForegroundColor Green
Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Cyan
Write-Host "1. Install Node.js from https://nodejs.org/" -ForegroundColor White
Write-Host "2. Run: npm install && npm run build && npm run export" -ForegroundColor White
Write-Host "3. Run: aws s3 sync out/ s3://$frontendBucket --delete --profile $awsProfile" -ForegroundColor White
Write-Host "4. Visit: https://$cloudfrontDomain" -ForegroundColor White
Write-Host ""
