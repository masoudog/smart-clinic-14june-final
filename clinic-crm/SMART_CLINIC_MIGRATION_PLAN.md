# Smart Clinic — Landing Page & Booking Flow Migration Plan

**Status:** Planning document only. No implementation has started. No repository changes have been made.
**Current execution state:** Plan creation only. Do not execute Phase 0 or any other phase until explicit approval is given.

**Scope:** Public landing page + booking flow, per the new Figma design (`uAHSgG9yvEIj2eB3IZQDxg`, page "landing"). Dashboard/CRM, authentication, and backend infrastructure are explicitly out of scope.

---

## 0. Execution & Decision-Making Rules

These rules govern how every phase and sub-phase in §2 is carried out. They apply on top of, not instead of, everything else in this document.

**Execution rule — stop and ask before every phase and sub-phase:**

- Before starting each Phase or sub-phase in §2 (including granular ones like 3.0, 3.1, 4.1, 5.1, etc.), work stops and explicit approval is requested first.
- Completing a phase/sub-phase does **not** trigger automatic continuation into the next one — this holds even when the preceding phase's Visual QA report (§7) shows no issues. The next phase/sub-phase only starts once you explicitly say to proceed.

**Decision-making rule — no silent design/UX/architecture/business-logic decisions:**

- No design, UX, architecture, or business-logic decision is made silently during implementation.
- Where Figma, the existing code, or the requirements are ambiguous or underspecified, work stops at that point. The ambiguity is reported — what's unclear, the available options, and a recommendation — **before** any code is written to resolve it either way.
- This applies at any size of decision: a component boundary choice, a naming choice with behavioral implications, an inferred hover/focus state not shown in a static Figma frame, a business-rule interpretation (e.g., how "Day" vs. "Time" selection actually differ for the Abroad persona), or anything else not explicitly settled already.

---

## 1. Migration Strategy

This is an **additive, in-place migration**, not a rewrite. The existing Next.js static-export architecture, the `app/page.tsx` client-side state-machine routing (`landing` / `login` / dashboard), and the existing service-layer pattern all stay untouched at the mechanism level. We are replacing the **contents** of two existing components (`LandingPage.tsx`, `BookingWizard.tsx`) and **adding** a new layer of shared UI primitives and booking-domain components underneath them.

**Coexistence model:** the app is already cleanly split into two halves that meet only at `app/page.tsx`'s `AppContent` switch. Everything on the landing/booking side of that seam is in scope; everything on the dashboard side is frozen. The two halves share the _token layer_ (colors/typography, extended additively) but nothing else structurally.

**What migrates:** `LandingPage.tsx` (rebuilt section-by-section, not in one pass — see §2), `BookingWizard.tsx` (restructured into a controller + persona-flow components, one persona at a time), `app/landing.css` (superseded incrementally), design tokens in `tailwind.config.ts`/`globals.css` (extended additively), `BookingRequest` type (extended additively).

**What stays exactly as-is, and why:**

- Dashboard (all of it) — no Figma exists for it; touching it is scope creep with no design to implement against.
- Mock auth (`lib/auth.tsx`, `LoginPage.tsx`) — explicitly deferred to a future phase.
- Backend/infra (`lambda/`, `template.yaml`, CI/CD) — this migration is frontend-only.
- `app/page.tsx`'s routing mechanism — already does exactly what's needed.
- Pastel color tokens — still load-bearing for `Patient.color` in the dashboard.

**Core constraint governing every phase below:** each phase produces the smallest independently-verifiable slice of change. No phase bundles more than one section (landing) or more than one persona/step-group (booking) at a time. Nothing proceeds to the next slice until the current one is visually and functionally verified against Figma.

---

## 2. Implementation Phases (Incremental)

Per §0: no phase or sub-phase below begins without prior explicit approval, and none continues automatically into the next once complete — regardless of how clean its verification came back. Every phase/sub-phase that involves visual or UI implementation (Phases 2 through 6) concludes with a written Visual QA report in the format defined in §7; a bare "Visual QA completed" is not sufficient and does not satisfy the checkpoint.

### Phase 0 — Project Safety Checkpoint (read-only)

**Goal:** establish a known-good baseline without altering repository state.

**Actions permitted in this phase:**

- Confirm current git branch (`git status`, `git branch` — read-only).
- Confirm working tree is clean (no uncommitted changes lost or hidden).
- Record a baseline: current `npm run build` succeeds, and a manual walkthrough of every dashboard page is documented (screenshots or notes) as the regression reference.

**Actions explicitly NOT permitted without separate explicit approval:**

- Creating a new branch.
- Creating a tag.
- Creating a commit.
- Any other git write operation.

If a checkpoint commit/branch/tag is judged useful at this or any later phase, it is **recommended** in this document and flagged to you for a decision — it is never created automatically as part of executing a phase.

**Dependencies:** none.
**Outcome:** a documented baseline exists; repository is untouched.
**Verify before continuing:** baseline build succeeds; baseline dashboard walkthrough documented; current branch and clean/dirty status confirmed and noted.

#### Phase 0 Completion Record

- **Current branch:** `smart-clinic-1july`.
- **Initial git status:** two pre-existing uncommitted items found (not created by Phase 0 work) — modified `.claude/settings.local.json`; untracked `clinic-crm/SMART_CLINIC_MIGRATION_PLAN.md`.
- **`npm ci`:** run after explicit approval to unblock dependency-less environment; confirmed it did not modify `package.json` or `package-lock.json`.
- **`npm run build`:** **SUCCESS.**
- **Existing warnings found** (pre-existing, not introduced by Phase 0): `app/page.tsx` `useEffect` missing-dependency (`page`) ESLint warning; `layout.tsx` metadata `viewport` should move to a separate `viewport` export (Next 15 convention).
- **Dashboard walkthrough:** partially verified only — dev server starts and the landing page server-renders correctly with no errors; full interactive click-through (mock login → dashboard pages → logout) still **not verified**, due to no browser-automation tool available in this environment.
- **Repository integrity:** confirmed no tracked files were changed during Phase 0.

---

### Phase 1 — Design System Foundation

**Goal:** land the new color scale and typography scale as additive tokens only.

**Involves:** `tailwind.config.ts`, `app/globals.css` (Google Fonts import extended to cover the Thin/ExtraBold weights the new type scale needs).

**Dependencies:** Phase 0 baseline recorded.

