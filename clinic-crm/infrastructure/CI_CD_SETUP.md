# Smart Clinic CI/CD Setup Guide

This guide walks you through setting up AWS CodePipeline for automated deployment of the Smart Clinic CRM.

## Architecture Overview

The CI/CD pipeline uses:
- **GitHub** - Source code repository with webhook triggers
- **AWS CodePipeline** - Orchestrates the deployment workflow
- **AWS CodeBuild** - Builds frontend (Next.js) and backend (SAM)
- **AWS CloudFormation** - Deploys infrastructure (DynamoDB, Lambda, Cognito, etc.)
- **AWS S3 + CloudFront** - Hosts frontend static site
- **AWS Secrets Manager** - Stores GitHub token and CloudFront distribution ID

### Pipeline Stages

```
Source (GitHub) 
    ↓
Build (CodeBuild: npm build, npm export, sam build)
    ↓
Deploy Backend (CloudFormation SAM stack)
    ↓
Deploy Frontend (S3 sync + CloudFront invalidation)
```

## Prerequisites

Before setting up the pipeline, you need:

1. **AWS Account** with permissions to create:
   - CodePipeline, CodeBuild, CloudFormation
   - S3, CloudFront, DynamoDB, Lambda, Cognito
   - IAM roles and policies

2. **AWS CLI** installed and configured
   ```bash
   aws --version
   aws sts get-caller-identity  # Verify credentials
   ```

3. **GitHub Personal Access Token**
   - Generate at: https://github.com/settings/tokens/new
   - Required scopes: `repo` (full repo) + `workflow`
   - Keep this token secure!

4. **Smart Clinic infrastructure already deployed**
   - CloudFormation stack `clinic-crm-{Environment}` must exist
   - S3 bucket and CloudFront distribution must be running
   - See main [DEPLOYMENT.md](../DEPLOYMENT.md) for initial setup

## Quick Start (5 minutes)

### Step 1: Create GitHub Personal Access Token

1. Go to https://github.com/settings/tokens/new
2. Name: `clinic-codepipeline`
3. Select scopes:
   - ✓ `repo` (Full control of private repositories)
   - ✓ `workflow` (Update GitHub Action/workflow files)
