'use client';

import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import Button from '@/components/ui/Button';
import StepperIndicator from '@/components/ui/StepperIndicator';
import { buildExistingPatientSteps } from './existingPatientSteps';
import type { ExistingPatientRegion } from './useBookingFlow';
import { getJalaliToday, availableHoursFor, shortDateLabel, toGregorian, gregorianShortLabel, parseDateKey } from '@/lib/jalali';
import { toFa } from '@/lib/utils';
import { formatLocalTimeFa, type LocationRecord } from '@/lib/locationService';

// Phase 5.0 — Iran flow time-selection step, built from public/iran-time.png /
// public/iran-time-selected.png (524×330px). The "ساعت های آزاد" row's
// divider (295px, neutral-100) was originally Abroad-only; per your
// explicit correction it's now shared by both regions, so this row's markup
// is no longer branched by `isAbroad`.
//
// Phase 5.1 — extended (not duplicated) for the Abroad region: when a
// `location` is supplied, each slot renders as a card with the Iran clinic
// time on top (16px) and the selected location's Farsi country name + local
// time on a single line below it ("{countryFa} - {time}"), in a wrapping
// 4-column grid, per public/abroad-day.png / abroad-day-selected.png
// (524×424px). The design's placeholder repeats the same local time for
// every slot; this instead computes the real per-slot conversion, since the
// timezone is supposed to drive it (per your instruction) and a static
// repeated value would be wrong for different Iran hours.
//
// The foreign-time line uses the smallest token in the type scale
// (text-tiny, 10px) plus nowrap/ellipsis, per your instruction to shrink
// the font until it fits on one line — a static reduced size rather than
// true per-string dynamic shrinking, since that would need JS text
// measurement not otherwise used in this codebase; ellipsis is the
// fallback for any country name still too long even at 10px. Flagged as a
// disclosed simplification, not a literal reproduction of "reduce until it
// fits" for every possible string.
//
// Card background/border (#FCFCFC / 0.5px neutral-100 default) applies to
// both Iran's and Abroad's cards per your correction; Abroad's selected
// state is bg-primary-50 + border-2 primary-500, while Iran's existing
// selected style is unchanged. Spacing below the slot grid/row is a fixed
// 16px to the buttons, which sit a further 24px above the panel's bottom
// edge via the panel's own padding — both fixed (not auto-margin), since
// this step's content height is deterministic per region.
//
// The default-state border/background classes need the `!` (important)
// modifier: `app/globals.css` has an unlayered `button { border: none;
// background: none; }` reset (same root cause documented for the Phase 3.1
// nav-link hover bug) that otherwise silently wins over plain Tailwind
// utility classes on every <button>, regardless of specificity.

interface ExistingPatientTimeStepProps {
  region: ExistingPatientRegion;
  location: LocationRecord | null;
  dateKey: string;
  selectedHour: number | null;
  onSelectHour: (hour: number) => void;
  onNext: () => void;
  onPrev: () => void;
}

export default function ExistingPatientTimeStep({
  region,
  location,
  dateKey,
  selectedHour,
  onSelectHour,
  onNext,
  onPrev,
}: ExistingPatientTimeStepProps) {
  const today = useMemo(() => getJalaliToday(), []);
  const [year, monthIdx, day] = parseDateKey(dateKey);
  const dayLabel = shortDateLabel(year, monthIdx, day, today);
  const hours = availableHoursFor();
  const isAbroad = region === 'abroad' && !!location;
  const gregorianLabel = isAbroad ? gregorianShortLabel(toGregorian(year, monthIdx, day, today)) : null;

  return (
    <div className="flex h-full flex-col">
      <h2 className="text-center text-h5 font-medium text-neutral-900">رزرو آنلاین نوبت</h2>

      <StepperIndicator steps={buildExistingPatientSteps(region, 'time')} className="mt-6" />

      {/* This block absorbs any slack in a flex column of deterministic
          height, so the slot grid/row always sits exactly 16px above the
          buttons below regardless of small content-height variance. */}
      <div className="flex flex-1 flex-col justify-end">
        <p className="text-right text-small text-neutral-800">ساعت مراجعه را انتخاب کنید</p>

        <div className="mt-2 flex items-center gap-3">
          <p className="whitespace-nowrap text-right text-small text-neutral-500">
            ساعت های آزاد - {dayLabel}
            {gregorianLabel && ` (${gregorianLabel})`}
          </p>
          <hr className="!border-neutral-100" style={{ width: 295 }} />
        </div>

        {isAbroad ? (
          <div className="mt-4 grid grid-cols-4 gap-3">
            {hours.map((hour) => (
              <button
                key={hour}
                type="button"
                onClick={() => onSelectHour(hour)}
                className={cn(
                  'rounded-[8px] px-2 py-3 text-center transition-colors',
                  selectedHour === hour
                    ? '!border-2 !border-solid !border-primary-500 !bg-primary-50'
                    : '!border-[0.5px] !border-solid !border-neutral-100 !bg-[#FCFCFC] hover:!bg-neutral-50',
                )}
              >
                <div className="text-body font-medium text-neutral-900">ایران - {toFa(hour)}:۰۰</div>
                <div className="mt-1 overflow-hidden text-ellipsis whitespace-nowrap text-tiny text-primary-500">
                  {location!.countryFa} - {formatLocalTimeFa(hour, location!)}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="mt-4 flex gap-2">
            {hours.map((hour) => (
              <button
                key={hour}
                type="button"
                onClick={() => onSelectHour(hour)}
                className={cn(
                  'flex-1 rounded-[8px] px-2 py-3 text-center text-body font-light transition-colors',
                  selectedHour === hour
                    ? '!border-2 !border-solid !border-primary-500 !bg-primary-50 text-primary-500'
                    : '!border-[0.5px] !border-solid !border-neutral-100 !bg-[#FCFCFC] text-neutral-800 hover:!bg-neutral-50',
                )}
              >
                {toFa(hour)}:۰۰
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center gap-4">
        <Button type="button" variant="secondary" className="h-10 w-[160px]" onClick={onPrev}>
          قبلی
        </Button>
        <Button
          type="button"
          variant="primary"
          className="h-10 w-[300px]"
          disabled={selectedHour == null}
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
