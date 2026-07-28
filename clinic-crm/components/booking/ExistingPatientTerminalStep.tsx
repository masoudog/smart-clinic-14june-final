'use client';

import React from 'react';
import Button from '@/components/ui/Button';
import type { ExistingPatientTerminalStatus } from './useBookingFlow';

// Phase 5.0 — Iran flow terminal states, built from public/iran-success.png
// (524×384px) and public/error.png (524×220px, same shape/size as the New
// Patient terminals — a separate component, not a shared one, so the New
// Patient flow stays untouched).
//
// The reference screenshot's "زمان" row shows a submission timestamp
// (e.g. "20:58 - Saturday 1 Tir") that has no equivalent in this app's data
// model. Showing the actual booked date/hour instead is more correct for a
// real confirmation — a deliberate content choice, not a literal screenshot
// reproduction, flagged for your review.

interface SuccessDetailRowProps {
  label: string;
  value: string;
  showDivider: boolean;
}

function SuccessDetailRow({ label, value, showDivider }: SuccessDetailRowProps) {
  return (
    <div className={showDivider ? 'border-b border-neutral-100 pb-3' : ''}>
      <div className="flex items-center justify-between">
        <span className="text-body text-neutral-500">{label}</span>
        <span className="text-body font-medium text-neutral-900">{value}</span>
      </div>
    </div>
  );
}

interface ExistingPatientTerminalStepProps {
  status: ExistingPatientTerminalStatus;
  dateTimeLabel: string;
  patientName: string;
  referenceNumber: string | null;
  onAction: () => void;
}

export default function ExistingPatientTerminalStep({
  status,
  dateTimeLabel,
  patientName,
  referenceNumber,
  onAction,
}: ExistingPatientTerminalStepProps) {
  if (status === 'error') {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-[24px] bg-red-100">
          <img src="/landing-assets/xmark.svg" alt="" className="h-5 w-5" />
        </div>
        <h2 className="mt-3 text-h6 font-medium leading-[150%] text-neutral-900">
          پرداخت ناموفق، نوبت شما ثبت نشد!
        </h2>
        <p className="mt-1.5 text-caption font-light leading-[150%] text-neutral-500">
          دوباره تلاش کنید
        </p>
        <Button variant="primary" className="mt-4 h-10 w-full" onClick={onAction}>
          تلاش مجدد
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-col items-center text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-[24px] bg-success-50">
          <img src="/landing-assets/done.svg" alt="" className="h-5 w-5" />
        </div>
        <h2 className="mt-3 text-h6 font-medium leading-[150%] text-neutral-900">
          نوبت شما ثبت شد!
        </h2>
      </div>

      <div className="mt-[34px] flex flex-col gap-3 rounded-[8px] bg-neutral-50 p-4">
        <SuccessDetailRow label="زمان" value={dateTimeLabel} showDivider />
        <SuccessDetailRow label="انتقال دهنده" value={patientName} showDivider />
        <SuccessDetailRow label="شماره مرجع" value={referenceNumber ?? ''} showDivider={false} />
      </div>

      <Button variant="primary" className="mt-auto h-10 w-full" onClick={onAction}>
        بازگشت
      </Button>
    </div>
  );
}
