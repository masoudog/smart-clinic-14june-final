#!/bin/bash

# Smart Clinic CRM — AWS Deployment Script
# Usage: ./deploy.sh [dev|staging|prod]

set -e

ENVIRONMENT=${1:-dev}
AWS_PROFILE="dm-develop-admin"
AWS_REGION="us-east-1"

echo "🚀 Smart Clinic CRM — Deploying to AWS"
echo "Environment: $ENVIRONMENT"
echo "Region: $AWS_REGION"
echo "Profile: $AWS_PROFILE"
echo ""

# Step 1: Build SAM
echo "📦 Step 1: Building SAM template..."
sam build --use-container

# Step 2: Deploy SAM
echo ""
echo "🚀 Step 2: Deploying backend to AWS..."
sam deploy \
  --stack-name "clinic-crm-$ENVIRONMENT" \
  --region "$AWS_REGION" \
  --profile "$AWS_PROFILE" \
  --parameter-overrides Environment=$ENVIRONMENT \
  --capabilities CAPABILITY_IAM

# Step 3: Get outputs
echo ""
echo "✅ Step 3: Retrieving CloudFormation outputs..."
STACK_NAME="clinic-crm-$ENVIRONMENT"

OUTPUTS=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --region "$AWS_REGION" \
  --profile "$AWS_PROFILE" \
  --query 'Stacks[0].Outputs' \
  --output json)

API_ENDPOINT=$(echo "$OUTPUTS" | grep -o '"ClinicApiEndpoint","Value":"[^"]*' | cut -d'"' -f4)
COGNITO_USER_POOL=$(echo "$OUTPUTS" | grep -o '"CognitoUserPoolId","Value":"[^"]*' | cut -d'"' -f4)
COGNITO_CLIENT=$(echo "$OUTPUTS" | grep -o '"CognitoClientId","Value":"[^"]*' | cut -d'"' -f4)
FRONTEND_BUCKET=$(echo "$OUTPUTS" | grep -o '"FrontendBucketName","Value":"[^"]*' | cut -d'"' -f4)
CLOUDFRONT_DOMAIN=$(echo "$OUTPUTS" | grep -o '"CloudFrontDomainName","Value":"[^"]*' | cut -d'"' -f4)

echo ""
echo "📋 AWS Deployment Outputs:"
echo "================================"
echo "API Endpoint:       $API_ENDPOINT"
echo "Cognito User Pool:  $COGNITO_USER_POOL"
echo "Cognito Client:     $COGNITO_CLIENT"
echo "Frontend Bucket:    $FRONTEND_BUCKET"
echo "CloudFront Domain:  $CLOUDFRONT_DOMAIN"
echo ""

# Step 4: Save to .env
echo "💾 Step 4: Saving configuration to .env.local..."
cat > .env.local << EOF
# AWS Configuration
AWS_REGION=$AWS_REGION
AWS_PROFILE=$AWS_PROFILE

# API Configuration
NEXT_PUBLIC_API_URL=$API_ENDPOINT

# Cognito Configuration
NEXT_PUBLIC_COGNITO_USER_POOL_ID=$COGNITO_USER_POOL
NEXT_PUBLIC_COGNITO_CLIENT_ID=$COGNITO_CLIENT
NEXT_PUBLIC_COGNITO_REGION=$AWS_REGION
NEXT_PUBLIC_COGNITO_DOMAIN=clinic-auth-$ENVIRONMENT
NEXT_PUBLIC_COGNITO_REDIRECT_URI=https://$CLOUDFRONT_DOMAIN/callback

# Storage
NEXT_PUBLIC_FRONTEND_BUCKET=$FRONTEND_BUCKET
NEXT_PUBLIC_CLOUDFRONT_DOMAIN=$CLOUDFRONT_DOMAIN
EOF

echo "✅ Configuration saved to .env.local"
echo ""

# Step 5: Build frontend
echo "🎨 Step 5: Building Next.js frontend..."
npm run build
npm run export

echo ""
echo "✅ Frontend built successfully!"
echo ""
echo "📝 Next steps:"
echo "1. Deploy frontend to S3: ./deploy-frontend.sh"
echo "2. Create test user: aws cognito-idp admin-create-user --user-pool-id $COGNITO_USER_POOL --username admin@clinic.com --temporary-password TempPassword123! --region $AWS_REGION --profile $AWS_PROFILE"
echo "3. Set permanent password: aws cognito-idp admin-set-user-password --user-pool-id $COGNITO_USER_POOL --username admin@clinic.com --password YourPassword123! --permanent --region $AWS_REGION --profile $AWS_PROFILE"
echo "4. Visit: https://$CLOUDFRONT_DOMAIN"
echo ""
echo "🎉 Deployment complete!"
