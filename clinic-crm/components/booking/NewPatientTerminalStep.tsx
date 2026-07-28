'use client';

import React from 'react';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import type { NewPatientTerminalStatus } from './useBookingFlow';

// Phase 4.2 — New Patient terminal states, built from public/request-success.png,
// public/request-error.png, public/no-service.png (all 524×220px). No review/
// confirmation step exists in the design (confirmed with you) — this renders
// directly after bookingService.submitBooking resolves.

const TERMINAL_CONTENT: Record<
  NewPatientTerminalStatus,
  {
    icon: string;
    iconBg: string;
    heading: string;
    subtitle: string;
    actionLabel: string | null;
  }
> = {
  success: {
    icon: '/landing-assets/done.svg',
    iconBg: 'bg-success-50',
    heading: 'درخواست شما برای ارزیابی اولیه ثبت شد!',
    subtitle: 'به زودی با شما ارتباط می‌گیریم',
    actionLabel: 'بازگشت',
  },
  error: {
    icon: '/landing-assets/xmark.svg',
    iconBg: 'bg-red-100',
    heading: 'درخواست شما ثبت نشد!',
    subtitle: 'دوباره تلاش کنید',
    actionLabel: 'تلاش مجدد',
  },
  'no-service': {
    icon: '/landing-assets/warning.svg',
    iconBg: 'bg-warning-100',
    heading: 'در حال حاظر امکان ثبت درخواست نوبت وجود ندارد',
    subtitle: 'در ساعات بعدی دوباره تلاش کنید',
    actionLabel: null,
  },
};

interface NewPatientTerminalStepProps {
  status: NewPatientTerminalStatus;
  onAction: () => void;
}

export default function NewPatientTerminalStep({ status, onAction }: NewPatientTerminalStepProps) {
  const content = TERMINAL_CONTENT[status];

  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <div
        className={cn(
          'flex h-12 w-12 items-center justify-center rounded-[24px]',
          content.iconBg,
        )}
      >
        <img src={content.icon} alt="" className="h-5 w-5" />
      </div>
      <h2 className="mt-3 text-h6 font-medium leading-[150%] text-neutral-900">
        {content.heading}
      </h2>
      <p className="mt-1.5 text-caption font-light leading-[150%] text-neutral-500">
        {content.subtitle}
      </p>
      {content.actionLabel && (
        <Button variant="primary" className="mt-4 h-10 w-full" onClick={onAction}>
          {content.actionLabel}
        </Button>
      )}
    </div>
  );
}
