# Implementation Notes — Smart Clinic CRM

## ✅ What's Been Built

### Project Scaffold
- **Next.js 15** with TypeScript and App Router
- **Tailwind CSS** with RTL support and design system tokens
- **Complete component structure** — layout, pages, utilities
- **Type definitions** for all database models
- **Authentication context** for Cognito integration

### Frontend Components
1. **Layout Components**
   - `Sidebar.tsx` — Navigation menu with badge counts
   - `Topbar.tsx` — Search bar and notifications
   - `DashboardLayout.tsx` — Main app container

2. **Page Components**
   - `LandingPage.tsx` — Public-facing clinic website + booking widget
   - `LoginPage.tsx` — Staff authentication
   - `DashboardPage.tsx` — Overview with stats and pending requests
   - `PatientsPage.tsx` — Patient list with search and filtering
   - `CalendarPage.tsx` — Weekly calendar view with event management
   - `PatientProfilePage.tsx` — Detailed patient profile
   - `NotificationsPage.tsx` — Notification center
   - `RequestsPage.tsx` — Booking request approval workflow
   - `SettingsPage.tsx` — Clinic configuration

### Backend Infrastructure
- **AWS SAM Template** (`template.yaml`) with:
  - 5 **DynamoDB tables** (Patients, Events, Bookings, Notifications, Settings)
  - 5 **Lambda functions** for API endpoints
  - **Cognito User Pool** for staff authentication
  - **API Gateway** with CORS and authorization
  - **S3 bucket** for frontend hosting
  - **CloudFront distribution** for CDN

### Lambda Functions
- `lambda/patients/index.js` — CRUD operations for patients
- `lambda/events/index.js` — Calendar event management
- `lambda/bookings/index.js` — Booking request handling
- `lambda/notifications/index.js` — Notification management
- `lambda/settings/index.js` — Clinic settings

### Utilities
- `lib/types.ts` — TypeScript interfaces for all data models
- `lib/auth.tsx` — Cognito authentication context
- `lib/dynamodb.ts` — DynamoDB service layer (client-side API calls)
- `lib/utils.ts` — Persian number conversion, date handling, utilities

### Configuration
- `next.config.ts` — Static export for S3
- `tailwind.config.ts` — Design system colors and spacing
- `tsconfig.json` — TypeScript compiler options
- `.eslintrc.json` — Linting rules

### Documentation
- `README.md` — Project overview and features
- `DEPLOYMENT.md` — Complete AWS deployment guide
- `samconfig.toml.example` — SAM configuration template

---

## 📋 What Still Needs Implementation

### 1. **Cognito Integration (HIGH PRIORITY)**
**Location**: `lib/auth.tsx`

Currently, the auth context has mock implementations. You need to:

```typescript
// Replace the mock login/logout with Cognito SDK calls
import { Amplify, Auth } from 'aws-amplify';

// Configure Amplify with Cognito credentials
Amplify.configure({
  Auth: {
    region: process.env.NEXT_PUBLIC_AWS_REGION,
    userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID,
    userPoolWebClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID,
    identityPoolId: process.env.NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID,
  }
});

// Implement actual login via Auth.signIn()
// Implement logout via Auth.signOut()
// Handle JWT token retrieval and API headers
```

**Env Variables Needed**:
```
NEXT_PUBLIC_AWS_REGION=us-east-1
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_xxxxx
NEXT_PUBLIC_COGNITO_CLIENT_ID=xxxxx
NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID=us-east-1:xxxxx
NEXT_PUBLIC_API_URL=https://xxxxx.execute-api.us-east-1.amazonaws.com/dev
```

### 2. **Lambda DynamoDB Integration (HIGH PRIORITY)**
**Location**: `lambda/*/index.js`

The Lambda functions have basic structure but need:
- Error handling and validation
- Proper DynamoDB error responses
- Input sanitization
- Logging and monitoring

Example enhancement for `lambda/patients/index.js`:
```javascript
// Add validation
if (!patient.firstName || !patient.lastName) {
  return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields' }) };
}

// Add error handling
try {
  // Operation
} catch (error) {
  if (error.code === 'ValidationException') {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid input' }) };
  }
  // Log to CloudWatch
  console.error('[ERROR]', error);
  return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) };
}
```

### 3. **Public Booking Widget (MEDIUM PRIORITY)**
**Location**: `components/pages/LandingPage.tsx`

