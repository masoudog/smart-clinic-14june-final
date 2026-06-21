param(
    [string]$Environment = "dev"
)

$ErrorActionPreference = "Stop"

$awsProfile = "dm-develop-admin"
$awsRegion = "us-east-1"
$stackName = "clinic-crm-$Environment"
$s3Bucket = "clinic-cf-deploy-$(([datetime]::now).Ticks)"

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "[DEPLOY] Smart Clinic CRM - Direct CloudFormation" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Environment: $Environment"
Write-Host "Region: $awsRegion"
Write-Host "Profile: $awsProfile"
Write-Host ""

# Step 1: Create S3 bucket for Lambda code
Write-Host "[STEP 1] Creating S3 bucket for Lambda deployment..." -ForegroundColor Yellow
aws s3 mb "s3://$s3Bucket" --region $awsRegion --profile $awsProfile 2>&1 | Out-Null
Write-Host "[OK] Bucket created: $s3Bucket"

# Step 2: Package Lambda functions to S3
Write-Host "[STEP 2] Packaging Lambda functions..." -ForegroundColor Yellow

$lambdaDirs = @("patients", "events", "bookings", "notifications", "settings")

foreach ($dir in $lambdaDirs) {
    $lambdaPath = "lambda\$dir"
    $zipFile = "lambda-$dir.zip"
    Write-Host "  - Packaging $dir..."

    # Create zip file
    if (Test-Path $zipFile) { Remove-Item $zipFile -Force }

    # Add all files from lambda dir to zip
    Compress-Archive -Path "$lambdaPath\*" -DestinationPath $zipFile -Force

    # Upload to S3
    aws s3 cp $zipFile "s3://$s3Bucket/$zipFile" --region $awsRegion --profile $awsProfile
    Write-Host "    [OK] Uploaded to s3://$s3Bucket/$zipFile"
}

Write-Host "[OK] Lambda functions packaged"
Write-Host ""

# Step 3: Update template with S3 references
Write-Host "[STEP 3] Preparing CloudFormation template..." -ForegroundColor Yellow

# Read template and replace S3 bucket
$template = Get-Content "template.yaml" -Raw
$template = $template -replace 'lambda/patients', "s3://$s3Bucket/lambda-patients.zip"
$template = $template -replace 'lambda/events', "s3://$s3Bucket/lambda-events.zip"
$template = $template -replace 'lambda/bookings', "s3://$s3Bucket/lambda-bookings.zip"
$template = $template -replace 'lambda/notifications', "s3://$s3Bucket/lambda-notifications.zip"
$template = $template -replace 'lambda/settings', "s3://$s3Bucket/lambda-settings.zip"

# Save modified template
Set-Content -Path "template-deploy.yaml" -Value $template -Encoding UTF8
Write-Host "[OK] Template prepared"
Write-Host ""

# Step 4: Deploy CloudFormation stack
Write-Host "[STEP 4] Deploying CloudFormation stack..." -ForegroundColor Yellow
Write-Host "Stack name: $stackName"

aws cloudformation deploy `
    --template-file template-deploy.yaml `
    --stack-name $stackName `
    --region $awsRegion `
    --profile $awsProfile `
    --parameter-overrides "Environment=$Environment" `
    --capabilities CAPABILITY_IAM `
    --no-fail-on-empty-changeset

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] CloudFormation deployment failed" -ForegroundColor Red
    exit 1
}

Write-Host "[OK] Stack deployed successfully"
Write-Host ""

# Step 5: Get outputs
Write-Host "[STEP 5] Retrieving CloudFormation outputs..." -ForegroundColor Yellow

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

Write-Host ""
Write-Host "[OUTPUT] AWS Deployment Outputs:" -ForegroundColor Cyan
Write-Host "=================================="
Write-Host "API Endpoint:       $apiEndpoint"
Write-Host "Cognito User Pool:  $cognitoUserPool"
Write-Host "Cognito Client:     $cognitoClient"
Write-Host "Frontend Bucket:    $frontendBucket"
Write-Host "CloudFront Domain:  $cloudfrontDomain"
Write-Host ""

# Step 6: Save configuration
Write-Host "[STEP 6] Saving configuration to .env.local..." -ForegroundColor Yellow

$envContent = @"
# AWS Configuration
AWS_REGION=$awsRegion
AWS_PROFILE=$awsProfile
CF_DEPLOYMENT_BUCKET=$s3Bucket

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
Write-Host "[OK] Configuration saved to .env.local"
Write-Host ""

# Step 7: Build Next.js frontend
Write-Host "[STEP 7] Building Next.js frontend..." -ForegroundColor Yellow

# Note: Requires Node.js and npm
Write-Host "[INFO] Note: Next.js build requires Node.js and npm"
Write-Host "[INFO] Skipping frontend build for now"
Write-Host ""

Write-Host "[SUCCESS] Backend deployment complete!" -ForegroundColor Green
Write-Host ""
Write-Host "[INFO] Next steps:" -ForegroundColor Cyan
Write-Host "1. Install Node.js from https://nodejs.org/"
Write-Host "2. Build and deploy frontend:"
Write-Host "   npm install"
Write-Host "   npm run build"
Write-Host "   npm run export"
Write-Host "   .\deploy-frontend.ps1 -Environment $Environment"
Write-Host ""
Write-Host "3. Create test user:"
Write-Host "   aws cognito-idp admin-create-user --user-pool-id $cognitoUserPool --username admin@clinic.com --temporary-password TempPassword123! --region $awsRegion --profile $awsProfile"
Write-Host ""
Write-Host "4. Set permanent password:"
Write-Host "   aws cognito-idp admin-set-user-password --user-pool-id $cognitoUserPool --username admin@clinic.com --password YourPassword123! --permanent --region $awsRegion --profile $awsProfile"
Write-Host ""
Write-Host "5. Visit: https://$cloudfrontDomain"
Write-Host ""
