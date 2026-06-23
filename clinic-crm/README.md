# Smart Clinic CRM (کلینیک آرامش)

A modern, serverless patient management and appointment booking system for clinics and therapy practices. Built with Next.js, AWS Lambda, DynamoDB, and Cognito.

## 🎯 Features

- **Patient Management** — Complete patient profiles with medical history and session tracking
- **Appointment Calendar** — Visual scheduling with conflict detection and time slot management
- **Online Booking** — Public-facing booking system with time slot availability
- **Booking Requests** — Admin review and approval workflow for online bookings
- **Notifications** — Real-time notifications for new bookings and system events
- **Clinic Settings** — Flexible configuration for working hours, blocked slots, and session buffers
- **RTL Layout** — Full Persian (Farsi) support with right-to-left text direction
- **Responsive Design** — Works seamlessly on desktop, tablet, and mobile devices

## 🏗️ Architecture

```
┌─ Frontend (Next.js)
│  ├─ React Components (TSX)
│  ├─ Tailwind CSS (RTL-optimized)
│  └─ Static export → S3 + CloudFront
│
├─ Backend (AWS Lambda)
│  ├─ Patients service
│  ├─ Calendar/Events service
│  ├─ Bookings service
│  ├─ Notifications service
│  └─ Settings service
│
├─ Database (DynamoDB)
│  ├─ Patients table
│  ├─ Calendar Events table
│  ├─ Booking Requests table
│  ├─ Notifications table
│  └─ Clinic Settings table
│
└─ Auth (Cognito)
   ├─ User Pool
   └─ Hosted UI (Persian-compatible)
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- AWS Account
- AWS CLI configured
- SAM CLI installed

### Local Development

```bash
# 1. Install dependencies
cd clinic-crm
npm install

# 2. Start development server
npm run dev

