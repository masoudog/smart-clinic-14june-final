#!/bin/bash

# Smart Clinic Backend Deployment Script
# Deploys SAM infrastructure to AWS CloudFormation

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-dev}
AWS_REGION=${AWS_REGION:-us-east-1}
STACK_NAME="clinic-crm-${ENVIRONMENT}"
TEMPLATE_PATH="template.yaml"
PACKAGED_TEMPLATE="packaged.yaml"
ARTIFACT_BUCKET="clinic-pipeline-artifacts-$(aws sts get-caller-identity --query Account --output text)-${ENVIRONMENT}"

echo -e "${YELLOW}=== Smart Clinic Backend Deployment ===${NC}"
echo "Environment: $ENVIRONMENT"
echo "AWS Region: $AWS_REGION"
echo "Stack Name: $STACK_NAME"
echo ""

# Check if template exists
if [ ! -f "$TEMPLATE_PATH" ]; then
    echo -e "${RED}Error: template.yaml not found${NC}"
    exit 1
fi

# Build SAM template
echo -e "${YELLOW}Building SAM template...${NC}"
sam build --template "$TEMPLATE_PATH" --use-container

# Package SAM template
echo -e "${YELLOW}Packaging SAM template...${NC}"
sam package \
    --template-file .aws-sam/build/template.yaml \
    --s3-bucket "$ARTIFACT_BUCKET" \
    --output-template-file "$PACKAGED_TEMPLATE" \
    --region "$AWS_REGION"

# Deploy to CloudFormation
echo -e "${YELLOW}Deploying to CloudFormation...${NC}"
sam deploy \
    --template-file "$PACKAGED_TEMPLATE" \
    --stack-name "$STACK_NAME" \
    --parameter-overrides "Environment=$ENVIRONMENT" \
    --region "$AWS_REGION" \
    --capabilities CAPABILITY_NAMED_IAM CAPABILITY_AUTO_EXPAND \
    --no-fail-on-empty-changeset

# Get stack outputs
echo -e "${YELLOW}Retrieving stack outputs...${NC}"
aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$AWS_REGION" \
    --query 'Stacks[0].Outputs' \
    --output table

# Save outputs to .env.local
echo -e "${YELLOW}Saving outputs to .env.local...${NC}"
API_ENDPOINT=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$AWS_REGION" \
    --query 'Stacks[0].Outputs[?OutputKey==`ClinicApiEndpoint`].OutputValue' \
    --output text)

COGNITO_POOL_ID=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$AWS_REGION" \
    --query 'Stacks[0].Outputs[?OutputKey==`CognitoUserPoolId`].OutputValue' \
    --output text)

COGNITO_CLIENT_ID=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$AWS_REGION" \
    --query 'Stacks[0].Outputs[?OutputKey==`CognitoClientId`].OutputValue' \
    --output text)

cat > .env.local << EOF
AWS_REGION=$AWS_REGION
ENVIRONMENT=$ENVIRONMENT

NEXT_PUBLIC_API_ENDPOINT=$API_ENDPOINT
NEXT_PUBLIC_COGNITO_POOL_ID=$COGNITO_POOL_ID
NEXT_PUBLIC_COGNITO_CLIENT_ID=$COGNITO_CLIENT_ID
EOF

echo -e "${GREEN}✓ Backend deployment completed successfully${NC}"
echo "Stack Name: $STACK_NAME"
echo "API Endpoint: $API_ENDPOINT"
echo "Environment file saved to .env.local"
