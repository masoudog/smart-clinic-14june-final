# Smart Clinic CI/CD Pipeline - Quick Reference

## Setup (One-time)

### 1. Get GitHub Token
```
https://github.com/settings/tokens/new
Scopes: repo + workflow
Copy the token (save it securely)
```

### 2. Deploy Pipeline
```powershell
cd clinic-crm/infrastructure
.\setup-pipeline.ps1 -Environment dev -GitHubToken "ghp_xxxxx"
```

### 3. Push to GitHub
```bash
git push origin main
```

That's it! Pipeline is now running.

---

## Monitor Pipeline

**AWS Console:**
- CodePipeline: https://console.aws.amazon.com/codepipeline/
- CodeBuild: https://console.aws.amazon.com/codesuite/codebuild/

**CLI:**
```bash
# Watch pipeline status
aws codepipeline get-pipeline-state --name clinic-crm-pipeline-dev

# View build logs
aws logs tail /aws/codebuild/clinic-crm-dev --follow
```

---

## Common Tasks

### Deploy Again (After Code Changes)
```bash
git push origin main
# Pipeline automatically triggers!
```

### Deploy Staging
```bash
git push origin develop
# Requires manual approval in AWS Console
```

### Deploy Production (Versioned)
```bash
git tag v1.0.0
git push origin v1.0.0
# Requires manual approval + creates CloudFormation changeset
```

### Manual Frontend Deploy Only
```bash
cd infrastructure
./deploy-frontend.sh dev
```

### Manual Backend Deploy Only
```bash
cd infrastructure
./deploy-backend.sh dev
```

### View Build Logs
```bash
aws logs tail /aws/codebuild/clinic-crm-dev --follow
```

### Check Frontend S3
```bash
aws s3 ls s3://clinic-frontend-ACCOUNT-dev/ --recursive
```

### Invalidate CloudFront Cache
```bash
aws cloudfront create-invalidation \
  --distribution-id DISTRIBUTION_ID \
  --paths "/*"
```

---

## Troubleshooting

### Pipeline Stuck on "Building"
```bash
aws logs tail /aws/codebuild/clinic-crm-dev --follow
# Check for npm errors, file not found, etc.
```

### Frontend Not Updating
```bash
# 1. Check S3 has latest files
aws s3 ls s3://clinic-frontend-ACCOUNT-dev/

# 2. Invalidate CloudFront
aws cloudfront create-invalidation \
  --distribution-id DIST_ID \
  --paths "/*"

# 3. Clear browser cache (Ctrl+Shift+Del)
```

### GitHub Webhook Not Triggering
```bash
# Check webhook in GitHub Settings
# Settings → Webhooks → clinic-crm-pipeline-dev
# Verify recent deliveries
```

### SAM Build Fails
```bash
# Check lambda files exist
ls clinic-crm/lambda/patients/
ls clinic-crm/lambda/events/
# etc.

# Test SAM locally
cd clinic-crm
npm run sam:build
```

---

## Environment Variables

Stored in CodeBuild:
- `ENVIRONMENT` - dev/staging/prod
- `AWS_ACCOUNT_ID` - AWS account number
- `AWS_REGION` - us-east-1
- `FRONTEND_BUCKET` - S3 bucket name
- `CLOUDFRONT_DISTRIBUTION_ID` - CloudFront distribution

---

## Costs

- CodePipeline: ~$1/month
- CodeBuild: ~$0.015 per build (3 min build)
  - Dev (10/day): ~$15/month
  - Staging (3/day): ~$5/month
  - Prod (1/week): ~$1/month

**Total: ~$25/month** for automated CI/CD

---

## Files Created

```
clinic-crm/
├── buildspec.yml                          # CodeBuild build steps
├── infrastructure/
│   ├── codepipeline.yaml                  # CodePipeline infrastructure
│   ├── CI_CD_SETUP.md                     # Detailed setup guide
│   ├── PIPELINE_QUICKREF.md               # This file
│   ├── setup-pipeline.ps1                 # Setup automation script
│   ├── deploy-backend.sh                  # Manual backend deploy
│   └── deploy-frontend.sh                 # Manual frontend deploy
```

---

## Next Steps

1. ✓ Pipeline deployed
2. Deploy code to test (git push)
3. Add approval gates for staging/prod
4. Add test stage (when tests are ready)
5. Add Slack notifications
6. Set up monitoring and alerts

---

## Links

- Full Guide: [CI_CD_SETUP.md](./CI_CD_SETUP.md)
- Deployment: [../DEPLOYMENT.md](../DEPLOYMENT.md)
- Project README: [../README.md](../README.md)
- AWS CodePipeline: https://docs.aws.amazon.com/codepipeline/
- AWS CodeBuild: https://docs.aws.amazon.com/codebuild/
