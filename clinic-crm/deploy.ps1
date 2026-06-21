param(
    [string]$Environment = "dev"
)

$ErrorActionPreference = "Stop"

$awsProfile = "dm-develop-admin"
$awsRegion = "us-east-1"
$stackName = "clinic-crm-$Environment"

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "[DEPLOY] Smart Clinic CRM - AWS Deployment" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Environment: $Environment"
Write-Host "Region: $awsRegion"
Write-Host "Profile: $awsProfile"
Write-Host ""

# Step 1: Build SAM
Write-Host "[STEP 1] Building SAM template..." -ForegroundColor Yellow
sam build
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] SAM build failed" -ForegroundColor Red
    exit 1
}

# Step 2: Deploy SAM
Write-Host ""
Write-Host "[STEP 2] Deploying backend to AWS..." -ForegroundColor Yellow
sam deploy `
    --stack-name $stackName `
    --region $awsRegion `
    --profile $awsProfile `
    --parameter-overrides "Environment=$Environment" `
    --capabilities CAPABILITY_IAM

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] SAM deploy failed" -ForegroundColor Red
    exit 1
}

# Step 3: Get outputs
Write-Host ""
Write-Host "[STEP 3] Retrieving CloudFormation outputs..." -ForegroundColor Yellow

$outputs = aws cloudformation describe-stacks `
    --stack-name $stackName `
    --region $awsRegion `
    --profile $awsProfile `
    --query 'Stacks[0].Outputs' `
    --output json | ConvertFrom-Json

$apiEndpoint = ($outputs | Where-Object { $_.OutputKey -eq 'ClinicApiEndpoint' }).OutputValue
$cognitoUserPool = ($outputs | Where-Object { $_.OutputKey -eq 'CognitoUserPoolId' }).OutputValue
$cognitoClient = ($outputs | Where-Object { $_.OutputKey -eq 'CognitoClientId' }).OutputValue
$frontendBucket = ($outputs | Where-Object { $_.OutputKey -eq 'FrontendBucketName' }).OutputValue
$cloudfrontDomain = ($outputs | Where-Object { $_.OutputKey -eq 'CloudFrontDomainName' }).OutputValue
$cloudfrontDist = ($outputs | Where-Object { $_.OutputKey -eq 'ClinicApiEndpoint' }).OutputValue

Write-Host ""
Write-Host "[OUTPUT] AWS Deployment Outputs:" -ForegroundColor Cyan
Write-Host "================================"
Write-Host "API Endpoint:       $apiEndpoint"
Write-Host "Cognito User Pool:  $cognitoUserPool"
Write-Host "Cognito Client:     $cognitoClient"
Write-Host "Frontend Bucket:    $frontendBucket"
Write-Host "CloudFront Domain:  $cloudfrontDomain"
Write-Host ""

# Step 4: Save to .env.local
Write-Host "[STEP 4] Saving configuration to .env.local..." -ForegroundColor Yellow

$envContent = @"
# AWS Configuration
AWS_REGION=$awsRegion
AWS_PROFILE=$awsProfile

# API Configuration
NEXT_PUBLIC_API_URL=$apiEndpoint

# Cognito Configuration
NEXT_PUBLIC_COGNITO_USER_POOL_ID=$cognitoUserPool
NEXT_PUBLIC_COGNITO_CLIENT_ID=$cognitoClient
NEXT_PUBLIC_COGNITO_REGION=$awsRegion
NEXT_PUBLIC_COGNITO_DOMAIN=clinic-auth-$Environment
NEXT_PUBLIC_COGNITO_REDIRECT_URI=https://$cloudfrontDomain/callback

# Storage
NEXT_PUBLIC_FRONTEND_BUCKET=$frontendBucket
NEXT_PUBLIC_CLOUDFRONT_DOMAIN=$cloudfrontDomain
"@

Set-Content -Path ".env.local" -Value $envContent -Encoding UTF8
Write-Host "[OK] Configuration saved to .env.local" -ForegroundColor Green
Write-Host ""

# Step 5: Build frontend
Write-Host "[STEP 5] Building Next.js frontend..." -ForegroundColor Yellow
npm run build
npm run export

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Frontend build failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[OK] Frontend built successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "[INFO] Next steps:" -ForegroundColor Cyan
Write-Host "1. Deploy frontend to S3:"
Write-Host "   .\deploy-frontend.ps1 -Environment $Environment"
Write-Host ""
Write-Host "2. Create test user:"
Write-Host "   aws cognito-idp admin-create-user --user-pool-id $cognitoUserPool --username admin@clinic.com --temporary-password TempPassword123! --region $awsRegion --profile $awsProfile"
Write-Host ""
Write-Host "3. Set permanent password:"
Write-Host "   aws cognito-idp admin-set-user-password --user-pool-id $cognitoUserPool --username admin@clinic.com --password YourPassword123! --permanent --region $awsRegion --profile $awsProfile"
Write-Host ""
Write-Host "4. Visit: https://$cloudfrontDomain"
Write-Host ""
Write-Host "[SUCCESS] Deployment complete!" -ForegroundColor Green
