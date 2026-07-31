'use client';

import React from 'react';
import Button from '@/components/ui/Button';
import StepperIndicator from '@/components/ui/StepperIndicator';
import { buildExistingPatientSteps } from './existingPatientSteps';
import type { ExistingPatientRegion } from './useBookingFlow';

// Phase 5.0 — Iran flow checkout step, built from public/iran-checkout.png
// (524×420px). Icon badges (Calendar-form.svg/clock-form.svg/user-form.svg)
// use a rounded-full chip — a judgment call on shape (the screenshot doesn't
// pixel-confirm circle vs. rounded-square), not Figma-verified.
//
// Phase 5.1 — extended (not duplicated) for Abroad: the stepper now comes
// from the shared `buildExistingPatientSteps` helper (6 steps incl. "مکان"
// for Abroad, unchanged 5 for Iran). `dateLabel`/`timeLabel` stay plain
// strings — LandingPage.tsx formats the abroad-specific "date + Gregorian"
// and "Iran + local time" text upstream, per public/abroad-checkout.png
// (524×390px vs. Iran's 420px), so no other change was needed here.

interface SummaryRowProps {
  icon: string;
  label: string;
  value: string;
  showDivider: boolean;
}

function SummaryRow({ icon, label, value, showDivider }: SummaryRowProps) {
  return (
    <div className={showDivider ? 'border-b border-neutral-100 pb-4' : ''}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white">
            <img src={icon} alt="" className="h-4 w-4" />
          </span>
          <span className="text-body text-neutral-500">{label}</span>
        </div>
        <span className="text-body font-medium text-neutral-900">{value}</span>
      </div>
    </div>
  );
}

interface ExistingPatientCheckoutStepProps {
  region: ExistingPatientRegion;
  dateLabel: string;
  timeLabel: string;
  patientName: string;
  isSubmitting: boolean;
  onPay: () => void;
  onPrev: () => void;
}

export default function ExistingPatientCheckoutStep({
  region,
  dateLabel,
  timeLabel,
  patientName,
  isSubmitting,
  onPay,
  onPrev,
}: ExistingPatientCheckoutStepProps) {
  return (
    <div>
      <h2 className="text-center text-h5 font-medium text-neutral-900">رزرو آنلاین نوبت</h2>

      <StepperIndicator steps={buildExistingPatientSteps(region, 'payment')} className="mt-6" />

      <div className="mt-6 flex flex-col gap-4 rounded-[8px] bg-neutral-50 p-4">
        <SummaryRow icon="/landing-assets/Calendar-form.svg" label="زمان" value={dateLabel} showDivider />
        <SummaryRow icon="/landing-assets/clock-form.svg" label="ساعت" value={timeLabel} showDivider />
        <SummaryRow icon="/landing-assets/user-form.svg" label="به نام" value={patientName} showDivider={false} />
      </div>

      <div className="mt-6 flex items-center gap-4">
        <Button type="button" variant="secondary" className="h-10 w-[160px]" onClick={onPrev}>
          قبلی
        </Button>
        <Button
          type="button"
          variant="primary"
          className="h-10 w-[300px]"
          disabled={isSubmitting}
          onClick={onPay}
        >
          پرداخت
        </Button>
      </div>
    </div>
  );
}
