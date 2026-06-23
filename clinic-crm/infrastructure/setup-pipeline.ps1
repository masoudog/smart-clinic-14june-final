# Smart Clinic - CodePipeline Setup Script
# Deploys the CI/CD pipeline for the dev environment using AWS CodeConnections
#
# Usage:
#   .\setup-pipeline.ps1
#   .\setup-pipeline.ps1 -GitHubRepo "myuser/smart-clinic-14june-final"
#   .\setup-pipeline.ps1 -AwsProfile "dm-develop-admin"

param(
    [string]$Environment    = "dev",
    [string]$GitHubRepo     = "masoudog/smart-clinic-14june-final",
    [string]$GitHubBranch   = "main",
    [string]$ConnectionArn  = "arn:aws:codeconnections:us-east-1:694364706816:connection/647fb103-e682-40dc-9d5f-4f709ddf7a23",
    [string]$AwsRegion      = "us-east-1",
    [string]$AwsProfile     = "dm-develop-admin"
)

# ── Helper output functions ─────────────────────────────────────────────────
function Write-Step  { param([string]$m) Write-Host "`n=== $m ===" -ForegroundColor Yellow }
function Write-OK    { param([string]$m) Write-Host "  ✓ $m" -ForegroundColor Green }
function Write-Fail  { param([string]$m) Write-Host "  ✗ $m" -ForegroundColor Red }
function Write-Info  { param([string]$m) Write-Host "  • $m" -ForegroundColor Cyan }

# Shared AWS CLI args
$awsArgs = @("--region", $AwsRegion, "--profile", $AwsProfile, "--no-cli-pager")

# ── 1. Verify AWS credentials ────────────────────────────────────────────────
Write-Step "Verifying AWS credentials"
try {
    $identity = aws sts get-caller-identity @awsArgs --output json | ConvertFrom-Json
    Write-OK "Account : $($identity.Account)"
    Write-OK "User/Role: $($identity.Arn)"
} catch {
    Write-Fail "AWS credentials not found or expired. Run: aws configure --profile $AwsProfile"
    exit 1
}

# ── 2. Check CodeConnections status ─────────────────────────────────────────
Write-Step "Checking CodeConnections status"
try {
    $conn = aws codeconnections get-connection `
        --connection-arn $ConnectionArn @awsArgs --output json | ConvertFrom-Json
    $status = $conn.Connection.ConnectionStatus
    Write-Info "Connection : $($conn.Connection.ConnectionName)"
    Write-Info "Status     : $status"
    if ($status -ne "AVAILABLE") {
        Write-Fail "Connection is NOT AVAILABLE (status: $status)."
        Write-Host ""
        Write-Host "  Go to AWS Console → Developer Tools → Connections and" -ForegroundColor Yellow
        Write-Host "  click 'Update pending connection' to authorise GitHub access." -ForegroundColor Yellow
        exit 1
    }
    Write-OK "Connection is AVAILABLE"
} catch {
    Write-Fail "Could not retrieve connection. Check the ARN and your IAM permissions."
    Write-Info "ARN: $ConnectionArn"
    exit 1
}

# ── 3. Find CloudFront distribution for the existing app stack ───────────────
Write-Step "Looking up CloudFront distribution for 'clinic-crm-$Environment'"
$appStack = "clinic-crm-$Environment"
try {
    $stackOutputsJson = aws cloudformation describe-stacks `
        --stack-name $appStack @awsArgs --output json
    $stackOutputs = ($stackOutputsJson | ConvertFrom-Json).Stacks[0].Outputs
    $cfDomain = ($stackOutputs | Where-Object { $_.OutputKey -eq "CloudFrontDomainName" }).OutputValue

    if (-not $cfDomain) {
        Write-Fail "Stack '$appStack' exists but has no CloudFrontDomainName output."
        exit 1
    }
    Write-OK "CloudFront domain: $cfDomain"
} catch {
    Write-Fail "Stack '$appStack' not found. Deploy the application first:"
    Write-Host ""
    Write-Host "  cd clinic-crm" -ForegroundColor Yellow
    Write-Host "  sam build && sam deploy --guided" -ForegroundColor Yellow
    exit 1
}

# ── 4. Deploy the pipeline CloudFormation stack ──────────────────────────────
Write-Step "Deploying pipeline stack  (clinic-crm-pipeline-$Environment)"

$templatePath = Join-Path $PSScriptRoot "codepipeline.yaml"
if (-not (Test-Path $templatePath)) {
    Write-Fail "Template not found: $templatePath"
    exit 1
}

$pipelineStack = "clinic-crm-pipeline-$Environment"

aws cloudformation deploy `
    --template-file $templatePath `
    --stack-name $pipelineStack `
    --parameter-overrides `
        Environment=$Environment `
        FullRepositoryId=$GitHubRepo `
        GitHubBranch=$GitHubBranch `
        ConnectionArn=$ConnectionArn `
    --capabilities CAPABILITY_NAMED_IAM `
    @awsArgs

if ($LASTEXITCODE -ne 0) {
    Write-Fail "CloudFormation deployment failed. Check the AWS Console for errors:"
    Write-Info "https://console.aws.amazon.com/cloudformation/home?region=$AwsRegion#/stacks"
    exit 1
}
Write-OK "Pipeline stack deployed successfully"

# ── 5. Print pipeline URL and next steps ────────────────────────────────────
Write-Step "Done!"

$pipelineUrl = "https://console.aws.amazon.com/codepipeline/home?region=$AwsRegion#/view/$pipelineStack"
$buildUrl    = "https://console.aws.amazon.com/codesuite/codebuild/projects?region=$AwsRegion"
$logsUrl     = "https://console.aws.amazon.com/cloudwatch/home?region=$AwsRegion#logsV2:log-groups/log-group/%2Faws%2Fcodebuild%2Fclinic-crm-$Environment"

Write-OK "Pipeline is live!"
Write-Host ""
Write-Host "  Monitor pipeline :" -ForegroundColor Cyan
Write-Host "  $pipelineUrl" -ForegroundColor White
Write-Host ""
Write-Host "  View build logs  :" -ForegroundColor Cyan
Write-Host "  $logsUrl" -ForegroundColor White
Write-Host ""
Write-Host "  Trigger a deploy :" -ForegroundColor Cyan
Write-Host "  git push origin $GitHubBranch" -ForegroundColor White
Write-Host ""
Write-Host "The pipeline will also run immediately for the latest commit on '$GitHubBranch'." -ForegroundColor Yellow
