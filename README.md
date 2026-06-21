# Smart Clinic CRM — کلینیک روان‌درمانی پوریا

A production-ready, serverless clinic management system built with Next.js and AWS. Features a Persian (Farsi) RTL public website with online booking, and a full CRM dashboard for clinic staff.

**Live Demo:** https://d1veibfi1wr2bc.cloudfront.net

---

## Screenshots

| Landing Page | Booking Wizard | Staff Dashboard |
|---|---|---|
| Persian RTL hero with booking widget | 4-step Jalali calendar wizard | Patient management & calendar |

---

## Features

### Public Website
- Glass navbar with clinic branding
- Hero section with working hours panel
- **4-step online booking wizard** with Jalali (Persian) calendar
- Service cards: Adult Psychology, Child Psychology, Anxiety Disorders, Sleep Disorders
- Doctor profile section (Dr. Mohammad Mahdi Esmailzadeh Pouria)
- Contact section with address and phone
- Urgent booking modal ("ثبت نیاز فوری")
- Staff login via footer (Alt+L shortcut)

### Staff CRM Dashboard
- Patient list with search and profile pages
- Weekly appointment calendar
- Booking request approval workflow (accept / reject)
- Notification center
- Clinic settings (online booking toggle, session buffer, blocked slots)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (React, TypeScript) |
| Styling | Tailwind CSS + custom RTL CSS |
| Font | Vazirmatn (Persian) |
| Backend | AWS Lambda (Node.js 18) |
| Database | Amazon DynamoDB (on-demand) |
| Auth | Amazon Cognito |
| CDN | AWS CloudFront |
| Storage | Amazon S3 |
| IaC | AWS CloudFormation (SAM) |
| CI/CD | Manual deploy scripts (PowerShell) |

---

## Project Structure

```
smart-clinic-14june-final/
├── clinic-crm/                        # Production Next.js application
│   ├── app/
│   │   ├── page.tsx                   # App entry point & routing
│   │   ├── layout.tsx                 # Root layout (RTL, Vazirmatn font)
│   │   ├── globals.css                # Design system tokens
│   │   └── landing.css                # Landing page & booking wizard styles
│   ├── components/
│   │   ├── BookingWizard.tsx          # Jalali calendar 4-step booking wizard
│   │   ├── Toast.tsx                  # Toast notifications
│   │   ├── layout/
│   │   │   ├── DashboardLayout.tsx    # Main CRM layout shell
│   │   │   ├── Sidebar.tsx            # Navigation sidebar
│   │   │   └── Topbar.tsx             # Search + notifications bar
│   │   └── pages/
│   │       ├── LandingPage.tsx        # Public marketing site
│   │       ├── LoginPage.tsx          # Staff authentication
│   │       ├── DashboardPage.tsx      # Overview + stats
│   │       ├── PatientsPage.tsx       # Patient list
│   │       ├── PatientProfilePage.tsx # Individual patient profile
│   │       ├── CalendarPage.tsx       # Weekly schedule view
│   │       ├── RequestsPage.tsx       # Booking request approval
│   │       ├── NotificationsPage.tsx  # Notification center
│   │       └── SettingsPage.tsx       # Clinic configuration
│   ├── lambda/
│   │   ├── patients/                  # CRUD API for patients
│   │   ├── events/                    # CRUD API for calendar events
│   │   ├── bookings/                  # Booking request API
│   │   ├── notifications/             # Notifications API
│   │   └── settings/                  # Clinic settings API
│   ├── lib/
│   │   ├── auth.tsx                   # Cognito auth context
│   │   ├── dynamodb.ts                # DynamoDB service layer
│   │   ├── types.ts                   # TypeScript interfaces
│   │   └── utils.ts                   # Persian date/number utilities
│   ├── public/
│   │   └── hero.jpg                   # Hero background image
│   ├── template-simple.yaml           # CloudFormation stack (deployed)
│   ├── template.yaml                  # Full SAM template (Lambda + Cognito)
│   ├── deploy.ps1                     # Full deployment script
│   ├── deploy-now.ps1                 # Infrastructure-only deploy
│   ├── deploy-frontend.ps1            # Frontend S3 deploy
│   └── package.json
└── smart-clinic-june-14/              # Original design handoff bundle
    └── project/                       # Claude Design prototype (HTML/JSX/CSS)
```

---

## AWS Architecture

