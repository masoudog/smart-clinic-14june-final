# Smart Clinic — UI Architecture & Component Discovery Report

**Grounded in:** Figma frame/state names, sampled color & typography tokens, sampled Input component variants, and the current codebase (`clinic-crm/`).

**Status:** Analysis and architecture document only. No files were created, modified, or deleted in producing this report — it preceded and informed `SMART_CLINIC_MIGRATION_PLAN.md`.

---

## 1. Component Architecture

**Shared / design-system primitives** (no booking or landing-specific meaning — usable anywhere, including dashboard later):

- **Button** — variants: primary (filled blue-500), secondary (outline/ghost), icon-button (chevrons, close). Replaces today's hand-rolled `.bw-btn primary/ghost` CSS and the ad hoc `bg-accent text-white` classes scattered per page.
- **Input** — one component covering the Figma variant prop (`Default | Filled | Error | Defaul-number | Filled-number | Reason | Timezone | Time zone-selected`). Text, phone/number, and textarea are the same shell with different content; visual state should be derived from validation/focus, not manually set.
- **TimezoneCombobox** — searchable select with a scrollable menu and check-marked selected item; specific enough (search box, custom list rendering) to warrant its own component rather than folding into Input.
- **OtpCodeInput** — segmented code-entry field, feeds the Code/Code-selected/Wrong-code states.
- **Card** — generic bordered/rounded/shadow container. Backs service cards, contact-info cards, and the wizard card itself, replacing bespoke classes (`.site-service`, `.site-contact-item`, `.bw-card`) that currently duplicate the same visual shell three times.
- **SectionHeading** — heading + supporting paragraph pattern repeated for About/Services/Contact.
- **StatusScreen** — icon + title + subtitle + action(s). One component reused for Success, Error response, Wrong code, and No service across all three personas — they're the same shell with different icon/color/copy, not four separate screens.
- **StepperIndicator** — the dot+line progress bar, currently inline JSX in `BookingWizard.tsx`; needs to become standalone since step counts differ per persona now (4 today vs. up to ~9 for the Abroad flow).
- **Modal/Overlay** — the existing `bw-overlay` click-outside-to-close wrapper, generalized.

**Layout components** (structural, landing-page-scoped):

- **SiteHeader** (navbar: logo, links, phone, support button)
- **SiteFooter** (social, links, logo, staff-login trigger)
- **Section** — a thin wrapper standardizing vertical rhythm/background per section, so spacing comes from tokens instead of per-section custom CSS.

**Page-level:**

- **LandingPage** — same orchestrator role as today, same external props contract (`onLogin`, `onBookingSubmit`), internals rebuilt.

**Feature-specific (booking domain — deliberately not shared/generic, because this is where the real business logic lives):**

- **BookingFlowController** — owns persona selection, current step, accumulated form data, and transition logic. This is where "new vs existing" and "Iran vs abroad" branching is decided — centralized, not scattered across step components.
- **PersonaEntryStep** — the "پرونده ثبت شده ندارم / دارم" choice.
- **NewPatientFlow** (Persona 1 steps): intake form → review → terminal.
- **ExistingPatientFlow** — shared shell for Personas 2 & 3 (phone/OTP → date → time → checkout → terminal), parametrized by a `region: 'iran' | 'abroad'` strategy rather than duplicated, since ~70% of the steps are identical and only the timezone/day-selection differ.
- **JalaliCalendar** — extracted from the current inline calendar math in `BookingWizard.tsx` (`getJalaliToday`, `monthGrid`, `buildAvailability` — these already exist and are reusable, just need to move out of the monolith).

**Reasoning for the boundaries:** shared primitives carry no business meaning, so they're safe to reuse anywhere later (including a future dashboard redesign). Feature-specific components carry the actual persona/region rules, so they stay isolated to the booking domain — this directly serves the instruction to treat New/Existing and Iran/Abroad as business logic, not visual variants: the branching lives in one controller, not duplicated per leaf component.

