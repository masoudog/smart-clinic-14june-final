#!/bin/bash

# Deploy Next.js frontend to S3 + CloudFront

set -e

ENVIRONMENT=${1:-dev}
AWS_PROFILE="dm-develop-admin"
AWS_REGION="us-east-1"

echo "🎨 Deploying frontend to S3 + CloudFront"
echo "Environment: $ENVIRONMENT"
echo ""

# Get bucket name from CloudFormation
STACK_NAME="clinic-crm-$ENVIRONMENT"
FRONTEND_BUCKET=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --region "$AWS_REGION" \
  --profile "$AWS_PROFILE" \
  --query 'Stacks[0].Outputs[?OutputKey==`FrontendBucketName`].OutputValue' \
  --output text)

CLOUDFRONT_DIST=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --region "$AWS_REGION" \
  --profile "$AWS_PROFILE" \
  --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDistributionId`].OutputValue' \
  --output text)

if [ -z "$FRONTEND_BUCKET" ]; then
  echo "❌ Error: Could not find Frontend Bucket from CloudFormation"
  exit 1
fi

echo "📦 Uploading files to S3..."
echo "Bucket: $FRONTEND_BUCKET"

aws s3 sync out/ "s3://$FRONTEND_BUCKET" \
  --region "$AWS_REGION" \
  --profile "$AWS_PROFILE" \
  --delete \
  --cache-control "max-age=31536000,immutable" \
  --exclude "index.html" \
  --exclude "404.html"

# Upload HTML files with no cache
aws s3 sync out/ "s3://$FRONTEND_BUCKET" \
  --region "$AWS_REGION" \
  --profile "$AWS_PROFILE" \
  --include "index.html" \
  --include "404.html" \
  --cache-control "max-age=0,no-cache,no-store,must-revalidate"

echo "✅ Files uploaded to S3"
echo ""

# Invalidate CloudFront cache
if [ ! -z "$CLOUDFRONT_DIST" ]; then
  echo "🔄 Invalidating CloudFront cache..."
  aws cloudfront create-invalidation \
    --distribution-id "$CLOUDFRONT_DIST" \
    --paths "/*" \
    --region "$AWS_REGION" \
    --profile "$AWS_PROFILE"
  echo "✅ CloudFront cache invalidated"
else
  echo "⚠️  CloudFront Distribution ID not found. Skipping cache invalidation."
fi

echo ""
echo "🎉 Frontend deployment complete!"
