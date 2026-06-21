@echo off
REM Smart Clinic CRM — AWS Deployment Script (Windows)
REM Usage: deploy.bat [dev|staging|prod]

setlocal enabledelayedexpansion

set ENVIRONMENT=%1
if "%ENVIRONMENT%"=="" set ENVIRONMENT=dev

set AWS_PROFILE=dm-develop-admin
set AWS_REGION=us-east-1
set STACK_NAME=clinic-crm-%ENVIRONMENT%

echo.
echo ======================================
echo 🚀 Smart Clinic CRM - AWS Deployment
echo ======================================
echo Environment: %ENVIRONMENT%
echo Region: %AWS_REGION%
echo Profile: %AWS_PROFILE%
echo.

REM Step 1: Build SAM
echo 📦 Step 1: Building SAM template...
call sam build --use-container
if %errorlevel% neq 0 (
  echo ❌ SAM build failed
  exit /b 1
)

REM Step 2: Deploy SAM
echo.
echo 🚀 Step 2: Deploying backend to AWS...
call sam deploy ^
  --stack-name %STACK_NAME% ^
  --region %AWS_REGION% ^
  --profile %AWS_PROFILE% ^
  --parameter-overrides Environment=%ENVIRONMENT% ^
  --capabilities CAPABILITY_IAM

if %errorlevel% neq 0 (
  echo ❌ SAM deploy failed
  exit /b 1
)

REM Step 3: Get outputs
echo.
echo ✅ Step 3: Retrieving CloudFormation outputs...

for /f "delims=" %%i in ('aws cloudformation describe-stacks --stack-name %STACK_NAME% --region %AWS_REGION% --profile %AWS_PROFILE% --query "Stacks[0].Outputs[?OutputKey=='ClinicApiEndpoint'].OutputValue" --output text') do set API_ENDPOINT=%%i

for /f "delims=" %%i in ('aws cloudformation describe-stacks --stack-name %STACK_NAME% --region %AWS_REGION% --profile %AWS_PROFILE% --query "Stacks[0].Outputs[?OutputKey=='CognitoUserPoolId'].OutputValue" --output text') do set COGNITO_USER_POOL=%%i

for /f "delims=" %%i in ('aws cloudformation describe-stacks --stack-name %STACK_NAME% --region %AWS_REGION% --profile %AWS_PROFILE% --query "Stacks[0].Outputs[?OutputKey=='CognitoClientId'].OutputValue" --output text') do set COGNITO_CLIENT=%%i

for /f "delims=" %%i in ('aws cloudformation describe-stacks --stack-name %STACK_NAME% --region %AWS_REGION% --profile %AWS_PROFILE% --query "Stacks[0].Outputs[?OutputKey=='FrontendBucketName'].OutputValue" --output text') do set FRONTEND_BUCKET=%%i

for /f "delims=" %%i in ('aws cloudformation describe-stacks --stack-name %STACK_NAME% --region %AWS_REGION% --profile %AWS_PROFILE% --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDomainName'].OutputValue" --output text') do set CLOUDFRONT_DOMAIN=%%i

echo.
echo 📋 AWS Deployment Outputs:
echo ================================
echo API Endpoint:       %API_ENDPOINT%
echo Cognito User Pool:  %COGNITO_USER_POOL%
echo Cognito Client:     %COGNITO_CLIENT%
echo Frontend Bucket:    %FRONTEND_BUCKET%
echo CloudFront Domain:  %CLOUDFRONT_DOMAIN%
echo.

REM Step 4: Save to .env.local
echo 💾 Step 4: Saving configuration to .env.local...
(
  echo # AWS Configuration
  echo AWS_REGION=%AWS_REGION%
  echo AWS_PROFILE=%AWS_PROFILE%
  echo.
  echo # API Configuration
  echo NEXT_PUBLIC_API_URL=%API_ENDPOINT%
  echo.
  echo # Cognito Configuration
  echo NEXT_PUBLIC_COGNITO_USER_POOL_ID=%COGNITO_USER_POOL%
  echo NEXT_PUBLIC_COGNITO_CLIENT_ID=%COGNITO_CLIENT%
  echo NEXT_PUBLIC_COGNITO_REGION=%AWS_REGION%
  echo NEXT_PUBLIC_COGNITO_DOMAIN=clinic-auth-%ENVIRONMENT%
  echo NEXT_PUBLIC_COGNITO_REDIRECT_URI=https://%CLOUDFRONT_DOMAIN%/callback
  echo.
  echo # Storage
  echo NEXT_PUBLIC_FRONTEND_BUCKET=%FRONTEND_BUCKET%
  echo NEXT_PUBLIC_CLOUDFRONT_DOMAIN=%CLOUDFRONT_DOMAIN%
) > .env.local

echo ✅ Configuration saved to .env.local
echo.

REM Step 5: Build frontend
echo 🎨 Step 5: Building Next.js frontend...
call npm run build
call npm run export

if %errorlevel% neq 0 (
  echo ❌ Frontend build failed
  exit /b 1
)

echo.
echo ✅ Frontend built successfully!
echo.
echo 📝 Next steps:
echo 1. Deploy frontend to S3: deploy-frontend.bat
echo 2. Create test user:
echo    aws cognito-idp admin-create-user --user-pool-id %COGNITO_USER_POOL% --username admin@clinic.com --temporary-password TempPassword123! --region %AWS_REGION% --profile %AWS_PROFILE%
echo.
echo 3. Set permanent password:
echo    aws cognito-idp admin-set-user-password --user-pool-id %COGNITO_USER_POOL% --username admin@clinic.com --password YourPassword123! --permanent --region %AWS_REGION% --profile %AWS_PROFILE%
echo.
echo 4. Visit: https://%CLOUDFRONT_DOMAIN%
echo.
echo 🎉 Deployment complete!
echo.

pause