---

## 2. Design System Analysis

**Colors** — sampled directly from Figma:

- **Primary/blue scale** (50→900): `#e9ebf6`, `#bac2e2`, `#98a4d4`, `#6a7bc1`, `#4d61b5`, `#203aa2` (500/base), `#1d3593`, `#172973`, `#122059`, `#0d1844`. Notably, blue-500 (`#203aa2`) is byte-for-byte identical to today's `--accent` — so the brand color itself doesn't change, it just gets promoted into a full scale.
- **Gray/neutral scale** (sampled from the Input spec): 50 `#F0F1F3`, 100 `#D0D3D9`, 300 `#989FAD`, 400 `#858D9D`, 500 `#667085`, 800 `#383E49`, 900 `#2B2F38`.
- **Red (error):** 500 `#F04438`.
- Secondary, Success, Warning scales exist in Figma (confirmed present, 10-step each) but weren't individually sampled at the time of this report — pull exact hexes at implementation time.
- **Shadow token:** `shadow-xs = 0px 1px 2px rgba(16,24,40,0.05)`.

**Typography** — Vazirmatn across five weights (Thin/Regular/Medium/Bold/ExtraBold), explicit scale: Tiny 10/16, Small 12/18, Caption 14/22, Body 16/20, H6 20/24, H5 24/28, H4 30/34, H3 40/44, H2 60/60, H1 80/80 (size/line-height). Today's implementation has no defined scale at all — it just uses whatever Tailwind utility felt right per element. This should become explicit `fontSize` entries in `tailwind.config.ts`.

**Spacing:** no dedicated "Spacing" documentation frame existed in Figma (unlike Colors/Typography, which did), so this is lower-confidence — observed paddings (14/10px inputs, 32px card padding, 6/8/16px gaps) are consistent with a 4px base grid, which Tailwind's default scale already covers. Recommend not over-engineering a custom spacing scale unless implementation reveals a gap.

**Buttons:** primary filled (blue-500/white text) for forward actions, outline/ghost for back/retry actions — inferred from screenshots (not yet sampled at the pixel level at the time of this report); confirm exact radius/padding against Figma during implementation.

**Inputs:** fully specified (see Component Architecture) — label + 44px-tall, 8px-radius, gray-100-border box with shadow-xs; gray-500 border when filled/focused, red-500 border + inline alert icon + red caption text on error (confirmed real copy: *"این نام قبلا ثبت شده است"* — duplicate-name validation is a real, designed interaction, not incidental).

**Cards:** icon-top layout for service and contact cards; contact cards use a dark/glass treatment over the photo background — two tonal variants of the same shell.

**How it replaces the current system:** the mechanism (CSS custom properties → `tailwind.config.ts` `theme.extend`) stays — it's a sound pattern, no need to change plumbing. Only the token values and names change: pastel tokens (`--sky`, `--sage`, `--beige`, `--lavender`, `--rose`) get superseded by the semantic scale for landing/booking only. They cannot be deleted outright — `Patient.color` in `lib/types.ts` is a `'sky'|'sage'|'beige'|'lavender'|'rose'` enum used by the (out-of-scope) dashboard for patient tagging. So this is additive: new tokens land alongside old ones; old ones stay reachable for the dashboard indefinitely.

---

## 3. Landing Page Structure

