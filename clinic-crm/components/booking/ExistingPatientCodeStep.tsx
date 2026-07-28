'use client';

import React from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

// Phase 5.0 — Existing Patient entry step, built from public/code.png and
// public/code-selected.png (524×280px). A single 6-digit reference code
// identifies the patient and their region — no phone/OTP step exists in this
// design.

interface ExistingPatientCodeStepProps {
  code: string;
  error?: string;
  isSubmitting: boolean;
  onChange: (value: string) => void;
  onNext: () => void;
  onPrev: () => void;
}

export default function ExistingPatientCodeStep({
  code,
  error,
  isSubmitting,
  onChange,
  onNext,
  onPrev,
}: ExistingPatientCodeStepProps) {
  const canProceed = /^\d{6}$/.test(code.trim());

  return (
    <div className="flex h-full flex-col">
      <h2 className="text-center text-h5 font-medium text-neutral-900">رزرو آنلاین نوبت</h2>

      <p className="mt-6 text-right text-small text-neutral-700">کد مرجع خود را وارد کنید</p>

      <div className="mt-4">
        <Input
          label="کد مرجع"
          required
          numeric
          placeholder="مثال: ۱۲۳۴۵۶"
          value={code}
          error={error}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>

      <div className="mt-auto flex items-center gap-4">
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