# 3. Open http://localhost:3000
```

### Deploy to AWS

**Automated CI/CD Pipeline (Recommended)**

Deploy with AWS CodePipeline for automated builds and deployments:

```bash
cd infrastructure
.\setup-pipeline.ps1 -Environment dev -GitHubToken "your_token_here"
```

Then push to GitHub to trigger automatic deployment:
```bash
git push origin main
```

See [infrastructure/CI_CD_SETUP.md](./infrastructure/CI_CD_SETUP.md) for complete CI/CD guide.

**Manual Deployment**

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete instructions.

Quick deploy:
```bash
sam build
sam deploy --guided
npm run export
aws s3 sync out/ s3://clinic-frontend-ACCOUNT_ID-dev --delete
```

## 📁 Project Structure

```
clinic-crm/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Main app entry point
│   └── globals.css              # Global styles & design system
│
├── components/
│   ├── layout/                  # Layout components
│   │   ├── Sidebar.tsx
│   │   ├── Topbar.tsx
│   │   └── DashboardLayout.tsx
│   ├── pages/                   # Page components
│   │   ├── LandingPage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── PatientsPage.tsx
│   │   ├── CalendarPage.tsx
│   │   ├── NotificationsPage.tsx
│   │   ├── RequestsPage.tsx
│   │   ├── SettingsPage.tsx
│   │   └── PatientProfilePage.tsx
│   └── Toast.tsx                # Toast notification
│
├── lib/
│   ├── auth.tsx                 # Cognito auth context
│   ├── dynamodb.ts              # DynamoDB service layer
│   ├── types.ts                 # TypeScript type definitions
│   └── utils.ts                 # Utility functions (Persian dates, etc)
│
├── lambda/
│   ├── patients/                # Patients API Lambda
│   ├── events/                  # Calendar Events API Lambda
│   ├── bookings/                # Booking Requests API Lambda
│   ├── notifications/           # Notifications API Lambda
│   └── settings/                # Clinic Settings API Lambda
│
├── public/                      # Static assets
├── template.yaml                # SAM Infrastructure as Code
├── next.config.ts               # Next.js configuration
├── tailwind.config.ts           # Tailwind CSS configuration
├── tsconfig.json                # TypeScript configuration
└── DEPLOYMENT.md                # AWS deployment guide
```

## 🎨 Design System

The app uses a calm, minimal Persian-friendly design with pastel colors:

- **Primary Colors**: Sky, Sage, Beige, Lavender, Rose
- **Accent Color**: Indigo Blue (#203AA2)
- **Fonts**: Vazirmatn (body), Estedad (headings)
- **RTL Layout**: Full right-to-left text direction support

All design tokens are defined in `app/globals.css` and `tailwind.config.ts`.

## 🔐 Authentication

The app uses AWS Cognito for staff authentication:

1. User logs in with email/password
2. Cognito validates credentials
3. Returns JWT token
4. All API requests include token in Authorization header
5. Lambda functions validate token via Cognito authorizer

## 💾 Database Schema

### Patients Table
```typescript
{
  clinicId: string              // Clinic ID (HASH key)
  id: string                    // Patient ID (RANGE key)
  firstName: string
  lastName: string
  phone: string
  age?: string
  status: 'active' | 'inactive'
  color: 'sky' | 'sage' | 'beige' | 'lavender' | 'rose'
  sessions: number
  lastSession?: string
  notes: string
  tags: string[]
  companion?: {
    relation: string
    name: string
    phone: string
  }
  createdAt: string
  updatedAt: string
}
```

### Calendar Events Table
```typescript
{
  clinicId: string              // HASH key
  id: string                    // RANGE key
  day: number                   // 0-6 (Sunday-Saturday)
  startHour: number
  duration: number              // hours
  therapistId: string
  mode: 'in-person' | 'online'
  patientId?: string
  name?: string
  color?: string
  buffer?: number               // minutes
  fromBooking?: boolean
  createdAt: string
  updatedAt: string
}
```

### Booking Requests Table
```typescript
{
  clinicId: string              // HASH key
  id: string                    // RANGE key
  firstName: string
  lastName: string
  phone: string
  dateLabel: string
  time: string
  dow?: number                  // day of week
  hour?: number
  mode: 'in-person' | 'online'
  reason: string
  double?: boolean              // back-to-back sessions
  submittedAt: string
  source: 'online' | 'admin'
  status: 'pending' | 'scheduled' | 'rejected'
  color: string
  createdAt: string
  updatedAt: string
}
```

## 🔌 API Endpoints

All endpoints require `Cognito` authorization.

### Patients
- `GET /patients?clinicId=...` — List all patients
- `GET /patients/{patientId}?clinicId=...` — Get single patient
- `POST /patients` — Create patient
- `PATCH /patients/{patientId}` — Update patient
- `DELETE /patients/{patientId}` — Delete patient

### Calendar Events
- `GET /events?clinicId=...` — List events
- `POST /events` — Create event
- `PATCH /events/{eventId}` — Update event
- `DELETE /events/{eventId}` — Delete event

### Booking Requests
- `GET /bookings?clinicId=...` — List booking requests
- `POST /bookings` — Create booking request
- `PATCH /bookings/{bookingId}` — Update booking request (approve/reject)

### Notifications
- `GET /notifications?clinicId=...` — List notifications
- `PATCH /notifications/{notificationId}/read` — Mark as read
- `PATCH /notifications/mark-all-read` — Mark all as read

### Settings
- `GET /settings?clinicId=...` — Get clinic settings
- `PATCH /settings` — Update settings

## 📦 Building for Production

```bash
# Build frontend
npm run build
npm run export

# This creates static files in `out/` directory ready for S3
```

## 🧪 Testing

```bash
# Run linter
npm run lint

# Run type checking
npx tsc --noEmit
```

## 🐛 Troubleshooting

### "Cannot find module" errors
```bash
rm -rf node_modules .next
npm install
npm run build
```

### Cognito login not working
- Verify Cognito User Pool ID in `.env.local`
- Check Cognito App Client settings
- Ensure callback URLs are correct

### API 403 errors
- Verify API token in Authorization header
- Check Cognito authorizer configuration in API Gateway
- Verify IAM role permissions for Lambda functions

### DynamoDB timeouts
- Check CloudWatch metrics for throttling
- Increase Lambda timeout in `template.yaml`
- Verify DynamoDB table capacity (on-demand mode is default)

## 📝 License

MIT

## 👥 Support

For issues or questions, contact the development team or check the [DEPLOYMENT.md](./DEPLOYMENT.md) guide.

---

**Built with ❤️ for کلینیک آرامش**