1. **Navbar** (sticky) — logo, nav links (خانه/خدمات/تماس با ما), phone number, "پشتیبانی" (support) button. No visible staff-login CTA in the navbar screenshot — consistent with today's footer-only, Alt+L pattern.
2. **Hero** — photo background, headline ("آرامش روان و تحقق خویشتن شما، اولویت ماست") + subhead, and a booking-entry card embedded in the hero showing just the persona choice ("پرونده ثبت شده ندارم/دارم") — the full multi-step wizard appears to expand into a modal from there, mirroring today's `embed` vs. modal duality in `BookingWizard.tsx`.
3. **About/Doctor bio** — heading, role line, intro paragraph, 2×2 checklist of specialty badges (copy changed: schema therapy, psycho-oncology, existentialist approaches, couples/family therapy — different from today's three badges).
4. **Services** — heading + subhead, 2×2 grid of IconCards with recategorized services (personality disorders, general psychiatric psychotherapy, premarital counseling, couples/family therapy — replacing today's adult/child/anxiety/sleep four cards). Icons are now line-art SVGs, not emoji.
5. **Contact** — dark photo background, 2×2 grid of info cards: phone, address, working hours and email (both new as first-class cards — today only address+phone exist, hours live only in the hero panel).
6. **Footer** — unchanged in spirit: social icons, nav links, logo, copyright, staff-login trigger.

**Reusable patterns:** SectionHeading (About/Services/Contact all share heading+subhead+centered layout); IconCard (backs both service cards and contact cards, light vs. dark-glass tone variant).

---

## 4. Booking Flow Structure

Figma names these three personas explicitly, with designer annotations translated below:

**Persona 1 — "First Reservation"** (new patient — first-time registrant, no OTP)
States: Default → Selected (entry choice) → Information (full intake form: name, phone, referrer name — new field, reason) → Info completed (review) → Success / Error response / No service (terminal).

**Persona 2 — "Reserved From Iran"** (existing patient, domestic)
States: Default → Selected → Code (phone entry for OTP) → Code selected → Wrong code (dedicated error state) → Date → Date selected → Time → Time selected → Checkout → Success / Error response.

**Persona 3 — "Reserved From Abroad"** (existing patient, international)
States: Default → Selected → Code → Code selected → time zone → Time zone selected → Date → Date selected → Day → Day selected → Check out → Success / Error response.

Persona 3 is Persona 2's shape plus an inserted timezone step, confirming the timezone requirement is real and localized to exactly this branch. A separate design annotation on the calendar component states it should support both Gregorian and Jalali modes — a real new requirement, not just a persona detail, likely most relevant to the abroad flow.

Also note: today's Figma only forks New-vs-Existing and Iran-vs-Abroad partially — new patients get one unified flow with no location split at all; only existing patients fork by region. That's an asymmetry worth flagging back rather than silently "completing the matrix": the architecture should support a 4th combination (new+abroad) being added later without a rewrite, per the flexibility instruction, but nothing should be built for it speculatively now.

The "No service" terminal state maps directly onto the existing `ClinicSettings.onlineBookingEnabled`/`closedMessage` concept already in `lib/types.ts` — this is a point of continuity with dashboard-side settings, not a new concept.

**State management proposal:** a single `useBookingFlow` reducer/hook holding `{ persona, region?, step, formData }`, with per-persona ordered step-id arrays (directly generalizing the current `STEPS` array + `stepIndex` pattern in `BookingWizard.tsx` — same idea, just parametrized instead of fixed). Per-step validation (`canNext`) should be colocated with each step definition rather than one large ternary, since step count roughly triples. OTP verification needs a genuine (mocked) async/loading state even without a real backend, to make the Wrong-code path demonstrable.

---

## 5. Mock Data / Service Architecture

**Goal:** booking should be fully clickable and demoable with zero AWS calls, but the interface should be the one the real Lambda API will eventually fulfill, so swapping later is an implementation-swap, not a rewrite.

- A `bookingService` abstraction (parallel to, not replacing, today's `lib/dynamodb.ts`) exposing async methods matching the eventual real contract: submit a booking, verify an OTP code, look up an existing patient by phone. The mock implementation behind it uses `setTimeout`-simulated latency plus in-memory/localStorage state, so submissions are inspectable and the demo feels real.
- A small fixtures module holding sample "existing patients" (so the existing-patient/OTP path has something to match against) and a deterministic fake OTP (e.g., a fixed code, or one displayed in a dev-only banner) so both the success and Wrong-code paths are actually reachable in a demo.
- Extend `BookingRequest` in `lib/types.ts` additively with the new fields the Figma flow requires (referrer name, patient-type, region, timezone) — since this type is shared with the (untouched) dashboard's `RequestsPage`, new fields must be optional so existing dashboard code keeps compiling unchanged.
- No Cognito, API Gateway, Lambda, or DynamoDB work of any kind.

---

## 6. Existing Codebase Impact

**Reuse as-is:**

- `app/layout.tsx`, `app/page.tsx`'s top-level landing/login/dashboard switch — unchanged.
- All dashboard components and pages — untouched, out of scope.
- `lib/auth.tsx`, `LoginPage.tsx` — untouched, mock stays exactly as-is.
- `lambda/*`, `template.yaml`, CI/CD — untouched.
- Jalali date-math already in `BookingWizard.tsx` — reusable, just needs relocating.

**To be modified:**

- `LandingPage.tsx` — full rebuild of internals, same external props.
- `app/landing.css` — largely superseded by token-driven styling; whether to keep the "one bespoke CSS file" convention or move fully to Tailwind utilities is an implementation-time call, not decided here.
- `BookingWizard.tsx` — the most heavily impacted file; restructured from one fixed 4-step monolith into the controller + persona-flow breakdown above.
- `lib/types.ts` — `BookingRequest` gains optional new fields.
- `lib/utils.ts` — reconcile with the duplicate/slightly-diverging Jalali math currently living inside `BookingWizard.tsx`.
- `tailwind.config.ts` / `globals.css` — new semantic tokens added alongside existing ones.

**Not touched at all:** Dashboard/CRM (all pages, Sidebar/Topbar/DashboardLayout), backend infra, deployment scripts, Cognito.

**Deprecated later, not now:** pastel tokens' usage within landing/booking (the tokens themselves stay, for dashboard); the `smart-clinic-june-14/project/` prototype bundle becomes purely historical reference once this lands.

---

## 7. Recommended Implementation Order

**A. Design-system foundation** — extend Tailwind/CSS tokens (colors + type scale), additive only. Verify: dashboard renders unchanged; no type errors.

**B. Shared primitives** — Button, Input (all states), Card, SectionHeading, StatusScreen, Modal, StepperIndicator, built against the new tokens in isolation. Verify: each matches its Figma state at a glance.

**C. Landing page static shell** — rebuild Navbar→Hero→About→Services→Contact→Footer with the new primitives; booking widget stubbed. Verify: matches Figma screenshots, RTL intact, responsive.

**D. Booking — New Patient flow first** (simplest: no OTP, no region fork) — build `useBookingFlow` controller + entry choice + full Persona 1 path against the mock service. Verify: a mock `BookingRequest` is produced; Success/Error/No-service all reachable.

**E. Booking — Existing Patient, Iran, then Abroad** — build the shared Existing-Patient shell for Iran first (no timezone), verify OTP success/Wrong-code against the mock; then extend for Abroad by inserting the timezone step and day-selection variant. This step specifically tests whether the architecture actually absorbs a new branch without a rewrite — the real proof of the "future flexibility" goal.

**F. Integration & polish** — wire the hero widget and service-card CTAs into the new wizard; retire the duplicate Jalali math; full manual walkthrough of all three personas and all terminal states; confirm dashboard and mock login remain fully unaffected.

At each phase: confirm TypeScript compiles clean, confirm the dashboard is visually/functionally identical to before (explicit regression guard on the out-of-scope area), and confirm that phase's new behavior is actually clickable end-to-end in the running app.

---

*No files were created, modified, or deleted in producing the original report. This document is a verbatim write-up of that analysis for permanent reference alongside `SMART_CLINIC_MIGRATION_PLAN.md`.*