4. Click "Generate token"
5. **Copy the token** (you won't see it again)

### Step 2: Deploy Pipeline

Run the setup script:

```powershell
cd clinic-crm/infrastructure

# For dev environment (auto-deploys on push)
.\setup-pipeline.ps1 -Environment dev -GitHubToken "ghp_your_token_here"

# For staging (manual approval gate before deploy)
.\setup-pipeline.ps1 -Environment staging -GitHubToken "ghp_your_token_here" -GitHubBranch develop

# For prod (tag-based manual deploys)
.\setup-pipeline.ps1 -Environment prod -GitHubToken "ghp_your_token_here" -GitHubBranch main
```

The script will:
- ✓ Validate AWS credentials
- ✓ Retrieve CloudFront distribution ID
- ✓ Deploy CodePipeline CloudFormation stack
- ✓ Set up GitHub webhook
- ✓ Print monitoring links

### Step 3: Trigger First Deploy

Push a commit to trigger the pipeline:

```bash
git add .
git commit -m "Enable CI/CD"
git push origin main
```

Monitor the pipeline:
```
AWS Console: CodePipeline → clinic-crm-pipeline-dev
```

## Manual Deployment (If Needed)

If you prefer to deploy infrastructure manually:

### Deploy Backend

```bash
cd clinic-crm/infrastructure
./deploy-backend.sh dev
```

This script:
- Builds SAM template
- Packages with CloudFormation
- Deploys infrastructure
- Saves outputs to `.env.local`

### Deploy Frontend

```bash
cd clinic-crm/infrastructure
./deploy-frontend.sh dev
```

This script:
- Syncs `out/` directory to S3
- Sets cache headers (immutable for JS/CSS, revalidate for HTML)
- Invalidates CloudFront cache
- Waits for invalidation to complete

## Multi-Environment Setup

### Development (Auto-deploy)

**Branch:** `main`  
**Trigger:** Every commit to main  
**Approval:** None (automatic)  
**Use case:** Rapid iteration, bleeding edge

```powershell
.\setup-pipeline.ps1 -Environment dev -GitHubBranch main
```

### Staging (Manual approval)

**Branch:** `develop` (or create it)  
**Trigger:** Manual or merge to branch  
**Approval:** Required before deployment  
**Use case:** Testing before production

```powershell
.\setup-pipeline.ps1 -Environment staging -GitHubBranch develop
```

### Production (Tag-based)

**Trigger:** Git tag (e.g., `v1.0.0`)  
**Approval:** Required  
**Use case:** Controlled, versioned releases

```powershell
.\setup-pipeline.ps1 -Environment prod -GitHubBranch main
```

Then deploy by tagging:
```bash
git tag v1.0.0
git push origin v1.0.0
```

## Monitoring

### CodePipeline Console

View pipeline status, logs, and history:
```
https://console.aws.amazon.com/codepipeline/home
```

Click on `clinic-crm-pipeline-{environment}` to see stages and actions.

### CodeBuild Logs

Real-time build output and errors:
```
https://console.aws.amazon.com/codesuite/codebuild/projects
```

Or via CLI:
```bash
aws codebuild batch-get-builds \
  --ids $(aws codepipeline get-pipeline-state \
    --name clinic-crm-pipeline-dev \
    --query 'stageStates[?stageName==`Build`].latestExecution.artifactRevisions[0].revisionId' \
    --output text)
```

### CloudFormation Stack Events

Monitor infrastructure deployment:
```bash
aws cloudformation describe-stack-events \
  --stack-name clinic-crm-dev \
  --query 'StackEvents[0:10]' \
  --output table
```

## Troubleshooting

### Pipeline Stuck on "Building"

Check CodeBuild logs:
```bash
aws logs tail /aws/codebuild/clinic-crm-dev --follow
```

Common issues:
- **`npm install` timeout**: Increase CodeBuild `TIMEOUT` in codepipeline.yaml
- **`sam build` fails**: Check lambda files exist in `lambda/` directory
- **Out of disk space**: Use larger CodeBuild instance (`BUILD_GENERAL1_MEDIUM`)

### Frontend Not Updating

1. Check S3 sync in CodeBuild logs
2. Verify CloudFront distribution is invalidated
3. Clear browser cache: `Ctrl+Shift+Del` or use Dev Tools

### GitHub Webhook Not Triggering

1. Check webhook in GitHub:
   ```
   Settings → Webhooks → clinic-crm-pipeline-{env}
   ```
2. Verify branch name matches configuration
3. Check GitHub token is still valid (tokens can expire)

### CloudFormation Stack Rollback

If deployment fails:
1. Check CloudFormation events for error
2. Fix code and commit
3. Pipeline will retry on next push

## Security Best Practices

### GitHub Token Storage

✓ **Do:** Store token in AWS Secrets Manager  
✓ **Do:** Rotate token regularly  
✓ **Do:** Use minimal required scopes  
✗ **Don't:** Commit token to GitHub  
✗ **Don't:** Share token in chat/email  

### IAM Permissions

The pipeline uses minimal IAM roles:
- CodeBuild role: Can build and deploy infrastructure
- CloudFormation role: Can create/update AWS resources
- CodePipeline role: Can orchestrate deployment

Review in [codepipeline.yaml](./codepipeline.yaml) for details.

### Environment Isolation

Each environment (`dev`, `staging`, `prod`) has:
- Separate DynamoDB tables
- Separate Lambda functions
- Separate S3 bucket and CloudFront distribution
- Separate Cognito user pool

Prevents production data leaks.

## Cost Estimation

**Pipeline Components:**
- CodePipeline: ~$1/month (1 active pipeline)
- CodeBuild: ~$0.005/min (typical build: 3 min = $0.015 per build)
  - Dev: ~$15/month (10 builds/day)
  - Staging: ~$5/month (3 builds/day)
  - Prod: ~$1/month (1 build/week)
- S3 (artifacts): ~$0.50/month
- CloudFormation: Free

**Total estimated: $25-30/month** (dev + staging + prod)

Compared to:
- Manual deployment: Your time ⏱️
- No CI/CD safety: Risk of human error 🔥

## Advanced Configuration

### Add Approval Gate

To require manual approval before deploying:

```yaml
# In codepipeline.yaml, after DeployBackend stage:
- Name: ApprovalStage
  Actions:
    - Name: ManualApproval
      ActionTypeId:
        Category: Approval
        Owner: AWS
        Provider: Manual
        Version: '1'
      Configuration:
        CustomData: 'Approve deployment to production?'
        NotificationArn: !GetAtt ApprovalTopic.TopicArn  # Optional SNS topic
```

### Add Test Stage

To run tests before deployment:

```yaml
- Name: Test
  Actions:
    - Name: RunTests
      ActionTypeId:
        Category: Build
        Owner: AWS
        Provider: CodeBuild
        Version: '1'
      Configuration:
        ProjectName: !Ref TestProject  # Separate CodeBuild project
      InputArtifacts:
        - Name: SourceOutput
```

Create corresponding CodeBuild project with test script in `buildspec-test.yml`.

### Add Slack Notifications

Integrate SNS + Lambda to send pipeline status to Slack:

```powershell
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:123456789:clinic-pipeline-notifications \
  --protocol https \
  --notification-endpoint https://hooks.slack.com/services/YOUR/WEBHOOK
```

## Next Steps

1. ✓ Set up pipeline (you are here)
2. Deploy to dev and test manually
3. Create `develop` branch for staging deployments
4. Set up production approval gates
5. Add unit tests + E2E tests
6. Add Slack notifications for team visibility
7. Set up monitoring and alerts

## Support

For issues or questions:
- Check [Troubleshooting](#troubleshooting) section
- Review pipeline logs in AWS Console
- Check CodeBuild build logs
- Review CloudFormation stack events

## Related Documentation

- [DEPLOYMENT.md](../DEPLOYMENT.md) - Initial AWS setup
- [README.md](../../README.md) - Project overview
- [codepipeline.yaml](./codepipeline.yaml) - Pipeline infrastructure
- [buildspec.yml](../buildspec.yml) - CodeBuild build instructions
