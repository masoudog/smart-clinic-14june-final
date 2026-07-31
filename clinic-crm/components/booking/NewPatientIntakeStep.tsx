'use client';

import React from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import StepperIndicator, { type Step } from '@/components/ui/StepperIndicator';
import type { NewPatientIntakeData, NewPatientIntakeErrors, NewPatientIntakeField } from './useBookingFlow';

// Phase 4.1 — New Patient intake step, built from public/information.png +
// public/info-entered-and-error.png. Lives in components/booking/ (not
// components/ui/) since the step order, copy, and validation are booking
// domain logic, per the Phase 2b decision not to fold page/domain-specific
// patterns into shared primitives without a real reuse need.

const STEPS: Step[] = [
  { key: 'file', label: 'پرونده', state: 'done' },
  { key: 'info', label: 'اطلاعات', state: 'current' },
  { key: 'follow-up', label: 'پیگیری', state: 'pending' },
];

interface NewPatientIntakeStepProps {
  data: NewPatientIntakeData;
  errors: NewPatientIntakeErrors;
  isSubmitting: boolean;
  onFieldChange: (field: NewPatientIntakeField, value: string) => void;
  onNext: () => void;
  onPrev: () => void;
}

export default function NewPatientIntakeStep({
  data,
  errors,
  isSubmitting,
  onFieldChange,
  onNext,
  onPrev,
}: NewPatientIntakeStepProps) {
  const canProceed =
    data.fullName.trim().length > 0 &&
    data.phone.trim().length > 0 &&
    data.referrerName.trim().length > 0;

  return (
    <div>
      <h2 className="text-center text-h5 font-medium text-neutral-900">رزرو آنلاین نوبت</h2>

      <StepperIndicator steps={STEPS} className="mt-6" />

      <p className="mt-6 text-right text-small text-neutral-700">
        اطلاعات تماس خود را وارد کنید
      </p>

      <div className="mt-4 flex flex-col gap-4">
        <Input
          label="نام و نام خانوادگی"
          required
          placeholder="مثال: حسین ملکی"
          value={data.fullName}
          error={errors.fullName}
          onChange={(e) => onFieldChange('fullName', e.target.value)}
        />
        <Input
          label="شماره تماس"
          required
          numeric
          placeholder="مثال: ۰۹۱۴۱۲۳۴۵۶۷"
          value={data.phone}
          error={errors.phone}
          onChange={(e) => onFieldChange('phone', e.target.value)}
        />
        <Input
          label="نام معرف"
          required
          placeholder="مثال: حسین ملکی"
          value={data.referrerName}
          error={errors.referrerName}
          onChange={(e) => onFieldChange('referrerName', e.target.value)}
        />
        <Input
          label="دلیل مراجعه"
          multiline
          placeholder="توضیحاتی در مورد مشکل خود بنویسید"
          value={data.reason}
          onChange={(e) => onFieldChange('reason', e.target.value)}
        />
      </div>

      <div className="mt-6 flex items-center gap-4">
        <Button type="button" variant="secondary" className="h-10 w-[160px]" onClick={onPrev}>
          قبلی
        </Button>
        <Button
          type="button"
          variant="primary"
          className="h-10 w-[300px]"
          disabled={!canProceed || isSubmitting}
          onClick={onNext}
        >
          <span className="flex items-center gap-2">
            بعدی
            <img src="/landing-assets/Arrow.svg" alt="" className="h-6 w-6" />
          </span>
        </Button>
      </div>
    </div>
  );
}