**Outcome:** new semantic tokens (primary/secondary/neutral/red/success/warning scales, type scale) exist alongside the untouched pastel tokens. No component consumes them yet — nothing visually changes. (Note: the neutral scale is deliberately named `neutral`, not `gray`, to avoid colliding with Tailwind's built-in default `gray-*` palette, which one existing dashboard file — `PatientsPage.tsx` — relies on.)

**Verify before continuing:** `npm run build` and `tsc --noEmit` clean; dashboard renders pixel-identical (tokens are additive and unused); new token hex values spot-checked against the Figma-sampled values (blue-500 `#203aa2`, neutral-900 `#2b2f38`, red-500 `#f04438`, etc.).

---

### Phase 2 — Shared UI Primitives

**Goal:** build the design-system component layer in isolation, before any real page uses it.

**Involves (new):** `Button`, `Input` (all Figma states), `Card`, `SectionHeading`, `StatusScreen`, `Modal`, `StepperIndicator`, `IconCard`.

**Dependencies:** Phase 1 tokens.

**Outcome:** a self-contained component set that nothing currently running imports — zero risk to the live app.

**Verify before continuing (Visual QA — see §7 for full checklist):** each primitive checked individually against its corresponding Figma state; RTL rendering confirmed; no page wired to these yet.

---

### Phase 3 — Landing Page (split into one section per step)

The Landing Page is **not** implemented in one pass. Each sub-phase below is implemented, verified against Figma (§7), and reviewed before the next one starts.

**Phase 3.0 — Foundation/layout shell**
Goal: the empty page skeleton — root layout container, section-mounting structure, no visible content sections yet beyond placeholders.
Files: `components/pages/LandingPage.tsx` (skeleton), `app/landing.css` or Tailwind-only structure (decided here).
Verify: page mounts, RTL root direction correct, no console errors, placeholders visible in the right order.

**Phase 3.1 — Header/Navbar**
Goal: logo, nav links, phone number, support button.
Verify: matches Figma navbar exactly; sticky behavior; RTL element order (logo right, nav left, per Figma).

**Phase 3.2 — Hero section**
Goal: headline, subhead, background photo; booking entry point **stubbed** (not wired to real booking logic yet — that's Phase 4+).
Verify: headline copy/typography matches; photo treatment matches; stub clearly non-functional (no partial booking logic leaking in early).

**Phase 3.3 — About/Doctor bio section**
Goal: heading, role, intro paragraph, 2×2 specialty badge checklist with updated copy.
Verify: copy matches new Figma text exactly (specialties changed from current three badges to four).

**Phase 3.4 — Services section**
Goal: heading + subhead, 2×2 `IconCard` grid with the recategorized services and new icon set.
Verify: new service categories/icons match Figma (not the old adult/child/anxiety/sleep set).

**Phase 3.5 — Contact section**
Goal: heading + subhead, 2×2 info-card grid (phone, address, hours, email — hours and email are new additions).
Verify: all four cards present and correctly populated; dark/glass tone over photo background matches Figma.

**Phase 3.6 — Footer**
Goal: social icons, nav links, logo, copyright, staff-login trigger.
Verify: staff-login trigger still works exactly as today (Alt+L / footer button → `onLogin`).

**Dependencies:** Phase 2 primitives. Each sub-phase depends only on the previous sub-phase being verified, not on later ones.

**Outcome of Phase 3 as a whole:** a fully static, visually-complete landing page matching Figma, with the booking entry point still stubbed.

---

### Phase 4 — Booking Flow Architecture + New Patient Persona Only

The booking flow is implemented **one persona at a time**. New Patient is first because it has no OTP/region branching — the simplest possible slice to validate the controller pattern itself.

**Phase 4.0 — Controller skeleton**
Goal: `useBookingFlow` hook/reducer, mock service scaffold (see §5), persona-entry step only (the "پرونده ثبت شده ندارم/دارم" choice), no downstream steps yet.
Verify: entry step renders and the choice is capturable in state; nothing beyond that exists yet.

**Phase 4.1 — New Patient intake**
Goal: intake form step (name, phone, referrer, reason) wired to the mock service's validation.
Verify: field-level states (Default/Filled/Error) match Figma Input spec; duplicate-name error message matches Figma copy exactly.

**Phase 4.2 — New Patient review + terminal states**
Goal: "Info completed" review step, then Success / Error response / No-service terminal screens.
Verify: all three terminal states individually triggered and checked against Figma's `StatusScreen`-equivalent designs; mock submission produces an inspectable, correctly-shaped object.

**Dependencies:** Phase 2 primitives, Phase 3.2 (hero entry point exists to launch from).
**Outcome:** the entire New Patient persona works end-to-end against the mock service, independently of any other persona.

---

### Phase 5 — Existing Patient Personas (Iran, then Abroad — never together)

**Phase 5.0 — Existing Patient shell + Iran flow**
Goal: Code verification step (OTP) + Wrong-code state, then Date + Time selection, then Checkout, then terminal states — for the Iran region only.
Verify: OTP success and Wrong-code paths both individually demonstrated; date/time selection matches Figma; no timezone step present (correct for Iran).

**Phase 5.1 — Abroad extension**
Goal: extend the _same_ Existing Patient shell (not a copy) with the Timezone step and Day-selection variant for the Abroad region.
Verify: Iran flow still works unmodified after this extension (regression check on 5.0); Timezone combobox (search + selection) matches Figma; Day-vs-Time distinction matches Figma states.

**Dependencies:** Phase 4 controller pattern proven out. Phase 5.1 depends on 5.0 being verified first — Abroad is never started before Iran is confirmed working.
**Outcome:** both existing-patient regions work end-to-end, sharing one component, with each verified independently before the next was added.

---

### Phase 6 — Integration & Polish

**Goal:** connect the stubbed hero/service-card entry points from Phase 3 to the real controller from Phases 4–5; reconcile leftover duplication.

**Involves:** `LandingPage.tsx` CTA wiring, `lib/utils.ts` / `lib/jalali.ts` reconciliation (see §3), full copy/asset pass.

**Dependencies:** Phases 3, 4, and 5 all individually verified.

**Outcome:** the complete new landing + booking experience is live end-to-end.

**Verify before sign-off:** full manual walkthrough of all three personas and every terminal state; full dashboard regression pass (§4 of prior review, retained below); `npm run build` clean.

---

## Execution Log

Concise, chronological history of completed phases — one short entry per phase, added as each is approved. Full working detail for a phase lives inline under its entry above; this log is the at-a-glance record of what actually happened.

### Phase 0 — Project Safety Checkpoint
**Status:** Completed. Full detail recorded in the "Phase 0 Completion Record" under Phase 0 above (branch, initial git status, `npm ci`, build result, dashboard walkthrough status).

### Phase 1 — Design System Foundation
**Status:** Completed.

**Files changed:** `app/globals.css`, `tailwind.config.ts`.

**Main outcome:** New semantic color tokens (`primary`, `secondary`, `neutral`, `red`, `success`, `warning`, 50–900 each) and a new typography scale (`tiny`/`small`/`caption`/`body`/`h6`–`h1`) added as additive tokens alongside the untouched pastel tokens — no component consumes them yet. Google Fonts import extended to include the Thin/ExtraBold Vazirmatn weights the new scale requires.

**Important decision made:** the new neutral color scale was named `neutral`, not `gray`, after discovering it would otherwise override Tailwind's built-in default `gray-*` palette — which the (out-of-scope) dashboard's `PatientsPage.tsx` relies on for its inactive-patient badge. Renaming resolved the collision without touching any dashboard file.

**Verification results:** `npm run build` and `npx tsc --noEmit` both passed clean, re-verified after the rename.

**Remaining pre-existing warnings (unrelated to this phase, not fixed):** an `app/page.tsx` `useEffect` missing-dependency warning, and a `layout.tsx` metadata `viewport` deprecation warning.

### Phase 2 — Shared UI Primitives (partial: 5 of 8)
**Status:** Completed for 5 of 8 primitives; 3 deferred to a follow-up Phase 2b by explicit decision.

**Files created:** `components/ui/Button.tsx`, `components/ui/Input.tsx`, `components/ui/Card.tsx`, `components/ui/Modal.tsx`, `components/ui/StepperIndicator.tsx`.

**Main outcome:** Five isolated, unwired UI primitives built against real Figma component/instance evidence (not the color/typography swatch sheets this time, but actual Button/Input/Progress-Bar/Card nodes pulled directly). All five consume Phase 1's tokens (`primary`, `neutral`, `red`, `success`, `text-body`/`text-tiny`, etc.) and import nothing from `components/pages/`, `components/layout/`, `lib/auth`, or `lib/dynamodb` — confirmed by grep. Nothing in the repo imports `components/ui/` yet; `LandingPage.tsx` and `BookingWizard.tsx` are untouched.

**Why only 5 of 8:** Figma's MCP tool-call rate limit was hit mid-phase, after obtaining solid ground truth for Button, Input, the wizard's Card/Modal shell, and StepperIndicator, but before `StatusScreen`, `IconCard` (and the landing-page service/contact card treatment specifically), and `SectionHeading` could be pulled. Rather than fabricate specs for those three from low-resolution screenshots alone, this was raised explicitly and you chose to build only the grounded five now, deferring the rest to a follow-up phase once Figma access/quota allows.

**Important decisions/judgment calls made (all flagged in the full Visual QA report, not silently resolved):**
- `Input`'s darker-border state is triggered by focus, not literal value-presence, despite Figma naming it "Filled" — chosen for accessibility; flagged for your review.
- `Input`'s Timezone/Time-zone-selected states were *not* folded into this primitive — recommended as a separate future `TimezoneCombobox` component instead, since they're a structurally different (searchable dropdown) widget.
- `Modal`'s backdrop/dismiss behavior has no Figma source (static frames don't show it) — carried over from the current app's existing `.bw-overlay` pattern as a disclosed judgment call, along with reusing the pre-existing `shadow-lg` token since no Figma-exact modal shadow was obtained.
- `StepperIndicator`'s connector-line color reproduces Figma's literal (slightly off-palette) `#c6c6c6` rather than silently rounding it to the nearest `neutral-*` token; its "current" step's animated inner asset is approximated as a static dot.
- `Card` only reproduces the booking-wizard's own shell (`24px` padding / `16px` radius) — it is explicitly *not yet* the landing-page service/contact card design, which is part of the deferred `IconCard` work.

**Discovery relevant to future phases:** the real Iran-flow progress bar has 5 steps, including a "پرداخت" (Payment) step not previously identified in the architecture-discovery report — worth revisiting when Phase 5 is planned.

**Verification results:** `npm run build` and `npx tsc --noEmit` both passed clean; output bundle size unchanged from baseline, confirming nothing is wired in yet. Repo-wide grep confirmed zero references to `components/ui/` outside itself.

**Decision (2026-07-20): Phase 2b canceled — `StatusScreen`, `IconCard`, `SectionHeading` are not standalone shared primitives in this migration.** Reasoning: they don't block Phase 3+, and their exact Figma specs aren't available right now (Figma MCP rate limit). Unlike the rest of `components/ui/`, these three are **not** deferred-but-still-planned as reusable primitives. If their visual pattern is needed during Phase 3/4/5, it is implemented **locally within the relevant page/domain component** (e.g. inline markup inside `LandingPage.tsx`'s services/contact sections, or inside the Phase 4.2 terminal-state step component) rather than factored into `components/ui/`. A standalone shared primitive is only created later if a real cross-location reuse requirement actually appears — and that would be a new, explicit decision at that time, not an assumed default. This plan and the session handoff are the durable record of this decision — no further flagging needed elsewhere.

### Phase 3.0 — Landing Page Foundation/Layout Shell
**Status:** Completed (2026-07-20).

**Files changed:** `components/pages/LandingPage.tsx` (full rewrite of internals; same external props contract — `onLogin`, `onBookingSubmit` unchanged).

**Decision made before starting (per §0, surfaced to you rather than assumed):** styling convention for the new landing page. You chose **Tailwind-only** — new markup uses only Tailwind utility classes plus Phase 1's design tokens; `app/landing.css` is no longer imported by the new component (the file itself is untouched on disk, nothing else in the repo imports it, per the "preserve until final validation" rule in §3).

**Main outcome:** the old, fully-built landing page markup (real nav, hero with embedded `BookingWizard`, about, services grid, contact, footer, urgent-request modal) was replaced with a minimal skeleton: a single RTL root container (`dir="rtl"`) holding six ordered, labeled placeholder sections (Navbar → Hero → About → Services → Contact → Footer), each just a dashed-border neutral-toned block naming the phase that will fill it in. No `BookingWizard` import, no modals, no real content — matching the Phase 3.0 goal of "no visible content sections yet beyond placeholders."

**Functional continuity preserved (judgment call, flagged not asked, because it's already a hard guarantee elsewhere in this plan — §6 Dashboard Protection Plan):** the `Alt+L` → `onLogin` keyboard shortcut was kept in the skeleton (pure JS, no visible UI) so the mock-login path to the dashboard stays reachable throughout Phase 3, even though the visible staff-login footer button itself doesn't return until Phase 3.6. The `Escape`-to-close-modal handler was dropped since no modals exist in the skeleton yet.

**Verification results:**
- `npx tsc --noEmit` — clean, no errors.
- `npm run build` — succeeds; only the two pre-existing, unrelated warnings remain (`page.tsx` `useEffect` dependency, `layout.tsx` viewport metadata) — no new warnings introduced.
- `npm run dev` + direct HTTP fetch of `/` — 200 response, dev server log shows a clean compile with no errors; server-rendered HTML confirms `dir="rtl"` on the root and all six placeholder sections present in the correct order (`navbar`, `home`, `about`, `services`, `contact`, `footer`).
- Full RTL-in-browser / visual click-through not yet done — see Visual QA report delivered alongside this entry for the detailed breakdown and what remains unverified (no visual design exists yet to compare against, by design of this sub-phase).

### Phase 3.1 — Header/Navbar + Hero (bundled by explicit request)
**Status:** Implemented and approved. Initially paused on a Figma access blocker (2026-07-20); resumed and completed in a later session via a manual screenshot-based workflow instead of Figma MCP, then refined and approved (2026-07-21/22).

**Scope note:** you explicitly approved 3.1 (Navbar) and 3.2 (Hero) together in one instruction ("Phase 3.1 (Header/Navbar + Hero)"), a deliberate exception to §2's default one-section-at-a-time granularity — noted here, not silently treated as the default going forward.

**Blocker hit initially on starting (2026-07-20):** first Figma MCP call (`get_metadata` on file `uAHSgG9yvEIj2eB3IZQDxg`) failed — "You've reached the Figma MCP tool call limit on the Starter plan." Same limit flagged as a risk after Phase 2. Unlike Button/Input/Card (Phase 2), Navbar/Hero had no pixel-verified Figma pull on record — the architecture report's §3 description of them is a narrative summary from screenshots (structure/copy/general layout only), not sampled spacing/padding/button-radius/overlay-opacity values. Building from that alone would have meant guessing real layout numbers, which the project had already chosen not to do (same reasoning as the Phase 2b cancellation). You initially chose to wait for the Figma MCP rate limit to reset rather than proceed on approximated specs.

**Resolution — manual screenshot-based workflow (later session):** rather than waiting further for Figma MCP access, you supplied screenshots, manual pixel measurements, and final production image/video/icon assets directly, and Navbar/Hero were built from that source instead of live Figma tool calls. This is a deliberate substitution of evidence source, not an approximation — the specs used (spacing, copy, asset choice) came from your direct input, not a guess. Recorded as a **difference in provenance** from the Figma-MCP-grounded Phase 2 primitives, not as a shortfall: Navbar/Hero are not pixel-verified against live Figma tool output the way Button/Input/Card were.

**Actual asset substitutions used (supersede the originally-recorded, never-used filenames below):**
- Logo: `public/logo.png` (not the originally-recorded `public/logo-2048-hq-transparent.png`, which was never present/used).
- Hero background: `public/Hero-background.mp4` (video) with `public/Hero-background.jpg` as `poster` (not the originally-recorded `public/3.mp4`, which was never present/used). Everything else (layout, spacing, typography, colors, overlay, composition) stays faithful to the supplied screenshots/measurements; only the background image is swapped for this video.
- Icons: `public/Phone, Call.svg` (phone number), `public/message-question-checkmark.svg` (support button), `public/Arrow.svg` (booking-card "بعدی" button).
- Old `public/hero.jpg` removed, superseded by the two files above.

**Final implementation:**
- **Navbar:** logo, nav links (خانه/خدمات/تماس با ما), phone number with icon, "پشتیبانی" support `Button` with icon. Replaces the Phase 3.0 placeholder.
- **Hero:** video background with poster, RTL headline/subhead, and the booking-entry card showing only the first booking-form screen as static UI (New-vs-Existing persona toggle, "بعدی" button disabled until a persona is picked) — no downstream steps, no `onBookingSubmit` wiring, matching the Phase 3.2 scope note that the entry point stays stubbed until Phase 4+.

**Visual refinement round, completed and approved (2026-07-21/22) — two corrections to the initial build:**
1. **Nav link color/hover behavior.** Root cause diagnosed: `app/globals.css` has global `a { color: var(--accent) }` / `a:hover { text-decoration: underline }` rules declared outside any `@layer` block; under Tailwind v3's cascade-layers compilation, unlayered CSS wins over layered utility classes regardless of specificity, so the plain `hover:text-primary-500`/`hover:no-underline` utilities were silently losing — links rendered blue by default (matching `--accent`) with an underline on hover, instead of black-default/primary-blue-hover/no-underline. Fixed at the anchor level in `LandingPage.tsx` only (the shared `globals.css` was deliberately left untouched, since it affects the whole app) using Tailwind's `!important` modifier: `!text-black`, `hover:!text-primary-500`, `hover:!no-underline`. Verified directly in the compiled CSS served by the dev server.
2. **Hero text shadow.** Originally implemented with a `drop-shadow-[...]` filter utility, which wasn't producing the intended visible effect; replaced on the heading with a literal `[text-shadow:0_6px_17px_rgba(0,0,0,0.49)]` arbitrary-property utility (X 0 / Y 6px / blur 17px / color `#000000` / opacity 49%), verified in compiled CSS. **Flagged:** the subtext's shadow value now differs from the heading's (`0 6px 7px rgba(0,0,0,0.65)` vs. the heading's `0 6px 17px rgba(0,0,0,0.49)`) due to an edit made outside the corrective session, rather than the single shared value originally specified — recorded as the current actual state, not silently normalized.

**Verification (2026-07-22, after the refinement round):** `npx tsc --noEmit` clean; `npm run build` succeeds with only the same two pre-existing, unrelated warnings (`page.tsx` `useEffect` dependency, `layout.tsx` viewport metadata); dev server started and the actual compiled CSS it served was inspected directly (not just class names in markup) to confirm the `!important` nav rules and the heading's `text-shadow` rule compiled exactly as intended.

**Not yet done:** a written Visual QA report in the full §7 format (what was implemented / Figma-or-reference states compared / what was checked / mismatches / remaining uncertainty) has not been produced for this sub-phase, despite approval having been given informally through iterative review. Full side-by-side or overlay visual comparison against the supplied screenshots has not been logged either — flagged as an open item, not silently skipped.

### Phase 3.3 — About/Doctor Bio Section ("Section 2")
**Status:** Implemented and approved (2026-07-22).

**Source:** manual screenshot-based workflow, same pattern as Phase 3.1/3.2 — built from your supplied reference screenshot (`public/section2.png`) and an exact manual specification (frame size, distances, font/size/color per element), not from Figma MCP.

**Final implementation:**
- Full-width `<section id="about">`, `436px` fixed height, `0px` gap from the Hero section above it (plain sibling stacking, no margin).
- Background: a top-to-bottom **linear** gradient between `#ffffff` and `#CCD7FF`.
- Heading "دکتر محمد مهدی اسماعیل‌زاده پوریا" — Vazirmatn Medium, `text-h3` (40px/44px line-height per the existing type scale), centered, `56px` from the section top, `neutral-900`.
- Subtitle "متخصص روان‌شناس سلامت | عضو هیئت علمی دانشگاه" — Vazirmatn Light, `text-h5` (24px), centered, `neutral-700`, positioned below the heading.
- Intro line "روان‌درمانگر از سال ۱۳۸۰، با تمرکز بر:" — Vazirmatn Light, `text-h5` (24px), centered, `neutral-900`, pinned `200px` from the section top per spec.
- 2×2 feature grid — رویکردهای اگزیستانسیالیسم / طرح‌واره درمانی اختلالات روانی و شخصیتی / زوج‌درمانگر و خانواده‌درمانگر / روان‌درمانگر سرطان (سایکوآنکولوژیست) — Vazirmatn Medium, `text-h5` (24px), `neutral-900`, each paired with a `/Check-one.svg` icon (24×24px, 8px gap), icon rendered to the **right** of its text (RTL), matching the reference screenshot.
- All text in the section uses `leading-[150%]`.

**Correction applied during review (only the corrected/final version is recorded as the implementation):** the first pass used a radial gradient and placed the check icons to the left of their text. Per your explicit correction this was changed to: (1) a linear gradient using the same two colors, (2) icons swapped to the right side of their text with the same 8px spacing, and (3) `leading-[150%]` applied to all text in the section. The rejected radial/icon-left intermediate is not part of the recorded implementation.

**Verification (2026-07-22):** `npx tsc --noEmit` clean; `npm run build` succeeds with only the same two pre-existing, unrelated warnings (`page.tsx` `useEffect` dependency, `layout.tsx` viewport metadata) — no new ones. Rendered and visually sanity-checked in-browser at the 1440px desktop viewport.

**Flagged, not yet explicitly confirmed:** the feature grid's column/row gaps and its vertical offset from the section top were not given as exact pixel values in the spec (only "use the layout shown in the screenshot" for that part) — these were inferred from the screenshot's proportions, consistent with the rest of the design system's existing type scale, but not pixel-sampled. A written §7-format Visual QA report has not been produced for this sub-phase, same open item as 3.1/3.2.

### Phase 3.4 — Services Section ("Section 3")
**Status:** Implemented and approved (2026-07-22), on first pass — no correction round needed.

**Source:** manual screenshot-based workflow, same pattern as 3.1–3.3 — built from your supplied reference screenshot (`public/section3.png`) and an exact manual specification (frame size, distances, font/size/color per element, card/icon geometry), not from Figma MCP.

**Final implementation:**
- Full-width `<section id="services">`, `683px` fixed height, `0px` gap from Section 2 (About) above it, white background.
- Heading "خدمات تخصصی کلینیک روان‌درمانی پوریا" — Vazirmatn Medium, 40px, `leading-[150%]` (explicit arbitrary value, not the `text-h3` token, since the token's fixed 44px line-height doesn't match the spec's literal 150% requirement), centered, `55px` from the section top, `neutral-900`.
- Subtitle "با بهره‌گیری از آخرین دستاوردهای علمی در حوزه روان‌شناسی، خدمات جامع و متنوعی را به شما ارائه می‌دهیم" — Vazirmatn Light, 24px, `leading-[150%]`, centered, `neutral-700`, `8px` below the heading (same line-height-arithmetic stacking approach used in Phase 3.3).
- Two decorative images, non-interactive (`pointer-events-none`): `/big-flower.jpg` (215×732px) at raw canvas position `left:1231px / top:-24px`; `/little-flower.jpg` (246×339px) at `left:-13px / top:355px`. Positioned via literal `left`/`top` (not RTL-mirrored `right`), since the spec's x/y values are raw design-canvas coordinates, not text-flow-relative offsets — confirmed by the numbers themselves (`x:1231` for a 215px-wide element in a 1440px frame lands its right edge almost exactly at the frame's right edge, matching the screenshot's right-bleeding flower).
- A 2×2 grid of four cards, `540×188px` each, `8px` border-radius, `1px solid neutral-100` border, `box-shadow: 0 6px 20px rgba(0,0,0,0.04)`, `24px` gaps on both axes, first row `223px` from the section top, the whole grid (`1104px` wide) centered using the same `168px` side-margin convention already established in the Hero section (`1440 − 1104 = 336`, `/2 = 168`).
- Each card: a 40×40px icon at `24px` from top/right (`/Brain.svg`, `/People.svg`, `/Family.svg`, `/Person-heart.svg` — each SVG already carries its own stroke color and `neutral-50` rounded-square background baked in, matching the screenshot exactly, so no extra styling was needed); a title (Vazirmatn Medium, 24px, `leading-[150%]`, `neutral-900`) at `24px` right / `72px` top; a description (Vazirmatn Light, 16px, `leading-[150%]`, `neutral-700`, `492px` wide — exactly the card's inner content width, `540 − 24 − 24`) at `24px` right / `116px` top.
- Card content, copied verbatim from the screenshot, in screenshot order (RTL grid: first item top-right, second top-left, third bottom-right, fourth bottom-left): روان‌درمانی اختلالات روانی (Brain) / درمان اختلالات شخصیتی (People) / زوج‌درمانی و خانواده‌درمانی (Family) / مشاوره قبل از ازدواج (Person-heart).

**Flagged, not a correction — asset filename mismatch:** the spec named `big-flower.png`/`little-flower.png`; only `.jpg` versions of these files exist on disk (no `.png` versions present). Used the actual `.jpg` files, consistent with how the Phase 3.1 logo/hero-video filename substitutions were previously handled.

**Flagged, inferred rather than given:** the card shadow's exact blur radius (spec said "match the screenshot," no number given) was estimated at 20px; the section's white background wasn't stated explicitly in the spec text and was read directly from the provided screenshot. Both are visual judgment calls made from the screenshot itself (which the spec explicitly authorized as a source), not numeric values from the written spec — not yet explicitly confirmed by you.

**Verification (2026-07-22):** `npx tsc --noEmit` clean; `npm run build` succeeds with only the same two pre-existing, unrelated warnings — no new ones. Rendered and visually sanity-checked in-browser at the 1440px desktop viewport; card layout, icon colors, and copy confirmed against the reference screenshot.

**Not yet done:** a written §7-format Visual QA report has not been produced for this sub-phase, same open item as 3.1–3.3.

### Phase 3.5 — Contact Section ("Section 4")
**Status:** Implemented and approved (2026-07-22), after one correction round.

**Source:** manual screenshot-based workflow, same pattern as 3.1–3.4 — built from your supplied reference screenshot (`public/section4.png`) and an exact manual specification, not from Figma MCP. Unlike Phase 3.4, all asset filenames named in the spec (`section-background.png`, `Clock.svg`, `Emails.svg`, `Pin.svg`, `Phone 2.svg`) matched what's actually on disk — no substitution needed.

**Final implementation:**
- Full-width `<section id="contact">`, `642px` fixed height, `0px` gap from Section 3 (Services) above it.
- Background: `/section-background.png` (`bg-cover bg-center`) with a black overlay div on top (`bg-black/50` on disk currently — see flagged deviation below).
- Heading "در تماس باشید" — Vazirmatn Medium, 40px, `leading-[150%]` (explicit arbitrary value, same reasoning as Phase 3.4 — the `text-h3` token's line-height doesn't match the spec's literal 150%), centered, `42px` from the section top, white.
- Subtitle "پاسخگوی سوالات شما هستیم" — Vazirmatn Light, 24px, `leading-[150%]`, centered, white, `8px` below the heading (line-height-arithmetic stacking, same approach as Phase 3.3/3.4).
- A 2×2 grid of four glassmorphism cards, `352px` wide (height `152px` on disk — see flagged deviation below), `8px` border-radius, `0.5px solid #D3D7DC` border at 60% opacity, `bg-white/[0.13]` fill, `backdrop-blur-[47px]`, `24px` gaps on both axes, first row `210px` from the section top, grid centered.
- Each card: a `32×32px` icon wrapper (same border/fill treatment as the card, no blur — blur wasn't specified for the wrapper, only for the card) holding a centered `24×24px` icon, positioned `16px` from the card top; a title (Vazirmatn Light, 16px, `leading-[150%]`, white, centered) below the icon; a value area (Vazirmatn Medium, 16px, `leading-[150%]`, white, centered, `319px` wide where applicable) below the title.
- Card order/content, final (right-to-left, top-to-bottom): آدرس کلینیک (`/Pin.svg`) / شماره تماس (`/Phone 2.svg`) / پست الکترونیک (`/Emails.svg`) / ساعات پذیرش (`/Clock.svg`), all copied verbatim from the screenshot.
- "ساعات پذیرش" (hours) card renders two label/value rows instead of the other cards' single centered value line — each row's day-label anchored to the card's right edge and hour-range anchored to the left edge, both `16px` inset from their respective edges, matching the screenshot's two-column arrangement.

**Correction round, completed and approved — three fixes to the initial build (only the corrected/final version is recorded as the implementation):**
1. **Card order.** First pass read the screenshot as شماره تماس / آدرس کلینیک / ساعات پذیرش / پست الکترونیک (right-to-left, top-to-bottom) — a misreading. Corrected per your explicit instruction to آدرس کلینیک / شماره تماس / پست الکترونیک / ساعات پذیرش.
2. **Hours-card layout.** First pass rendered the hours card as one centered two-line paragraph. Corrected to two label/value rows, day-label right-aligned 16px from the right edge, hour-range left-aligned 16px from the left edge, per your explicit instruction and the screenshot's actual two-column layout.
3. **Border thinness.** Card and icon-wrapper borders visually too heavy at full-opacity `#D3D7DC`; changed to 60% opacity (width unchanged at `0.5px`) per your explicit instruction, to better match the screenshot's subtler line weight.

**Flagged, literal-spec-value judgment call:** the spec's "Background blur: 47%" is not a valid CSS length for `backdrop-filter: blur()` (which requires a length, not a percentage). Implemented as `47px` — the most plausible reading, since Figma's own "Background blur" effect panel is normally expressed in px. Not yet explicitly confirmed by you.

**Flagged, deviation from written spec found on disk (not part of the corrective round, not reverted):** card height is currently `152px` (spec said `144px`); the black overlay is currently 50% opacity (spec said `20%`); title/description top offsets shifted a few px accordingly. These changed outside the conversation turns that requested the three corrections above — recorded as the actual current state; flag for your review in case any weren't intentional.

**Verification (2026-07-22):** `npx tsc --noEmit` clean; `npm run build` succeeds with only the same two pre-existing, unrelated warnings — no new ones. Rendered and visually sanity-checked in-browser at the 1440px desktop viewport after the correction round.

**Not yet done:** a written §7-format Visual QA report has not been produced for this sub-phase, same open item as 3.1–3.4.

### Phase 3.6 — Footer
**Status:** Implemented and approved (2026-07-22), after one correction round. **This completes Phase 3 (the entire static landing page) end to end** — the outcome defined for Phase 3 as a whole in §2 is now met, with the booking entry point still stubbed per the Phase 3.2 scope note.

**Source:** manual screenshot-based workflow, same pattern as 3.1–3.5 — built from your supplied reference screenshot (`public/Footer.png`) and an exact manual specification, not from Figma MCP.

**Final implementation:**
- Full-width `<section id="footer">`, `320px` fixed height, white background, `15px` gap above it from Section 4 (Contact) — the only non-zero section-to-section gap on the page.
- Logo (`/logo.png`, `128×51px`) at `80px` from top / `80px` from right.
- Nav links خانه / خدمات / تماس با ما — Vazirmatn Regular, 16px, `leading-[150%]`, black, `94px` from the top, centered as a group with `32px` (`gap-8`) spacing between links — the same spacing already used for the identical link set in the header.
- Social icons row at `94px` from top, `12px` gap between `Instagram.svg`/`LinkedIn.svg` (`24×24px` each).
- Divider: `1280px` wide, `1px solid black`, centered, `187px` from the top.
- Copyright "تمام حقوق وبسایت کلینیک روان‌درمانی پوریا محفوظ است." — Vazirmatn Regular, 14px, `leading-[150%]`, black, centered, `219px` from the top.
- The `SectionPlaceholder` helper component (used since Phase 3.0 for not-yet-built sections) was removed in this same edit — it had no remaining call sites once the Footer replaced the last placeholder. This is dead-code removal tied directly to completing Phase 3, not a separate refactor decision.

**Flagged, not independently enforced:** the spec gave two nav-link positioning facts — "centered within the footer" and "the rightmost link is 409px from the logo." These are largely consequential of one another (a centered nav's distance from a right-anchored logo is a derived value, not an independent constraint), so only the stated "centered" alignment was implemented directly; the 409px figure was not separately hard-coded. Not yet explicitly confirmed by you.

**Correction round, completed and approved — three fixes to the initial build (only the corrected/final version is recorded as the implementation):**
1. **Social icon order.** DOM order determines left/right placement in an RTL flex row; the first pass placed Instagram first in the DOM, which rendered it on the right, not matching the screenshot's Instagram-on-the-left arrangement. Corrected by swapping DOM order (LinkedIn first, Instagram second), which renders Instagram at the required 80px-from-left position with LinkedIn to its right — per your explicit correction.
2. **Social icons made clickable.** Both wrapped in plain `<a href="#">` (no added classes, sizing/spacing unchanged) as placeholder links, per your explicit request — real destination URLs to be supplied later.
3. **Nav link hover behavior.** Same root cause and fix as the Phase 3.1 header-nav correction: `app/globals.css`'s unlayered `a { color: var(--accent) }` / `a:hover { text-decoration: underline }` rules beat plain Tailwind utilities regardless of specificity. Added `hover:!text-primary-500 hover:!no-underline` (the `!text-black` default was already in place from the initial build) per your explicit request. Verified in the actual compiled CSS served by the dev server — a single shared `.hover\:\!text-primary-500:hover` rule, since Tailwind dedupes identical utility classes across the header's and footer's six links combined.

**Notable non-code incident during this phase (root-caused, not a defect in the delivered code):** mid-phase, you reported the page had "lost all styling" after a manual edit. Investigation traced this to `.next` build-cache corruption — `npm run build` was being run repeatedly for verification while the long-running `npm run dev` server was simultaneously active, and the two processes writing to the same `.next` directory corrupted the dev server's webpack module cache (symptoms: `Cannot find module './611.js'`, `__webpack_modules__[moduleId] is not a function`, HTTP 500 on every route). `LandingPage.tsx` and the rest of the component tree built cleanly on their own throughout — confirmed via a standalone `npm run build` before touching anything. Fixed by stopping the dev server, deleting `.next`, and restarting clean; no source file was reverted or altered as part of that fix. Verification process adjusted for the remainder of this phase: the dev server is now stopped before each `npm run build` check and restarted (with `.next` cleared) afterward.

**Verification (2026-07-22):** `npx tsc --noEmit` clean; `npm run build` succeeds with only the same two pre-existing, unrelated warnings — no new ones, reconfirmed after each of the three corrections. Rendered and visually sanity-checked in-browser at the 1440px desktop viewport after each round.

**Not yet done:** a written §7-format Visual QA report has not been produced for this sub-phase, same open item as 3.1–3.5. With Phase 3 now complete, a consolidated Phase-3-wide Visual QA pass (all six sub-phases together) has also not been produced.

### Phase 4.0 — Booking Controller Skeleton
**Status:** Completed (2026-07-22).

**Files created:** `components/booking/useBookingFlow.ts` (persona-only `useReducer` hook); `lib/mock/bookingService.ts` (scaffold — `BookingServiceApi` interface with `submitBooking`/`verifyOtp`/`lookupPatientByPhone`, each a stub that throws "not implemented yet").
**Files changed:** `components/pages/LandingPage.tsx` — Hero persona buttons rewired from a local `useState<Persona>` to `useBookingFlow`'s `state.persona` / `setPersona`; no markup, class, or copy changes.

**Decision surfaced before implementing (per §0):** the mock service scaffold's scope was ambiguous — §5 describes the eventual `bookingService` shape, but the real payload/return types for `submitBooking`/`verifyOtp`/`lookupPatientByPhone` depend on form fields not decided until Phase 4.1/4.2/5.0. Raised explicitly; you chose to declare the full `BookingServiceApi` interface now with stub bodies (throwing "not implemented yet") rather than an in-memory-store-only scaffold with no methods. No method's real payload/return type is committed by this — each is filled in as its phase lands.

**Main outcome:** `useBookingFlow` holds `{ persona: 'new' | 'existing' | null }` with a single `SET_PERSONA` action, exposed as `{ state, setPersona }`. The `BookingPersona` type moved out of `LandingPage.tsx` (was page-local) into the hook module, since persona selection is now controller-owned state, not page UI state. No downstream steps (intake, review, terminal states, OTP) exist yet — matches the Phase 4.0 scope exactly.

**Verification:**
- `npx tsc --noEmit` — clean.
- `npm run build` — succeeds; same two pre-existing, unrelated warnings, no new ones.
- Browser-based check (dev server, real DOM click events on the persona buttons, no visual regression tooling): initial state confirmed (neither button selected, "بعدی" disabled); clicking each persona button flips selection exclusively and enables "بعدی"; captured class strings before/after matched the pre-existing Tailwind classes exactly, confirming the rewiring introduced no visual change and that `useBookingFlow`'s reducer state is what drives the UI.

**Not yet done:** intake form, review step, terminal states, and the mock service's actual method implementations — all deferred to Phase 4.1/4.2 per plan. No §7-format Visual QA report produced (same open item as Phase 3 — N/A here since no new visual design was introduced).

**Status: Approved (2026-07-26) — proceeded to Phase 4.1.**

### Phase 4.1 — New Patient Intake Step
**Status:** Completed and approved (2026-07-26).

**Files created:** `components/booking/NewPatientIntakeStep.tsx` — the intake form (heading, `StepperIndicator` at پرونده/done–اطلاعات/current–پیگیری/pending, four fields, قبلی/بعدی footer), built from `public/information.png`, `public/info-entered-and-error.png`, `public/Inputs.png`, `public/Default Reserve.png`.

**Files changed:** `components/booking/useBookingFlow.ts` — extended with `step` (`'entry' | 'new-intake'`), `newPatientIntake` form data, `newPatientIntakeErrors`, `isValidatingIntake`, and `goToNewIntake`/`goToEntry`/`setIntakeField`/`submitNewPatientIntake`; `lib/mock/bookingService.ts` — added `checkNewPatientName` (mock duplicate-name check, static fixture `['حسین ملکی']`, simulated latency, per §5's mock-data-layer priority); `components/ui/Input.tsx` — multiline textarea height corrected `180px`→`150px` to match the "Large Textarea" spec (first real consumer of this primitive); `components/ui/StepperIndicator.tsx` — step-label font corrected from the `tiny` (10px) token to `small` (12px/18px) to match the "Labels: 12px, line-height 150%" spec (also first real consumer); `components/pages/LandingPage.tsx` — Hero's booking-entry panel now resizes in place to show the intake step (see below); "بعدی" now advances only for the New Patient persona.

**Decision surfaced before implementing (per §0):** your Phase 4.1 instructions explicitly excluded "Review, Success/Error terminal flow, or any later phases," but also supplied terminal-state references (`request-error.png`, `request-success.png`, `no-service.png`, icon specs) — a direct conflict with the plan's own Phase 4.1/4.2 split. Raised explicitly; you confirmed intake-form-only for this phase. The intake form's "بعدی" therefore only runs the mock validation and is currently a dead end once it passes (no review step exists yet) — mirrors how the Hero entry point stayed a non-functional stub between Phase 3.2 and 4.0.

**UI architecture correction (approved, mid-phase):** the booking wizard's presentation changed from a centered `Modal` overlay (the original build, matching the architecture report's "expands into a modal" note) to an **in-place resize of the Hero's own booking panel** — no dimming/backdrop, no separate dialog; the panel itself grows to show the intake step, then shrinks back on "قبلی." This was an explicit correction you requested after reviewing the first (Modal-based) pass. The `Modal` primitive itself is untouched and still available; it's just not used by this step anymore.

**Sizing, iterated with your review:** entry/default panel corrected to the exact `524×212px` from `public/Default Reserve.png` (replacing an uncalibrated `524×236px` guess), with the "بعدی" button's offset corrected to `mt-[28px]` — both derived by pixel-sampling the reference image rather than eyeballing it. The New Patient intake panel's size/position were adjusted more than once after your review and are currently `524×712px` at `top-[34px]`, inside a Hero section you separately widened to `780px` tall (both changed directly in the file outside this conversation, superseding my last `650px`/`top-[8px]` values) — recorded here as the actual, approved current state.

**Mock validation:** `checkNewPatientName` simulates an async duplicate-name check (400ms) against a static fixture (`['حسین ملکی']`, the demo value used throughout the reference screenshots). "بعدی" stays disabled until name/phone/referrer are all non-empty, then runs the check and shows "این نام قبلا ثبت شده است" inline on the name field on a match — copy verified verbatim against `public/info-entered-and-error.png`. No error copy exists for an empty required field (Figma only shows the disabled-button state for that case) — a reasoned choice, not a silent assumption.

**Verification:** `npx tsc --noEmit` clean; `npm run build` succeeds with only the same two pre-existing, unrelated warnings. Interaction verified via browser automation end-to-end (persona selection → panel resize/reposition → field validation → duplicate-name error). One incidental `.next` build-cache corruption occurred mid-phase (same class of issue as the Phase 3.6 incident, different module number) from running `npm run build` while `npm run dev` was concurrently active — not a source defect; resolved by stopping the dev server, deleting `.next`, and restarting clean.

**Not yet done:** review step, terminal states (Success/Error/No-service), and `submitBooking`'s real implementation — all Phase 4.2 scope, deliberately excluded per your confirmation above.

**Status: Approved (2026-07-26) — proceeded to Phase 4.2.**

### Phase 4.2 — New Patient Review + Terminal States
**Status:** Completed and approved (2026-07-26). **This completes the entire New Patient persona end to end.**

**Files created:** `components/booking/NewPatientTerminalStep.tsx` — the three terminal screens (Success/Error/No-service), built from `public/request-success.png`, `public/request-error.png`, `public/no-service.png`, using `done.svg`/`xmark.svg`/`warning.svg` in a 48×48px/24px-radius colored wrapper (`success-50`/`red-100`/`warning-100`) per your supplied spec.

**Files changed:** `lib/mock/bookingService.ts` — `submitBooking` implemented for real (was a stub), returning `{status: 'success'|'error'|'no-service'}`; `components/booking/useBookingFlow.ts` — added a `new-terminal` step, `submitNewPatientIntake` now submits (not just validates) and routes to the matching terminal state, plus `retryIntake`/`resetBookingFlow`; `components/pages/LandingPage.tsx` — the same Hero booking panel (no modal) now also resizes to `524×220px` for terminal states, vertically centered the same way as the intake step (`top-[280px]` within the `780px` Hero section).

**Decision surfaced before implementing (per §0):** the architecture discovery notes describe a distinct "Info completed (review)" screen between the intake form and the terminal states, but none of the supplied screenshots show it. Raised explicitly; you confirmed **no review screen exists in the design** — submission goes directly from the intake form to a terminal state.

**Decision surfaced before implementing (per §0):** with no real backend, there was no rule to decide which terminal state a submission lands on. You approved: a static mock `onlineBookingEnabled` flag (forces No-service when false) plus two demo name-substring triggers, checked in this priority order — full name contains `ارور` → Error; else flag is off or name contains `تعطیل` → No-service; else → Success. (The trigger word and priority order were corrected once after your review — see bug-fix note below.)

**Terminal actions:** Success's "بازگشت" fully resets the booking flow back to the persona-choice entry screen (clears persona, intake data, errors). Error's "تلاش مجدد" returns to the intake step with entered data preserved (not cleared), letting the user edit and resubmit. No-service has no button at all, matching the reference screenshot exactly — a genuine dead end by design.

**Bug found and fixed post-implementation:** the first pass checked the no-service condition before the error trigger, and used the trigger word `خطا` instead of `ارور` — so Error was unreachable (a name meant to trigger it fell through to Success/No-service instead). Fixed in `lib/mock/bookingService.ts` only: swapped the check order (error checked first) and corrected the trigger word to `ارور`, per your exact specification. Re-verified all three states plus the both-triggers-present priority case afterward.

**Verification:** `npx tsc --noEmit` clean; `npm run build` succeeds with only the same two pre-existing, unrelated warnings. All four submission outcomes verified end-to-end via browser automation: plain name → Success; `ارور` → Error; `تعطیل` → No-service; both triggers present → Error (priority confirmed). Duplicate-name check (Phase 4.1) re-verified as an unaffected regression. `.next` cache corruption recurred once more during this phase (same root cause as Phase 3.6/4.1); resolved the same way, and `npm run build` was run with the dev server stopped for the remainder of the phase to avoid a third occurrence.

**Not yet done:** everything outside the New Patient persona — Existing Patient (Iran/Abroad), OTP, calendar/slot selection, payment, and dashboard integration remain Phase 5/6 scope, untouched.

**Status: implementation approved (2026-07-26) — proceeding to Phase 5.0 is pending your go-ahead.**

### Phase 5.0 — Existing Patient Shell + Iran Flow
**Status:** Completed and approved (2026-07-27), after one correction round. Iran only, per the confirmed sequencing decision — Abroad is Phase 5.1.

**Files created:** `lib/jalali.ts` — Jalali calendar math (adapted from the equivalent inline logic in `components/BookingWizard.tsx`, which stays untouched; duplication flagged for Phase 6 reconciliation, same note as Phase 4.0's Jalali-math item in §8's risk table); `components/booking/ExistingPatientCodeStep.tsx`, `ExistingPatientDateStep.tsx`, `ExistingPatientTimeStep.tsx`, `ExistingPatientCheckoutStep.tsx`, `ExistingPatientTerminalStep.tsx` — the five step screens for the Iran flow (Reference Code → Date → Time → Checkout → Terminal), built from `public/code.png`/`code-selected.png`, `public/iran-date.png`/`iran-date-selected.png`/`iran-date-picker.png`, `public/iran-time.png`/`iran-time-selected.png`, `public/iran-checkout.png`, and `public/iran-success.png`/`Error.png`.

**Files changed:** `lib/mock/bookingService.ts` — `verifyReferenceCode` and `submitAppointmentPayment` implemented for real (were Phase 4.0 stubs); `components/booking/useBookingFlow.ts` — extended with the full existing-patient state machine (reference-code verification, date/time selection, payment submission, retry); `components/pages/LandingPage.tsx` — the five new steps wired in, and the Hero booking panel (still no modal, same in-place-resize pattern as the New Patient persona) now also resizes/repositions per existing-patient step.

**Business-logic decision surfaced and resolved (per §0):** region (`'iran'` vs `'abroad'`) is resolved purely from the reference code — no separate region-detection step exists. Mock reference-code directory: `111111` → Iran patient; `222222` → Abroad patient (surfaces a "not implemented in this version" message, since Abroad itself is Phase 5.1 scope); `444444` → a dev-only demo code that resolves as the same Iran patient identity as `111111` but is hardcoded to always fail at the payment step, so the checkout Error terminal state is reachable on demand without a real payment gateway (same "reserved trigger" pattern as Phase 4.2's success/error/no-service triggers — region detection itself still comes from the code, the forced failure is a separate flag layered on top); anything else → invalid-code error.

**Self-tested before your review:** invalid code → inline error; `111111` → full booking flow to payment success; `444444` → payment failure → retry returns to checkout with selections preserved; `222222` → graceful not-implemented message; New Patient persona regression unaffected.

**Correction round, completed and approved — seven refinements requested after your review (only the corrected/final version is recorded as the implementation):**
1. **Calendar sizing.** Calendar popup card height `362px`→`372px`, and the overall date-selection panel height `630px`→`640px` — both `+10px`, to match the design more closely.
2. **Month navigation direction.** The left/right arrow functions were reversed from what the design requires; corrected so the right arrow (aligned above Saturday's column) steps to the previous month and the left arrow (aligned above Friday's column) steps to the next month, matching RTL reading order.
3. **Month/year pickers.** Clicking the month or year label (previously decorative carets only) now opens a scrollable dropdown list. Selecting a month keeps the current year and jumps to that month; selecting a year keeps the current month and jumps to that month in the new year. Year list bounded to today's year through `+5` years — a judgment call, since no Figma spec exists for this control and forward navigation itself has no stated upper bound; not yet explicitly confirmed by you.
4. **Future-only booking.** `isDayAvailable` (`lib/jalali.ts`) changed from "day ≥ today" to "day > today" — today itself is no longer bookable, only strictly future days. `getJalaliToday()` was already derived from the real system clock, so no separate fix was needed there.
5. **Arrow/weekday alignment.** The calendar header was restructured from a plain flex row to the same `grid-cols-7` structure used by the weekday-initials row and day-cell rows below it, so the right arrow's column lines up exactly with Saturday and the left arrow's column lines up exactly with Friday — including removing a small (~8px) header-only horizontal padding that had been offsetting the arrows from the grid's actual edges.
6. **Footer button position (Code + Date steps).** "قبلی"/"بعدی" changed from a fixed top margin to a flex-column layout with the button row pushed to the bottom via `mt-auto`, landing exactly 24px from the panel's bottom edge (via the panel's existing 24px padding) regardless of content height above.
7. **Payment Success screen.** The info table shifted a further 10px down (`mt-6`→`mt-[34px]`), and "بازگشت" repositioned using the same 24px-from-bottom treatment as point 6.

**`.next` build-cache corruption recurred a fourth time** (same root cause as Phase 3.6/4.1/4.2 — `npm run build` run for verification while `npm run dev` was concurrently serving the page, corrupting the dev server's webpack module cache: compiled CSS/JS chunks 404ing, page rendering as unstyled raw HTML). Fixed the same way: stopped the dev server, deleted `.next`, restarted clean — confirmed via direct requests that the freshly compiled CSS/JS served 200 before resuming. No source file was affected.

**Verification:** `npx tsc --noEmit` clean; `npm run build` succeeds with only the same two pre-existing, unrelated warnings — no new ones, after both the initial implementation and the correction round.

**Not yet done:** Existing Patient / Abroad (timezone step, Day-vs-Time variant) — Phase 5.1; Phase 6 integration/CTA wiring; a written §7-format Visual QA report (same standing open item as every phase since 3.1).

**Status: implementation approved (2026-07-27) — proceeding to Phase 5.1 is pending your go-ahead.**

### Phase 5.1 — Existing Patient / Abroad Extension
**Status:** Completed and approved (2026-07-27), after four correction rounds. Extends the same Existing Patient shell used by Phase 5.0 (per §5's architecture principle — region is a parameter, not a forked codebase); Iran re-verified as an unmodified regression at every round.

**Files created:** `lib/mock/locations.ts` — static mock location fixture (§5 "static mock fixtures"), `LocationRecord` (`id`, `city`, `country`, `countryFa`, `timezone` IANA name, `utcOffsetMinutes`), 15 sample cities; `lib/locationService.ts` — the dedicated service layer the UI talks to (never the mock file directly), exposing `searchLocations`/`getLocationById` plus pure display/conversion helpers (`formatUtcOffset`, `convertIranHourToLocal`, `formatLocalTimeFa`) so the mock can later be swapped for a real backend/timezone-data library without any UI component changing; `components/booking/existingPatientSteps.ts` — a shared, region-aware stepper-list builder (replacing per-file duplicated 5-step Iran-only lists), producing Iran's 5 steps or Abroad's 6 (with "مکان" inserted after "کد مرجع"); `components/booking/ExistingPatientLocationStep.tsx` — the new Abroad-only location/timezone step, a searchable combobox (search input + scrollable list, ~3 rows visible by default) built from `public/abroad-time-zone.png`/`abroad-time-zone-selected.png`.

**Files changed:** `lib/jalali.ts` — added `toGregorian`/`gregorianShortLabel`/`fullDateLabelWithGregorian` for the Abroad flow's dual-calendar display (day-count-delta approach applied to the real `Date` object, so real Gregorian leap years are handled correctly without hand-rolling a Jalali leap-year algorithm); `lib/mock/bookingService.ts` — added `555555` (Abroad forced-payment-failure demo code, independent of Iran's `444444`); `components/booking/useBookingFlow.ts` — new `existing-location` step, `selectedLocation` state, `SELECT_LOCATION`/`GO_TO_EXISTING_LOCATION` actions; `REFERENCE_CODE_VERIFIED` now routes Abroad codes to the location step instead of the "not implemented" error Phase 5.0 showed; `components/booking/ExistingPatientDateStep.tsx` — `region` prop, dual Jalali+Gregorian day-cell labels for Abroad, region-specific calendar-card/panel heights; `components/booking/ExistingPatientTimeStep.tsx` — `region`/`location` props, dual Iran/foreign-time cards for Abroad; `components/booking/ExistingPatientCheckoutStep.tsx` — `region` prop for the shared stepper; `components/pages/LandingPage.tsx` — location step wired in, region-aware panel heights, Abroad-specific date/time label formatting; `components/booking/NewPatientIntakeStep.tsx` — intake heading font-size correction (12px), a shared-styling fix requested alongside the Abroad corrections, not a New Patient scope change.

**Self-tested before your review:** `222222` → location step → search/select a city → dual-calendar date step → dual-time-card time step → checkout → payment success; `555555` → same flow → forced payment failure, independent of Iran's `444444`; Iran (`111111`, `444444`) regression-tested unaffected at every round; New Patient persona untouched.

**Correction rounds, completed and approved (only the final state is recorded as the implementation):**
1. Separate Abroad-only forced-payment-failure demo code (`555555`); timezone input default/open border, radius, fixed `476×218px` open dropdown; timezone label font sizes (12px label / 16px value); Date-selection panel+calendar height `+50px`; Time-selection card styling (background/border/spacing), Abroad selected state, city name above foreign time.
2. Discovered the height-increase and per-slot styling changes need to be Abroad-only — Iran's Date/Checkout dimensions reverted to their Phase 5.0-approved values (date panel `640px`, checkout `420px`, calendar `372px`); root-caused why the card `#FCFCFC`/`0.5px neutral-100` styling wasn't visibly rendering — `app/globals.css` has an unlayered `button { border: none; background: none; color: inherit; }` reset (same mechanism as the Phase 3.1 nav-link bug) that silently wins over plain Tailwind classes on any `<button>` regardless of specificity; fixed with the `!` (important) modifier, the same fix already used elsewhere in the app (e.g. `Button.tsx`'s secondary variant); country name (not city) shown in the time-slot cards; separator line corrected to `295px`/`neutral-100`, positioned beside the "ساعت‌های آزاد" heading; Abroad calendar height reduced `402px`→`392px`.
3. Country name switched from English to Farsi (`countryFa` field added to `LocationRecord`, since the mock dataset only had the English name); Abroad calendar height reduced a further `10px` (`382px`); the location-step trigger's own border needed the same `!important` fix as the time-slot cards (same unlayered-reset root cause); foreign time collapsed to a single line ("{countryFa} - {time}") using the smallest type-scale token (`text-tiny`, 10px) plus an ellipsis fallback for names still too long even at 10px — a static reduced size, not true per-string dynamic shrinking, since that would need JS text measurement not otherwise used in this codebase; four labels ("کد مرجع خود را وارد کنید", "تاریخ مراجعه را انتخاب کنید", "ساعت مراجعه را انتخاب کنید", "ساعت‌های آزاد") set to 12px in both regions.
4. "ساعت مراجعه را انتخاب کنید" set to `neutral-800` with an 8px gap before the "ساعت‌های آزاد" row; the same `295px` divider added to Iran's Time step too (per your explicit correction, unifying what was previously an Abroad-only element — the row is no longer branched by region in code); New Patient's "اطلاعات تماس خود را وارد کنید" set to 12px (its existing 16px gap below was already correct); Abroad Date panel height reduced a further `10px` (`660px`).

**Verification:** `npx tsc --noEmit` clean; `npm run build` succeeds with only the same two pre-existing, unrelated warnings — no new ones, after the initial implementation and all four correction rounds.

**Not yet done:** Phase 6 integration/CTA wiring; a written §7-format Visual QA report (same standing open item as every phase since 3.1).

**Status: implementation approved (2026-07-27) — proceeding to Phase 6 is pending your go-ahead.**

### Phase 6 — Integration & Polish
**Status:** Completed and approved (2026-07-28). **This completes the entire landing + booking migration end to end** — the outcome defined for Phase 6 in §2 is now met.

**Files changed:** `components/pages/LandingPage.tsx`, `lib/utils.ts`.

**Decisions confirmed before implementing (per §0):**
1. Service cards (the four cards in the Services section) — on click, scroll smoothly to the Hero booking panel, with keyboard accessibility (`role="button"`, `tabIndex`, Enter/Space handling) and a `cursor-pointer` affordance. No other styling touched.
2. Contact cards — the phone and email cards become real `tel:`/`mailto:` links, matching the header's existing link pattern exactly, visually identical to before. Address/hours cards stay inert/informational-only, per their content not being an actionable destination. Footer social icons left as placeholders, per the Phase 3.6 decision already on record.
3. `lib/utils.ts` cleanup — removed `getJalaliDate`, `formatJalaliDate`, `getDateFromDayOfWeek`, `computeSlots`, `monthNames` (confirmed unused anywhere in the repo; the first two were also producing incorrect output — year 1915 instead of the correct ~1405 — an unrelated latent bug this cleanup incidentally removed rather than fixed in place). `dayNames`/`getWeekDayLabel` were left untouched, since the (frozen) dashboard's `CalendarPage.tsx` depends on them.
4. `components/BookingWizard.tsx` left completely untouched — its retirement stays a separate, later, explicitly-approved discussion per §3/§9, not bundled into this phase.

**Main outcome:** the stubbed Hero/service-card entry points from Phase 3 are now connected to the real controller built in Phases 4–5; the `lib/utils.ts` Jalali-math duplication flagged since Phase 4.0/5.0 is resolved by deletion of the dead/incorrect code (not by merging it with `lib/jalali.ts`, since it turned out to be unused rather than a live duplicate).

**Regression testing — performed across two sessions, the first interrupted by a session/usage limit before it could finish:**

*Session 1 (2026-07-28):* `npx tsc --noEmit` and `npm run build` clean after every edit (only the same two pre-existing, unrelated warnings). Service-card scroll and contact `tel:`/`mailto:` links verified working in-browser. Full interactive dashboard walkthrough — login → Dashboard → Patients → Calendar (day-switching) → Requests → Notifications → Settings (toggle) → logout — all passed; this was the first time this full walkthrough was actually verified in the entire migration (previously blocked by no browser-automation tool being available, per the Phase 0 caveat). Full Existing Patient / Iran flow re-verified end-to-end (code → date → time → checkout → payment success) — no regressions. New/Existing Patient entry points confirmed reachable. New Patient's full success path and its duplicate-name error path were both verified end-to-end. The Existing Patient / Abroad flow was started (`222222` verified, Tokyo selected, advanced to the Date step) but the session hit its usage limit before reaching Time/Checkout/Payment.

*Session 2 (2026-07-28, resuming):* first hit a browser-automation connection issue — two Chrome instances were connected to this machine, and the interrupted session had apparently been driving one that wasn't visibly open to you; resolved by explicitly reconnecting to the correct browser instance via the extension's own confirmation screen. Then resumed exactly where the Abroad flow had stopped:
- Existing Patient / Abroad, `222222` (Tokyo): Location → dual Jalali+Gregorian Date step → dual Iran/Japan Time cards → Checkout → **Success**, reference number generated correctly.
- Existing Patient / Abroad forced-payment-failure demo code `555555` (Berlin): same flow → **Payment failed** screen shown correctly → "تلاش مجدد" (retry) correctly returns to Checkout with date/time/patient-name preserved.
- Existing Patient / Iran quick re-check (`111111`): single Jalali-only calendar (no dual Gregorian), single-column time slots (no dual foreign-time card), correct 5-step stepper (no "مکان" step) — Checkout → Success with a correct reference number. Confirmed unaffected by the Abroad-flow session.
- No new browser console errors; dev server log clean except the same two pre-existing, unrelated warnings.
- New Patient's flow was **not** re-run in session 2 — it was already confirmed end-to-end (success + duplicate-name error) in session 1, so re-running it wasn't part of the remaining unfinished work.

**Tooling note, not a product defect:** immediately after a full browser page reload, the browser-automation tool's simulated clicks intermittently failed to register on the persona-toggle button (the underlying React state didn't update), resolved by dispatching a direct DOM `.click()` instead; ordinary simulated clicks worked reliably everywhere else, including earlier in the same session. Flagged for the record since it affected how session 2's testing was carried out, not because it reflects any defect in the app itself.

**Verification:** `npx tsc --noEmit` and `npm run build` clean (only the two pre-existing, unrelated warnings) after every edit in session 1. No source files were changed in session 2 — that session was regression testing only.

**Not yet done:** a written §7-format Visual QA report (same standing open item as every phase since 3.1) — not produced for Phase 6 either. The Phase 9 discussion (whether/when to retire the old `BookingWizard.tsx`) remains a separate, later, explicit decision, not started.

**Status: implementation approved (2026-07-28) — the entire landing + booking migration (Phases 1–6) is now complete and regression-tested end to end.**

---

## 3. File-Level Migration Plan

### Keep unchanged

`app/layout.tsx`, `app/page.tsx`, `lib/auth.tsx`, `components/pages/LoginPage.tsx`, `components/layout/DashboardLayout.tsx`, `Sidebar.tsx`, `Topbar.tsx`, all dashboard page components (`DashboardPage`, `PatientsPage`, `PatientProfilePage`, `CalendarPage`, `RequestsPage`, `NotificationsPage`, `SettingsPage`), `lambda/*`, `template.yaml`, `template-simple.yaml`, `infrastructure/*`, `buildspec.yml`, all `deploy*` scripts, `next.config.ts`, `tsconfig.json`, `.eslintrc.json`, `components/Toast.tsx`.

### Modify (incrementally, per the phases above — never in one pass)

`components/pages/LandingPage.tsx`, `app/landing.css`, `tailwind.config.ts`, `app/globals.css`, `lib/types.ts` (`BookingRequest` gains optional fields only), `lib/utils.ts` (Jalali math reconciled additively).

### Create (incrementally, per the phases above)

`components/ui/` (Button, Input, Card, SectionHeading, StatusScreen, Modal, StepperIndicator, IconCard), `components/booking/` (controller/hook, persona-flow components, step components, OtpCodeInput, TimezoneCombobox), `components/landing/` (SiteHeader, SiteFooter, Section — if that split is taken in Phase 3.0), `lib/jalali.ts`, `lib/mock/` (mock service files — see §5).

### Deprecate later — **preserve until final validation, do not delete now**

- **`components/BookingWizard.tsx` (current file) stays in place, untouched and importable, until the entire new booking flow (Phases 4–5) is fully implemented and verified end-to-end.** It is not renamed, gutted, or partially replaced mid-migration — the new `components/booking/` structure is built alongside it. Only after Phase 6 sign-off does removing/retiring the old file become a discussion, and that discussion happens explicitly with you — it is not an automatic cleanup step.
- Pastel token _usage_ within landing/booking specifically (the tokens themselves stay for the dashboard, indefinitely).
- `smart-clinic-june-14/project/` (original prototype bundle) — untouched, no timeline attached.

### Do not touch

Everything under "Keep unchanged" above, plus anything in `public/` unrelated to the new hero image, plus git history/branches outside this work (see §4's git constraints).

**Principle governing this whole section:** nothing gets deleted, renamed, or "cleaned up" as a side effect of building the replacement. Cleanup is a distinct, later, explicitly-approved step — never bundled into a migration phase.

---

## 4. Git Safety

- No branch is created, switched, or deleted without your explicit request.
- No tag is created without your explicit request.
- No commit is made without your explicit request.
- Before any git operation of any kind, current branch and `git status` are confirmed and reported first.
- Where a checkpoint (branch/tag/commit) would be _useful_ at a phase boundary, it is noted in that phase as a **recommendation for you to approve** — never executed automatically as part of "completing" a phase.
- Destructive operations (`reset --hard`, force-push, branch deletion, `clean`) are never used in this migration under any circumstance without a separate, explicit, scoped request from you.

---

## 5. Booking Mock Service Architecture

**Constraint compliance:** no Cognito, API Gateway, Lambda, or DynamoDB anywhere in this plan.

**Preferred data-layer order (in this priority):**

1. **In-memory mock state (default).** The mock service holds its state in a plain module-level variable or React state for the lifetime of the page session. This is the default for all mock data — bookings submitted during a session are visible and inspectable within that session, and simply reset on reload. This is the normal, expected behavior for a frontend-only demo and should not be "fixed" by adding persistence.
2. **Static mock fixtures.** A small fixtures file provides sample "existing patients" (for the existing-patient/OTP lookup path) and a deterministic fake OTP. These are read-only reference data, not mutated.
3. **`localStorage` — only if a real requirement emerges, and only with explicit approval.** Nothing in the current scope requires bookings to survive a page refresh. If, during implementation, a concrete need appears (e.g., you want to demo the flow surviving a reload), that is raised explicitly before adding it — it is not assumed upfront.

**Explicitly avoid:** any implementation or documentation language implying mock patient/booking data is durable or production-like. It is demo-session-scoped by default.

**Interface shape:** a `bookingService` module exposing async methods (submit booking, verify OTP, look up existing patient by phone) matching the shape a real Lambda-backed client would eventually expose — so replacing the mock later is a swap of one implementation behind an unchanged interface, not a rewrite of any booking component.

**Persona/region handling:** New Patient never calls the OTP-verification method at all (no phone-verification step in its designed flow). Existing Patient always starts with Code verification. Iran vs. Abroad is a `region` parameter on one shared existing-patient flow, affecting which steps render and which fields are collected — not a forked codebase — so future region-specific rules (payment method, scheduling constraints, additional validations) extend the same structure instead of requiring new components.

---

## 6. Dashboard Protection Plan

**Guarantees:**

- Dashboard remains reachable via the exact same mock-login path.
- Every dashboard page keeps rendering with its current pastel-token styling, unmodified.
- New design-system tokens are additive-only — no pastel token is renamed, removed, or repurposed.

**Regression checks — run at the end of every phase in §2, not just once at the end:**

1. **Visual:** dashboard pages pixel-identical before/after each phase; specifically check `PatientsPage`'s `bg-${patient.color}-soft` cards, the most fragile point of contact between the two token systems.
2. **Functional walkthrough:** mock login → Dashboard stats → Patients search/filter → Patient profile → Calendar day-switching → Requests accept/reject → Notifications mark-all-read → Settings toggle → logout.
3. **Type safety:** `tsc --noEmit` passes, confirming `BookingRequest` field additions didn't break `RequestsPage.tsx`.
4. **Build:** `npm run build` succeeds with no new dashboard-sourced warnings.
5. **Import-graph isolation:** no dashboard file imports anything from `components/ui/`, `components/booking/`, or `components/landing/`, and vice versa.

---

## 7. Visual QA Process (mandatory after every UI phase/sub-phase in §2)

**Scope note:** the current Figma scope is **desktop only**. Visual QA therefore focuses exclusively on matching the provided desktop Figma frames at desktop width. No tablet/mobile testing is performed and no responsive behavior is designed or invented at this stage — if a responsive requirement is introduced later, it will be scoped explicitly at that time, not assumed now.

This process runs after **each** primitive in Phase 2, **each** sub-phase in Phase 3 (per landing section), and **each** sub-phase in Phases 4–5 (per persona/step-group) — never deferred to the end, and never satisfied by a bare pass/fail statement.

**Workflow:**

1. Run the app locally (`npm run dev`) and navigate to the just-implemented section/state.
2. Capture a browser screenshot of that section/state at desktop width (1440px, matching the Figma desktop frames directly).
3. Open the corresponding Figma frame/node (already identified and screenshotted during the architecture-discovery phase) at the same effective width.
4. Compare side-by-side (or, where useful, overlay one screenshot over the other at matched scale/opacity in an image viewer — a lightweight manual overlay is sufficient; no dedicated diffing tool is required for a project this size).
5. Write the Visual QA report (format below) and share it before starting the next phase/sub-phase — per §0, the next step does not begin until you've reviewed it and approved moving forward.

**Required Visual QA report format.** Every checkpoint produces a written report with all of the following; "Visual QA completed" or "matches Figma" on its own does not satisfy this process:

- **What was implemented** — the specific section/component/state built in this phase/sub-phase.
- **What Figma states/frames were compared** — the specific node(s)/screenshot(s) used as reference.
- **What was checked** — explicitly covering layout, spacing, typography, colors, component states, RTL behavior, and interactions (per the checklist below).
- **Mismatches found** — every discrepancy listed individually, however small; "none found" is a valid entry but must be stated, not implied by omission.
- **Remaining uncertainty** — anything not fully verifiable (e.g., a hover/focus state absent from the static Figma frame, an ambiguous spacing value, a judgment call surfaced per §0's ambiguity rule) called out explicitly rather than silently resolved.

**Viewport:**

- Desktop — 1440px width only, matching the Figma desktop frames. Tablet/mobile are out of scope for now (see scope note above).

**Checklist per checkpoint:**

**Layout**

- Element positioning matches Figma.
- Spacing (padding/margin/gaps) matches the token scale, not an eyeballed approximation.
- Alignment (text, icons, grid items) matches.
- Section structure/order matches.

**Typography**

- Correct font family (Vazirmatn) loaded and applied.
- Correct weight (Thin/Regular/Medium/Bold/ExtraBold as specified per element).
- Correct size against the sampled scale (Tiny 10 / Small 12 / Caption 14 / Body 16 / H6 20 / H5 24 / H4 30 / H3 40 / H2 60 / H1 80).
- Correct line-height per the same scale.

**Colors**

- Background colors match the sampled hex values exactly (e.g., blue-500 `#203aa2`, neutral-50 `#f0f1f3`).
- Text colors match (neutral-900 `#2b2f38` body text, neutral-300 `#989fad` placeholders, etc.).
- Border colors match (neutral-100 `#d0d3d9` default, neutral-500 `#667085` filled/focused, red-500 `#f04438` error).
- State-specific colors (success/warning/error) match their respective scale.

**Components**

- Default state matches Figma.
- Hover/focus states — where not shown in a static Figma frame, flagged as an inferred/ambiguous decision per §0's decision-making rule, not assumed silently.
- Error states match exactly, including copy (e.g., the duplicate-name message: _"این نام قبلا ثبت شده است"_).
- Selected states match (e.g., calendar date selected, timezone selected, code entered).

**RTL behavior**

- Text alignment is right-aligned by default, as in Figma.
- `dir` is correct on the root and on any mixed-content field (e.g., Latin phone numbers/timezone city names inside RTL forms).
- Icon placement mirrors correctly (e.g., chevrons, back/forward arrows point the RTL-correct direction).
- Overall layout mirrors correctly (logo/nav side, card icon side, etc.) relative to the Figma RTL frames.

**Interactions**

- Click/tap targets behave as expected (step navigation, modal open/close, form submission, calendar/timezone selection).
- Transitions between states (e.g., wizard step-to-step) behave reasonably, without asserting a specific animation spec Figma doesn't define — flagged as a judgment call if Figma is silent on it.

**Tools:**

- Browser dev tools fixed at a 1440px viewport.
- Manual screenshot capture (OS screenshot tool or browser screenshot extension).
- Figma's own screenshot/inspect view (already captured for reference during discovery) as the comparison source.
- A simple manual overlay (two images layered at reduced opacity in any image viewer) when a discrepancy is subtle and hard to spot side-by-side — not mandatory for every checkpoint, only when needed.

---

## 8. Risk Analysis

| Risk                                                                           | Mitigation                                                                                                                                                                                |
| ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Breaking Dashboard via token rename/removal                                    | Token changes are additive-only; enforced by the §6 regression checklist after every phase.                                                                                               |
| Mixing old and new design tokens inconsistently within landing/booking         | New landing/booking components only ever reference new semantic token names; checked at each Visual QA checkpoint.                                                                        |
| Over-refactoring shared utilities (`lib/utils.ts`) breaking Dashboard          | Jalali-math consolidation happens in a new `lib/jalali.ts` first; `lib/utils.ts` only touched additively once confirmed safe.                                                             |
| Booking business logic duplicated across Iran/Abroad                           | Enforced by the single-shell-parametrized-by-region design in §5, built and verified incrementally (5.0 before 5.1).                                                                      |
| Incorrect component boundaries (business rules leaking into shared primitives) | `components/ui/*` never imports booking-domain types; `useBookingFlow` is the only place branching logic lives.                                                                           |
| Unexpected backend dependency creep                                            | Mock service structure deliberately distinct from the real API client; constraint restated at Phases 4–5; in-memory-first data layer (§5) makes "accidentally real" integration unlikely. |
| Scope creep into Dashboard redesign                                            | Explicit "do not touch" file list (§3) treated as a hard boundary; any dashboard change request is escalated back to you.                                                                 |
| Static-export build regressions                                                | No `next/image`, no dynamic routes, no server-only features; verified by `npm run build` at every phase.                                                                                  |
| Font-weight regressions (Thin/ExtraBold not loaded)                            | Explicit check in Phase 1 before any component uses those weights.                                                                                                                        |
| Large, hard-to-review changes                                                  | Enforced by the incremental section/persona breakdown in §2 — no phase bundles more than one verifiable slice.                                                                            |
| Premature cleanup of the old `BookingWizard.tsx`                               | Explicitly preserved per §3 until Phase 6 sign-off; removal is a separate, later, explicitly-approved decision.                                                                           |
| Git history/state accidentally altered                                         | Governed by §4 — no write git operations without explicit per-instance approval.                                                                                                          |

---

## 9. Final Recommended Execution Order

Per §0, every numbered step below (and every sub-step within it) requires explicit approval before starting, and none begins automatically after the previous one completes.

1. Phase 0 — Safety checkpoint (read-only: confirm branch, confirm status, record baseline). No git writes.
2. Phase 1 — Design tokens (additive).
3. Phase 2 — Shared UI primitives (isolated, unwired).
4. Phase 3.0 → 3.6 — Landing page, one section at a time, each verified (§7) before the next.
5. Phase 4.0 → 4.2 — Booking controller + New Patient persona, verified before moving on.
6. Phase 5.0 — Existing Patient / Iran, verified.
7. Phase 5.1 — Existing Patient / Abroad extension, verified (including Iran-regression check).
8. Phase 6 — Integration, CTA wiring, utility reconciliation, full dashboard + booking regression pass.
9. Post-migration discussion (separate, later, explicit): whether/when to retire the old `BookingWizard.tsx`.

---

## 10. Post-Migration Additional Tasks (New Requirements)

New requirements raised after Phases 1–6 (§2) were fully implemented and approved. Tracked separately from the phase numbering above; governed by the same §0 rules — each task requires explicit approval before starting, no silent design/UX/architecture decisions.

### Task 1 — Connect Landing Page to Dashboard & other pages
**Status:** Completed (2026-07-28). No source files changed.

**Finding:** inspected the pre-migration app (this repo's `main` branch, same GitHub origin) and confirmed the old Landing Page's only route to the Dashboard was the footer's "ورود کارکنان" button plus an `Alt+L` keyboard shortcut, both calling `onLogin`; no other separate pages were linked from the landing page — everything else was in-page anchor scrolling. `app/page.tsx`'s `landing`/`login`/dashboard routing state machine is unchanged from the old app.

**Current state:** `Alt+L` → `onLogin` was already wired in Phase 3.0 and preserved through every subsequent phase — it was never actually broken. A visible footer staff-login button was never added during Phase 3.6 despite being noted as pending; you were asked whether to add one now, and **chose to keep `Alt+L` only, with no new visible UI element**, matching the old app's secondary (keyboard) access path exactly. This is the reason no files needed to change for this task.

**Verification:** `npx tsc --noEmit` and `npm run build` clean (only the two pre-existing, unrelated warnings). Full round trip re-verified in-browser: Landing → `Alt+L` → Login (mock credentials) → Dashboard → Patients → Calendar → Logout → back to Landing, all rendering correctly with no console errors introduced. Booking-flow entry point (service-card → scroll-to-Hero) re-confirmed unaffected. One pre-existing, unrelated console error observed on Dashboard load (`DynamoDBService.fetchAPI` "Failed to fetch") — expected in local dev without a deployed backend API, out of scope per this migration's "no backend work" constraint, not introduced by this task.

### Task 2 — Replace mock location data with a real free timezone/location solution
**Status:** Completed (2026-07-28), including a post-review business-rule adjustment.

**Approach (your choice, asked and confirmed):** a bundled offline dataset rather than a live API — appropriate for this static-export, no-backend app (no API keys, no runtime network dependency).

**Implementation:** `lib/mock/locations.ts` (15 hand-picked cities) replaced by `lib/data/locations.ts` + `lib/data/locations.generated.json`, a real dataset sourced from the free MIT-licensed `city-timezones` npm package via `scripts/generate-locations-data.mjs` (kept in the repo for regeneration), filtered to population > 50,000. `lib/locationService.ts` keeps its exact prior public interface (`searchLocations`, `getLocationById`, `formatUtcOffset`, `convertIranHourToLocal`, `formatLocalTimeFa`) but now computes Farsi country names and UTC offsets live via native `Intl` APIs instead of hand-picked values — which also fixes the previously-flagged static/no-DST limitation. The dataset loads via a dynamic `import()`, not the initial bundle — confirmed via build output that `/`'s First Load JS is unchanged (121 kB) before and after. `city-timezones` is a devDependency only, not shipped to the browser; the unused `countries-and-timezones` package was removed. No UI component was touched.

**Business-rule adjustment (post-review, your explicit request):** Iranian cities (`iso2 === 'IR'`, 59 entries) are excluded from the generated dataset — this picker only serves the Existing Patient / **Abroad** flow, so Iran is not a valid selection there. Applied at the data-generation stage (`scripts/generate-locations-data.mjs`), not the UI or service layer, keeping the public interface, search behavior, and performance identical. Dataset size: 3,897 cities (was 3,956).

**Verification:** `npx tsc --noEmit` and `npm run build` clean both before and after the Iran-exclusion adjustment; bundle size unaffected both times. Browser-tested with real cities never in the old mock (Osaka, Manchester, Dubai) to confirm the swap is genuinely live, not cached mock data — full Abroad flow to payment Success with Osaka and Dubai, forced-payment-failure demo code (`555555`) to the correct error screen with Manchester. After the adjustment: searching "Tehran"/other Iranian cities correctly returns "No results"; Dubai and other non-Iranian cities still work exactly as before. Iran flow (`111111`, unrelated to this picker) and the Task 1 `Alt+L` → Dashboard link re-confirmed unaffected. No console errors throughout.

### Additional UX improvement — Persian/English digit handling for numeric inputs
**Status:** Completed (2026-07-28), requested between Task 2 and Task 3.

**Scope:** the two digits-only fields in the booking flow — reference code (`ExistingPatientCodeStep`) and phone number (`NewPatientIntakeStep`). No other field was touched (name/referrer/reason stay free text).

**Implementation:** added a new opt-in `numeric` prop to the shared `Input` primitive (`components/ui/Input.tsx`) — additive to its props interface, so every other consumer is unaffected. When set, `Input` displays the field's value with `toFa()` (always Persian digits, regardless of what was typed) and intercepts every change event (typing and paste alike, since both fire the same native `input`/`change` event) to normalize via the existing `toEn()` helper and strip anything that isn't `0-9`, before handing the value back through the exact same `onChange(e)` callers already use. Callers therefore always receive a plain English-digit string — `ExistingPatientCodeStep`'s `/^\d{6}$/` check and `bookingService`'s `REFERENCE_CODE_RECORDS[code]` lookup needed **zero changes**, since the value reaching them was already normalized. `ExistingPatientCodeStep.tsx` and `NewPatientIntakeStep.tsx` each changed by one line (`inputMode="numeric"`/`"tel"` → `numeric`).

**Verification:** `npx tsc --noEmit` and `npm run build` clean, bundle size unchanged. Browser-tested: typing `123abc456` in the reference-code field displayed `۱۲۳۴۵۶` (letters silently dropped); typing Persian digits `۱۱۱۱۱۱` directly and submitting correctly resolved the real Iran patient record (proving the internal value really is English-normalized, not just displayed correctly); a simulated paste of `09141-23۴۵۶۷` (mixed digits + a hyphen) into the phone field correctly normalized to `۰۹۱۴۱۲۳۴۵۶۷`. Full New Patient submission with that phone number completed successfully. No console errors.

### Task 3 — Asset organization: move Landing Page assets into `public/landing-assets/`
**Status:** Completed and approved (2026-07-28).

**Scope:** you had already created `public/landing-assets/` and moved every Landing Page/booking-flow image and video into it (no files were moved, renamed, or replaced as part of this task itself). The work here was purely updating code references to the new path.

**Implementation:** updated 34 asset-path string references across 9 files to point at `/landing-assets/...` instead of `/...` — `components/pages/LandingPage.tsx` (21: logo, nav/support icons, Hero video + poster, About checkmark, Services icons + decorative flowers, Contact icons + background, Footer social icons), `ExistingPatientCheckoutStep.tsx` (3: `Calendar-form.svg`/`clock-form.svg`/`user-form.svg`), `NewPatientTerminalStep.tsx` (3: `done.svg`/`xmark.svg`/`warning.svg`), `ExistingPatientTerminalStep.tsx` (2), and one `Arrow.svg` reference each in `ExistingPatientCodeStep.tsx`, `ExistingPatientDateStep.tsx`, `ExistingPatientLocationStep.tsx`, `ExistingPatientTimeStep.tsx`, `NewPatientIntakeStep.tsx`. Done via a one-off script (deleted after running) matching only the exact known filenames, to avoid any risk of touching unrelated strings.

**Deliberately left untouched:** `app/landing.css`'s two `/hero.jpg` references — that file isn't imported by the new Landing Page (dead file, preserved per §3's "do not touch" rule) and `hero.jpg` itself no longer exists on disk; updating it would have no effect and is out of this task's scope.

**Verification:** `npx tsc --noEmit` and `npm run build` clean, bundle size unchanged; confirmed the static export's `out/landing-assets/` directory is populated correctly. Ran the app and exercised every code path that touches an asset (Landing Page all sections, New Patient success/error/no-service terminals, Existing Patient/Iran through checkout and success) while inspecting actual network requests — all 26 distinct referenced files returned 200/206/304, **zero 404s**. No console errors.

### Task 4 — Project cleanup: remove unused assets and dead files
**Status:** Completed and approved (2026-07-28).

**Removed — 40 unused design-reference assets** from `public/landing-assets/` (the manual-screenshot references supplied throughout the redesign — Phase 3.1–3.6 section mockups, Phase 4.1/4.2 intake/terminal-state references, Phase 5.0/5.1 Iran/Abroad step references, two orphaned icon SVGs never referenced anywhere): `Default Reserve.png`, `Error.png`, `Footer.png`, `Hero.png`, `Inputs.png`, `Navbar.png`, `Success.png`, `abroad-checkout.png`, `abroad-date.png`, `abroad-date-picker.png`, `abroad-date-selected.png`, `abroad-day.png`, `abroad-day-selected.png`, `abroad-success.png`, `abroad-time-zone.png`, `abroad-time-zone-selected.png`, `alert-circle.svg`, `code.png`, `code-selected.png`, `first-reservation.png`, `full landing.png`, `info-entered-and-error.png`, `information.png`, `iran-checkout.png`, `iran-date.png`, `iran-date-picker.png`, `iran-date-selected.png`, `iran-success.png`, `iran-time.png`, `iran-time-selected.png`, `no-service.png`, `request-error.png`, `request-success.png`, `reserved-from-abroud.png`, `reserved-from-iran.png`, `section2.png`, `section3.png`, `section4.png`, `tick-circle.svg`, `wrong-code.png`. Confirmed unused via exhaustive project-wide grep — every match on these filenames was a source-code comment documenting design provenance (e.g. `// built from public/code.png`), never a functional reference. `public/landing-assets/` now holds exactly the 26 files Task 3 confirmed are actually rendered.

**Removed — 2 dead pre-migration files, per your explicit decision:** `components/BookingWizard.tsx` and `app/landing.css`. §3's standing rule reserved their retirement for a separate, later, explicit decision rather than routine cleanup; this was surfaced to you before touching either file, and you explicitly chose to remove both now. Both were confirmed to have zero functional references anywhere (`BookingWizard.tsx`: no imports, only a provenance comment in `lib/jalali.ts`; `landing.css`: not imported, and its one near-hit — `bw-overlay`, mentioned in the unused `Modal.tsx` — was also only a comment, not actual code).

**Not touched:** documentation, deploy/infra configuration, and all 26 assets still in active use — explicitly out of scope per your instructions.

**Verification:** `npx tsc --noEmit` and `npm run build` clean, bundle size unchanged. Full functional regression in-browser: Landing Page, New Patient, Existing Patient/Iran, and Existing Patient/Abroad flows all re-verified end-to-end to success; Task 1's `Alt+L` → Dashboard link re-confirmed working. Inspected actual network requests — zero 404s except one pre-existing, unrelated `favicon.ico` (never existed in this repo, not caused by this task). No console errors.

### Task 5 — Limited clean-code review of the Landing Page implementation
**Status:** Completed and approved (2026-07-28).

**Scope, per your instruction:** `LandingPage.tsx` and everything it directly wires in — the booking-flow components, `useBookingFlow`, `bookingService`, `locationService`, `jalali.ts`, and the `components/ui/*` primitives it consumes — reviewed for duplicate code, dead code, unused imports, unused components, type safety, and readability. Only necessary, low-risk fixes were applied; no UI, booking logic, or business rules were touched.

**Changes made:**
1. **`components/pages/LandingPage.tsx`** — removed the unused `onBookingSubmit` prop (and its `any` type) from `LandingPageProps`. It was never referenced in the component body, and the only caller (`app/page.tsx`) never passed it — confirmed by a repo-wide grep. Dead prop, no behavioral effect.
2. **`lib/jalali.ts`** — added `parseDateKey()`, the inverse of the existing `dateKeyFor()`, and used it to replace four separate inline occurrences of `key.split("-").map(Number)` (three in `LandingPage.tsx`, one in `ExistingPatientTimeStep.tsx`). Same expression, same input/output, just factored into one shared function — a duplicate-code fix, not a logic change.
3. **`lib/mock/bookingService.ts`** and **`lib/locationService.ts`** — removed each file's unused `export default`. Every consumer imports the named export (`{ bookingService }` / `{ locationService }`); confirmed zero default imports anywhere in the repo.

**Flagged, not changed (surfaced to you rather than assumed):**
- `components/ui/Card.tsx` and `Modal.tsx` are fully unused anywhere in the app (zero imports, confirmed by grep). They're intentional Phase 2 design-system deliverables that an earlier decision explicitly kept available even after the booking flow ended up not using them ("`Modal` stays available as a primitive but isn't used by this flow"). Removing them would reverse that decision and go beyond the Landing Page's own code — left in place, pending a separate explicit call.
- `lib/utils.ts`'s `getPascalCase` is unused anywhere in the repo, but it's general dashboard-shared utility that predates this migration, not Landing Page code — left untouched as out of scope for this task.
- `bookingService`'s `verifyOtp`/`lookupPatientByPhone` stubs are already documented as an intentional placeholder ("Left in place... in case a real phone/OTP mechanism is reintroduced later") — not accidental dead code, left as-is.
- `SummaryRow` (checkout step) and `SuccessDetailRow` (terminal step) are small, structurally similar row components in different files with slightly different shapes (icon vs. no icon) — not an obvious/low-risk merge candidate, left unmerged.

**Verification:** `npx tsc --noEmit` clean; `npm run build` clean, same two pre-existing unrelated warnings only, bundle size unchanged (121 kB First Load JS on `/`). Live browser regression: Existing Patient/Iran full flow (code `111111` → date → time → checkout → payment success, all date/time labels rendering correctly, confirming `parseDateKey` produces identical output to the old inline code); New Patient full flow (intake → success); `Alt+L` → Login page (confirming `onLogin` unaffected by the prop-interface change). No console errors in any flow.

### Task 6 — Final QA before commit and push
**Status:** Completed and approved (2026-07-28). **This is the last item on your 6-task post-migration list — the project is approved for commit and push.**

**Scope, per your instruction:** re-verify the entire current project state — typecheck, production build, Landing Page rendering/assets/navigation, all three booking-flow personas end to end (including real Abroad city search/timezone/success/failure), the `Alt+L` → Login → Dashboard → Logout path, and a check for broken assets/console errors/regressions — fixing only real issues found, with no UI/design/booking-logic changes otherwise.

**Bug found and fixed:** during Existing Patient / Abroad testing, searching the real city dataset for a Kosovo or Somaliland city (e.g. "Kosovo", or even a single-letter query that happens to match one while typing) crashed the location picker with an uncaught `RangeError`. Root cause: 6 entries in `lib/data/locations.generated.json` are disputed territories (Kosovo, Somaliland) that the upstream `city-timezones` package marks with a non-standard `iso2: -99` placeholder instead of a real ISO 3166-1 code; `Intl.DisplayNames.of(-99)` throws instead of returning `undefined`, so `lib/locationService.ts`'s existing `?? raw.country` fallback never got a chance to run — the throw happened one line earlier. **Fix (`lib/locationService.ts` only):** added a `getCountryNameFa(iso2, fallback)` helper that validates the ISO-code format (and wraps the lookup in try/catch) before calling `Intl.DisplayNames.of()`, falling back to the plain English country name otherwise — the same defensive pattern the adjacent `getUtcOffsetMinutes` helper already used. Verified: searching "Kosovo" now correctly returns Pristina/Pec with no crash (falls back to displaying "Kosovo"/"Somaliland" in English), and unaffected valid entries (e.g. Berlin) still resolve to their proper Farsi name ("آلمان"). Pure bug fix — no UI, design, or booking-logic/business-rule change; this bug pre-dates this session (introduced by Task 2's real-dataset swap) and was only surfaced now because this was the first time the dataset was searched for one of these specific disputed-territory names.

**Full regression suite run (after the fix), all passing:**
- `npx tsc --noEmit` and `npm run build` — clean, same two pre-existing unrelated warnings only, bundle size unchanged (121 kB).
- Landing Page — full scroll-through of all six sections; all 30 page-load asset requests returned 200/206, zero broken assets; nav-link scroll and service-card → Hero scroll both confirmed working.
- New Patient — success flow and the `ارور` error-trigger flow, both correct.
- Existing Patient / Iran — wrong-code inline error, then `111111` end to end (date → time → checkout → success) with the correct 5-step stepper (no "مکان") and correct labels.
- Existing Patient / Abroad — real city search including the previously-crashing "Kosovo" query, through Location (Pristina) → dual Jalali+Gregorian Date → dual Iran/local Time → Checkout → **Success** with a reference number; separately, the forced-failure code `555555` (Berlin) → **Payment failed** → "تلاش مجدد" correctly returns to Checkout with all selections preserved.
- `Alt+L` → Login (mock credentials) → Dashboard → Patients → Calendar (day-switching) → Requests → Notifications → Settings (toggle) → Logout → back to Landing — all working.
- Console/network audit across the whole session: the only console errors were the same pre-existing, documented `DynamoDBService` "Failed to fetch" (no backend deployed locally — expected, out of scope) firing on every Dashboard-page mount; the only 4xx/5xx network entries were that same `localhost:3000/api/*` backend-not-deployed case plus one transient `.next` build-cache-corruption 500 from running `npm run build` while `npm run dev` was concurrently active mid-session (same recurring, already-documented gotcha from Phase 3.6 onward) — resolved the same way as always (stop dev server, delete `.next`, restart clean) before continuing. Zero 404s on any Landing Page or booking-flow asset.

**Not touched:** Markdown docs during the QA pass itself (this entry and the Session Handoff update were written afterward, on your explicit approval).

**Status: approved (2026-07-28) — project is ready for commit and push; both docs updated accordingly.**

---

**This document is a plan only. No repository changes have been made as part of producing it, beyond this file itself. No further implementation, file creation, component work, or git operations will begin until you explicitly approve moving into Phase 0.**