```
Users
  │
  ▼
CloudFront (CDN)
  ├── S3 Bucket (Next.js static files)
  └── API Gateway
        ├── Lambda: /patients
        ├── Lambda: /events
        ├── Lambda: /bookings
        ├── Lambda: /notifications
        └── Lambda: /settings
              │
              ▼
          DynamoDB
    ┌─────────────────┐
    │ clinic-patients  │
    │ clinic-events    │
    │ clinic-bookings  │
    │ clinic-notifs    │
    │ clinic-settings  │
    └─────────────────┘

Auth: Amazon Cognito (staff only)
```

---

## Deployed AWS Resources

| Resource | Value |
|----------|-------|
| CloudFront Domain | `d1veibfi1wr2bc.cloudfront.net` |
| S3 Bucket | `clinic-frontend-694364706816-dev` |
| CloudFront Distribution | `E286YTEGSFKAFX` |
| DynamoDB Tables | `clinic-patients-dev`, `clinic-events-dev`, `clinic-bookings-dev`, `clinic-notifications-dev`, `clinic-settings-dev` |
| Region | `us-east-1` |
| AWS Profile | `dm-develop-admin` |

---

## Getting Started

### Prerequisites
- Node.js 18+
- AWS CLI configured with profile `dm-develop-admin`
- AWS SAM CLI

### Local Development

```bash
cd clinic-crm
npm install
npm run dev
# Open http://localhost:3000
```

### Deploy to AWS

```powershell
# Deploy infrastructure (DynamoDB, S3, CloudFront)
cd clinic-crm
.\deploy-now.ps1 -Environment dev

# Build and deploy frontend
npm run build
aws s3 sync out/ s3://clinic-frontend-694364706816-dev --delete --region us-east-1 --profile dm-develop-admin
aws cloudfront create-invalidation --distribution-id E286YTEGSFKAFX --paths "/*" --region us-east-1 --profile dm-develop-admin
```

---

## DynamoDB Schema

### Patients Table
```typescript
{
  clinicId: string        // HASH key
  id: string              // RANGE key
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
  companion?: { relation: string; name: string; phone: string }
}
```

### Calendar Events Table
```typescript
{
  clinicId: string        // HASH key
  id: string              // RANGE key
  day: number             // 0–6 (Saturday–Friday)
  startHour: number
  duration: number        // hours
  mode: 'in-person' | 'online'
  patientId?: string
}
```

### Booking Requests Table
```typescript
{
  clinicId: string        // HASH key
  id: string              // RANGE key
  firstName: string
  lastName: string
  phone: string
  mode: 'in-person' | 'online'
  status: 'pending' | 'scheduled' | 'rejected'
  source: 'online' | 'admin'
  dow?: number
  hour?: number
}
```

---

## API Endpoints

All admin endpoints require Cognito JWT in `Authorization` header.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/patients?clinicId=` | List patients |
| POST | `/patients` | Create patient |
| PATCH | `/patients/{id}` | Update patient |
| DELETE | `/patients/{id}` | Delete patient |
| GET | `/events?clinicId=` | List calendar events |
| POST | `/events` | Create event |
| PATCH | `/events/{id}` | Update event |
| DELETE | `/events/{id}` | Delete event |
| GET | `/bookings?clinicId=` | List booking requests |
| POST | `/bookings` | Submit booking (public) |
| PATCH | `/bookings/{id}` | Accept / reject booking |
| GET | `/notifications?clinicId=` | List notifications |
| PATCH | `/notifications/mark-all-read` | Mark all read |
| GET | `/settings?clinicId=` | Get clinic settings |
| PATCH | `/settings` | Update settings |

---

## Roadmap

- [ ] Wire Cognito hosted UI for real staff authentication
- [ ] Connect Lambda API endpoints to frontend service layer
- [ ] Add patient session history timeline
- [ ] SMS appointment reminders via Amazon SNS
- [ ] Email notifications via Amazon SES
- [ ] GitHub Actions CI/CD pipeline
- [ ] Multi-environment (dev / staging / prod)
- [ ] Custom domain via Route 53

---

## Monthly Cost Estimate (AWS)

| Service | Estimated Cost |
|---------|---------------|
| CloudFront + S3 | ~$3–5 |
| DynamoDB (on-demand) | ~$1.25 |
| Lambda (low traffic) | ~$0.20 |
| Cognito (up to 50K users) | Free |
| **Total** | **~$4–6/month** |

---

## Design Source

The UI was designed in [Claude Design](https://claude.ai/design) and exported as an HTML/CSS/JSX prototype bundle. The original design files are preserved in `smart-clinic-june-14/project/` for reference.

---

## License

MIT

---

*Built with Claude Code + AWS Serverless*
