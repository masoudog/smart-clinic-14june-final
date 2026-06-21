# Quick Start — Deploy Smart Clinic CRM to AWS in 15 Minutes

You have AWS CLI and SAM already configured. Let's deploy!

## 🚀 Step 1: Deploy Backend (5 minutes)

Run this PowerShell command from `clinic-crm/` directory:

```powershell
cd C:\Code\smart-clinic-14june-final\clinic-crm
.\deploy.ps1 -Environment dev
```

**What this does:**
1. ✅ Builds SAM template
2. ✅ Deploys Lambda, DynamoDB, API Gateway, Cognito to AWS
3. ✅ Builds Next.js frontend
4. ✅ Saves AWS credentials to `.env.local`

**Wait for output like:**
```
📋 AWS Deployment Outputs:
API Endpoint:       https://xxxxx.execute-api.us-east-1.amazonaws.com/dev
Cognito User Pool:  us-east-1_xxxxx
Cognito Client:     xxxxx
Frontend Bucket:    clinic-frontend-123456789-dev
CloudFront Domain:  d123abc.cloudfront.net
```

**Copy these values** — you'll need them next.

---

## 🎨 Step 2: Deploy Frontend (2 minutes)

After backend deployment finishes, run:

```powershell
.\deploy-frontend.ps1 -Environment dev
```

**What this does:**
- Uploads Next.js static files to S3
- Invalidates CloudFront cache
- Serves from: `https://d123abc.cloudfront.net`

---

## 👤 Step 3: Create Test User (3 minutes)

Replace `COGNITO_USER_POOL_ID` with your value from Step 1:

```powershell
# Create user
aws cognito-idp admin-create-user `
  --user-pool-id us-east-1_xxxxx `
  --username admin@clinic.com `
  --temporary-password TempPassword123! `
  --region us-east-1 `
  --profile dm-develop-admin

# Set permanent password
aws cognito-idp admin-set-user-password `
  --user-pool-id us-east-1_xxxxx `
  --username admin@clinic.com `
  --password Admin@123456 `
  --permanent `
  --region us-east-1 `
  --profile dm-develop-admin
```

---

## ✅ Step 4: Verify Deployment (5 minutes)

1. **Visit your app**: `https://d123abc.cloudfront.net`
2. **Login with**:
   - Email: `admin@clinic.com`
   - Password: `Admin@123456`
3. **Explore**:
   - Dashboard
   - Patients page
   - Calendar
   - Notifications

---

## 📋 What You Have Now

### Backend (AWS)
- ✅ Lambda API (5 functions)
- ✅ DynamoDB (5 tables)
- ✅ Cognito authentication
- ✅ API Gateway with CORS
- ✅ CloudFront CDN

### Frontend
- ✅ Next.js React app
- ✅ Persian RTL design
- ✅ Static files on S3
- ✅ Global CDN caching

### Estimated Monthly Cost
- ~**$3-6/month** (mostly S3 + CloudFront)
- Cognito: FREE (up to 50K users)
- Lambda: ~$0.20/month (low traffic)
- DynamoDB: ~$1.25/month (on-demand)

---

## 🔧 Next: Wire Cognito Authentication

The app is deployed but login isn't wired yet. To enable actual Cognito login:

### Edit `lib/auth.tsx`

```typescript
import { Amplify, Auth } from 'aws-amplify';

Amplify.configure({
  Auth: {
    region: process.env.NEXT_PUBLIC_COGNITO_REGION,
    userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID,
    userPoolWebClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID,
  }
});

export const useAuth = () => {
  const login = async (email: string, password: string) => {
    const user = await Auth.signIn(email, password);
    setUser({
      sub: user.username,
      email: user.attributes.email,
      name: user.attributes.name,
      role: 'admin',
      clinicId: 'clinic-1',
    });
  };

  const logout = async () => {
    await Auth.signOut();
    setUser(null);
  };
  
  // ... rest of context
};
```

Then:
```bash
npm install aws-amplify
npm run build && npm run export
.\deploy-frontend.ps1 -Environment dev
```

---

## 🆘 Troubleshooting

### "SAM build failed"
```powershell
sam --version
# If not found, install: pip install aws-sam-cli
```

### "CloudFormation stack failed"
```powershell
# Check what went wrong
aws cloudformation describe-stack-resources `
  --stack-name clinic-crm-dev `
  --region us-east-1 `
  --profile dm-develop-admin
```

### "S3 access denied"
```powershell
# Verify bucket exists
aws s3 ls `
  --profile dm-develop-admin
```

### "Cognito login not working"
The auth context is stubbed. Follow "Wire Cognito Authentication" above.

---

## 📝 File Summary

| File | Purpose |
|------|---------|
| `deploy.ps1` | Deploy backend + frontend |
| `deploy-frontend.ps1` | Deploy only frontend |
| `.env.local` | AWS credentials (auto-generated) |
| `template.yaml` | SAM infrastructure definition |
| `app/page.tsx` | Main React app |
| `lib/auth.tsx` | Authentication (needs Cognito wiring) |
| `lib/dynamodb.ts` | API client (calls Lambda) |

---

## 🎯 What's Working Now

- ✅ Full UI built
- ✅ Backend infrastructure deployed
- ✅ Database tables created
- ✅ API endpoints available
- ⚠️ **Auth needs wiring** (mock login for now)
- ⚠️ **API calls stubbed** (need to wire to Lambda)

---

## 🚀 One-Command Deploy

From `clinic-crm/` directory:

```powershell
# Full deployment (backend + frontend + auth check)
.\deploy.ps1 -Environment dev; .\deploy-frontend.ps1 -Environment dev
```

That's it! Your clinic management system is live on AWS.

---

**Questions?** Check:
1. `README.md` — Feature overview
2. `DEPLOYMENT.md` — Detailed AWS setup
3. `IMPLEMENTATION_NOTES.md` — What's left to build