The landing page has a basic booking modal but needs:
- Integration with `/bookings` POST endpoint
- Slot availability calculation (needs `computeSlots` utility)
- Form validation and error handling
- Success confirmation
- Phone number formatting (Persian digits)

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    const response = await fetch(`${API_URL}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...bookingForm,
        source: 'online',
        status: 'pending',
        submittedAt: new Date().toISOString(),
      }),
    });
    // Handle response
  } catch (error) {
    setError(error.message);
  }
};
```

### 4. **Modal Components (MEDIUM PRIORITY)**
**Location**: `components/modals/` (new directory)

Create reusable modals:
- `AddPatientModal.tsx` — Add new patient form
- `BookSessionModal.tsx` — Book a session (admin)
- `SessionEditModal.tsx` — Edit/delete calendar event
- `ConfirmDialog.tsx` — Generic confirmation dialog

### 5. **Admin Booking Wizard (MEDIUM PRIORITY)**
**Location**: `components/pages/DashboardPage.tsx`

When admin clicks "Book Session", show a multi-step modal:
1. Select patient (dropdown or search)
2. Select date and time (calendar picker)
3. Select duration and mode (online/in-person)
4. Add notes
5. Create event(s) in calendar

### 6. **API Client Enhancements (MEDIUM PRIORITY)**
**Location**: `lib/dynamodb.ts`

Currently, it makes raw fetch calls. Add:
- Automatic token injection
- Request/response logging
- Retry logic for failed requests
- Error normalization

```typescript
private async fetchAPI(endpoint: string, method: string = 'GET', body?: any) {
  const token = this.getToken();
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (response.status === 401) {
    // Token expired, refresh and retry
    await refreshToken();
    return this.fetchAPI(endpoint, method, body);
  }

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'API Error');
  }

  return response.json();
}
```

### 7. **Calendar Widget (LOW PRIORITY)**
**Location**: `components/pages/CalendarPage.tsx`

Current implementation is basic. Enhance with:
- Drag-and-drop event rescheduling
- Click to create new event
- Color-coded patient sessions
- Therapist view option
- Time slot conflicts highlighting

### 8. **Form Components (LOW PRIORITY)**
**Location**: `components/forms/` (new directory)

Create reusable form components:
- `Input.tsx` — RTL-aware input with validation
- `Select.tsx` — Dropdown with Persian support
- `DatePicker.tsx` — Jalali date picker
- `TimePicker.tsx` — Time selection
- `PhoneInput.tsx` — Phone number formatting

### 9. **Testing (LOW PRIORITY)**
**Location**: `__tests__/` (new directory)

Set up testing:
```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
```

Create tests for:
- Components (rendering, interactions)
- Utilities (date conversion, Persian numbers)
- API layer (mock calls)

### 10. **Environment-Specific Config (LOW PRIORITY)**
**Location**: `.env.local`, `.env.staging`, `.env.production`

Set up different configs per environment:
- Dev: local Lambda (SAM local)
- Staging: AWS staging environment
- Production: AWS production environment

---

## 🚀 Recommended Next Steps

### Immediate (This Week)
1. ✅ Install dependencies: `npm install`
2. ✅ Set up AWS account and SAM CLI
3. **Deploy backend skeleton**: `sam build && sam deploy --guided`
4. **Implement Cognito auth** in `lib/auth.tsx`
5. **Wire up API client** to actual Lambda endpoints
6. **Test login flow** end-to-end

### Short-term (Next Week)
1. Create admin booking modal
2. Create add-patient modal
3. Implement public booking submission
4. Add form validation and error handling
5. Test all API endpoints

### Medium-term (2 Weeks)
1. Add patient search/filtering
2. Implement calendar drag-and-drop
3. Create detailed notifications
4. Add clinic settings UI
5. Set up monitoring (CloudWatch)

### Long-term (1 Month)
1. Add email notifications (SES)
2. SMS reminders (SNS/Twilio)
3. Patient portal (self-service cancellation)
4. Reports and analytics
5. Multi-clinic support

---

## 🔧 Local Development Setup

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env.local
# Edit .env.local with your values

# 3. Run local dev server
npm run dev

# 4. (Optional) Run SAM local API
sam build
sam local start-api

# 5. Open http://localhost:3000
```

## 📦 Deployment Checklist

Before deploying to AWS:

- [ ] AWS account created and configured
- [ ] SAM CLI installed
- [ ] AWS CLI configured with credentials
- [ ] `.env.local` configured with AWS details
- [ ] Backend deployed with SAM
- [ ] Cognito User Pool created and configured
- [ ] Frontend built: `npm run build && npm run export`
- [ ] Frontend uploaded to S3
- [ ] CloudFront distribution set up
- [ ] Custom domain configured (optional)
- [ ] Test user created in Cognito
- [ ] End-to-end testing completed

## 📚 Useful Resources

- **Next.js**: https://nextjs.org/docs
- **AWS SAM**: https://aws.amazon.com/serverless/sam/
- **DynamoDB**: https://docs.aws.amazon.com/dynamodb/
- **Cognito**: https://docs.aws.amazon.com/cognito/
- **Tailwind CSS**: https://tailwindcss.com/docs
- **AWS Amplify**: https://docs.amplify.aws/

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make changes and commit: `git commit -am 'Add feature'`
3. Push to branch: `git push origin feature/your-feature`
4. Submit pull request

---

**Last Updated**: June 21, 2026
**Status**: Project scaffold complete, ready for Cognito integration
