# Smart Clinic CRM — AWS Deployment Guide

This guide walks you through deploying the Smart Clinic CRM application to AWS using SAM (Serverless Application Model).

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         CloudFront                           │
│                    (Global CDN / Cache)                      │
└────────────────────────────┬────────────────────────────────┘
                             │
                    ┌────────┴────────┐
                    │                 │
              ┌─────▼─────┐      ┌────▼──────┐
              │  S3 Bucket│      │ API Gateway
              │ (Frontend) │      │ + Lambda
              └───────────┘      └──┬───────┬┐
                                    │       ││
                        ┌───────────┴───┬───┘│
                        │               │    │
                    ┌───▼────┐  ┌──────▼──┐ │
                    │ Cognito│  │DynamoDB │◄┘
                    │ (Auth) │  │ (Data)  │
                    └────────┘  └─────────┘
```

## Prerequisites

- **AWS Account** with billing enabled
- **AWS CLI** configured with credentials
- **SAM CLI** installed (`pip install aws-sam-cli`)
- **Node.js 18+** installed
- **npm** installed
- **Git** (for version control)

## Step 1: Install Dependencies

```bash
cd clinic-crm
npm install
```

## Step 2: Configure Environment Variables

Create a `.env.local` file in the root:

```env
# AWS Configuration
AWS_REGION=us-east-1
AWS_PROFILE=default

# API Configuration
NEXT_PUBLIC_API_URL=https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/dev

# Cognito Configuration
NEXT_PUBLIC_COGNITO_DOMAIN=clinic-auth-dev
NEXT_PUBLIC_COGNITO_CLIENT_ID=YOUR_CLIENT_ID
NEXT_PUBLIC_COGNITO_REDIRECT_URI=https://your-domain.com/callback
```

## Step 3: Build Next.js Frontend

```bash
npm run build
npm run export
```

This generates static files in the `out/` directory ready for S3.

## Step 4: Deploy Backend with SAM

### Initial Deployment (Guided)

```bash
sam build
sam deploy --guided
```

Follow the prompts:
- **Stack Name**: `clinic-crm-dev`
- **Region**: `us-east-1`
- **Confirm changes before deploy**: Y
- **Allow SAM CLI to create IAM roles**: Y
- **Save parameters to file**: Y (choose `samconfig.toml`)

### Subsequent Deployments

```bash
sam build && sam deploy
```

## Step 5: Deploy Frontend to S3

After SAM deployment, get the S3 bucket name from CloudFormation outputs:

```bash
aws s3 sync out/ s3://clinic-frontend-ACCOUNT_ID-dev --delete
```

## Step 6: Create CloudFront Invalidation

Invalidate CloudFront cache to serve latest files:

```bash
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*"
```

## Step 7: Configure Cognito Hosted UI

1. Go to AWS Cognito Console
2. Select your user pool: `clinic-staff-dev`
3. Go to **App Integration > App Client Settings**
4. Set **Callback URLs** and **Logout URLs**:
   - Callback: `https://your-domain.com/callback`
   - Logout: `https://your-domain.com/logout`

## Step 8: Create Test User

```bash
aws cognito-idp admin-create-user \
  --user-pool-id YOUR_USER_POOL_ID \
  --username admin@clinic.com \
  --temporary-password TempPassword123! \
  --message-action SUPPRESS
```

Set permanent password:

```bash
aws cognito-idp admin-set-user-password \
  --user-pool-id YOUR_USER_POOL_ID \
  --username admin@clinic.com \
  --password Password123! \
  --permanent
```

## Environment-Specific Deployments

### Development
```bash
sam deploy --parameter-overrides Environment=dev
```

### Staging
```bash
sam deploy --parameter-overrides Environment=staging
```

### Production
```bash
sam deploy --parameter-overrides Environment=prod
```

## Monitoring & Logs

### CloudWatch Logs
```bash
# View API Lambda logs
sam logs -n ClinicApiFunction --stack-name clinic-crm-dev -t

# View specific function logs
sam logs -n PatientsFunction --stack-name clinic-crm-dev -t
```

### DynamoDB Metrics
- Go to AWS CloudWatch Console
- View metrics for each table
- Set up alarms for on-demand capacity warnings

## Troubleshooting

### Lambda Timeout
- Increase timeout in `template.yaml` (Globals > Function > Timeout)
- Deploy: `sam build && sam deploy`

### DynamoDB Throttling
- DynamoDB is on-demand pricing, auto-scales
- If throttling occurs, check CloudWatch metrics

### API Gateway 403 Errors
- Verify Cognito authorizer is configured
- Check API Gateway permissions in CloudFormation

### CloudFront Cache Issues
- Create invalidation: `aws cloudfront create-invalidation --distribution-id ... --paths "/*"`

## Cost Estimation (Monthly)

| Service | Estimate |
|---------|----------|
| Lambda (1M requests) | $0.20 |
| DynamoDB (on-demand) | $1.25 |
| S3 + CloudFront | $2-5 |
| Cognito | Free (up to 50K) |
| **Total** | **~$4-8/month** |

## Cleanup

To remove all AWS resources:

```bash
sam delete
aws s3 rm s3://clinic-frontend-ACCOUNT_ID-dev --recursive
aws s3api delete-bucket --bucket clinic-frontend-ACCOUNT_ID-dev
aws logs delete-log-group --log-group-name /aws/lambda/clinic-*
```

## Continuous Deployment (CI/CD)

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to AWS

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - name: Build Frontend
        run: npm install && npm run build && npm run export
      
      - uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Deploy Backend
        run: sam build && sam deploy --no-confirm-changeset
      
      - name: Deploy Frontend
        run: aws s3 sync out/ s3://clinic-frontend-${{ env.AWS_ACCOUNT_ID }}-dev --delete
```

## Support

For issues or questions:
1. Check CloudWatch logs
2. Verify IAM permissions
3. Check SAM template syntax
4. Consult AWS documentation
