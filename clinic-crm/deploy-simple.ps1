param(
    [string]$Environment = "dev"
)

$ErrorActionPreference = "Stop"

$awsProfile = "dm-develop-admin"
$awsRegion = "us-east-1"
$stackName = "clinic-crm-$Environment"
$s3Bucket = "clinic-sam-$((Get-Random) % 100000)"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "[DEPLOY] Smart Clinic CRM"  -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[INFO] Creating S3 bucket..." -ForegroundColor Yellow
aws s3 mb "s3://$s3Bucket" --region $awsRegion --profile $awsProfile 2>&1 | Out-Null

Write-Host "[INFO] Packaging template..." -ForegroundColor Yellow
aws cloudformation package `
    --template-file template.yaml `
    --s3-bucket $s3Bucket `
    --output-template-file packaged.yaml `
    --region $awsRegion `
    --profile $awsProfile

Write-Host "[INFO] Deploying stack (this may take 5-10 minutes)..." -ForegroundColor Yellow
Write-Host ""

aws cloudformation deploy `
    --template-file packaged.yaml `
    --stack-name $stackName `
    --region $awsRegion `
    --profile $awsProfile `
    --parameter-overrides "Environment=$Environment" `
    --capabilities CAPABILITY_IAM

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "[ERROR] Deployment failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[OK] Stack deployed!" -ForegroundColor Green
Write-Host ""

# Get outputs
Write-Host "[INFO] Retrieving outputs..." -ForegroundColor Yellow

$outputs = aws cloudformation describe-stacks `
    --stack-name $stackName `
    --region $awsRegion `
    --profile $awsProfile `
    --query 'Stacks[0].Outputs' `
    --output json | ConvertFrom-Json

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "[SUCCESS] AWS DEPLOYMENT OUTPUTS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

foreach ($output in $outputs) {
    Write-Host "$($output.OutputKey): $($output.OutputValue)"
}

Write-Host ""
Write-Host "[INFO] Saving to .env.local..." -ForegroundColor Yellow

$apiEndpoint = ($outputs | Where-Object { $_.OutputKey -eq 'ClinicApiEndpoint' }).OutputValue
$cognitoUserPool = ($outputs | Where-Object { $_.OutputKey -eq 'CognitoUserPoolId' }).OutputValue
$cognitoClient = ($outputs | Where-Object { $_.OutputKey -eq 'CognitoClientId' }).OutputValue
$cloudfrontDomain = ($outputs | Where-Object { $_.OutputKey -eq 'CloudFrontDomainName' }).OutputValue

$envContent = @"
AWS_REGION=$awsRegion
AWS_PROFILE=$awsProfile
NEXT_PUBLIC_API_URL=$apiEndpoint
NEXT_PUBLIC_COGNITO_USER_POOL_ID=$cognitoUserPool
NEXT_PUBLIC_COGNITO_CLIENT_ID=$cognitoClient
NEXT_PUBLIC_COGNITO_REGION=$awsRegion
NEXT_PUBLIC_COGNITO_REDIRECT_URI=https://$cloudfrontDomain/callback
NEXT_PUBLIC_CLOUDFRONT_DOMAIN=$cloudfrontDomain
"@

Set-Content -Path ".env.local" -Value $envContent -Encoding UTF8

Write-Host "[OK] Saved to .env.local"
Write-Host ""
Write-Host "[NEXT] Install Node.js and run: npm install && npm run build && npm run export" -ForegroundColor Cyan
Write-Host ""
