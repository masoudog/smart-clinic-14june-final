#!/bin/bash

# Smart Clinic Frontend Deployment Script
# Deploys Next.js static export to S3 and invalidates CloudFront

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-dev}
AWS_REGION=${AWS_REGION:-us-east-1}
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
FRONTEND_BUCKET="clinic-frontend-${AWS_ACCOUNT_ID}-${ENVIRONMENT}"
OUT_DIR="out"
STACK_NAME="clinic-crm-${ENVIRONMENT}"

echo -e "${YELLOW}=== Smart Clinic Frontend Deployment ===${NC}"
echo "Environment: $ENVIRONMENT"
echo "AWS Region: $AWS_REGION"
echo "Frontend Bucket: $FRONTEND_BUCKET"
echo ""

# Check if out directory exists
if [ ! -d "$OUT_DIR" ]; then
    echo -e "${RED}Error: $OUT_DIR directory not found${NC}"
    echo "Please run 'npm run export' first"
    exit 1
fi

# Get CloudFront Distribution ID from CloudFormation stack
echo -e "${YELLOW}Retrieving CloudFront distribution ID...${NC}"
CF_DIST_ID=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$AWS_REGION" \
    --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDomainName`].OutputValue' \
    --output text 2>/dev/null || echo "")

if [ -z "$CF_DIST_ID" ]; then
    # Try to find it from the actual CloudFront distribution
    echo -e "${YELLOW}Finding CloudFront distribution...${NC}"
    CF_DIST_ID=$(aws cloudfront list-distributions \
        --region "$AWS_REGION" \
        --query "Distributions[?Origins[0].DomainName=='${FRONTEND_BUCKET}.s3.${AWS_REGION}.amazonaws.com'].Id" \
        --output text)
fi

if [ -z "$CF_DIST_ID" ]; then
    echo -e "${RED}Error: Could not find CloudFront distribution${NC}"
    exit 1
fi

echo "CloudFront Distribution ID: $CF_DIST_ID"
echo ""

# Sync to S3
echo -e "${YELLOW}Syncing frontend files to S3...${NC}"
aws s3 sync "$OUT_DIR" "s3://${FRONTEND_BUCKET}" \
    --region "$AWS_REGION" \
    --delete \
    --cache-control "max-age=31536000,immutable" \
    --exclude "*.html" \
    --exclude "*.json"

# Sync HTML and JSON with shorter cache
echo -e "${YELLOW}Syncing dynamic files with short cache...${NC}"
aws s3 sync "$OUT_DIR" "s3://${FRONTEND_BUCKET}" \
    --region "$AWS_REGION" \
    --cache-control "max-age=0,must-revalidate" \
    --include "*.html" \
    --include "*.json"

# Invalidate CloudFront cache
echo -e "${YELLOW}Invalidating CloudFront cache...${NC}"
INVALIDATION_ID=$(aws cloudfront create-invalidation \
    --distribution-id "$CF_DIST_ID" \
    --paths "/*" \
    --region "$AWS_REGION" \
    --query 'Invalidation.Id' \
    --output text)

echo "Invalidation ID: $INVALIDATION_ID"
echo ""

# Wait for invalidation to complete (optional)
echo -e "${YELLOW}Waiting for CloudFront invalidation to complete...${NC}"
aws cloudfront wait invalidation-completed \
    --distribution-id "$CF_DIST_ID" \
    --id "$INVALIDATION_ID" \
    --region "$AWS_REGION" 2>/dev/null || echo "Note: Invalidation may still be in progress"

echo -e "${GREEN}✓ Frontend deployment completed successfully${NC}"
echo "Bucket: $FRONTEND_BUCKET"
echo "CloudFront Distribution: $CF_DIST_ID"
echo ""
echo "Your app should be live in a few moments at:"
echo "https://$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region "$AWS_REGION" \
    --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDomainName`].OutputValue' \
    --output text)"
