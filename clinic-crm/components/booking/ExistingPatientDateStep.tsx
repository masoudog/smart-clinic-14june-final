'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { cn, toFa } from '@/lib/utils';
import Button from '@/components/ui/Button';
import StepperIndicator from '@/components/ui/StepperIndicator';
import { buildExistingPatientSteps } from './existingPatientSteps';
import type { ExistingPatientRegion } from './useBookingFlow';
import {
  MONTHS,
  DAY_INITIALS,
  getJalaliToday,
  monthGrid,
  isDayAvailable,
  dateKeyFor,
  toGregorian,
  gregorianShortLabel,
} from '@/lib/jalali';

// Phase 5.0 — Iran flow date-selection step, built from public/iran-date.png /
// public/iran-date-selected.png (524×640px, adjusted +30px then +10px per
// review — the last calendar row was clipping) and public/iran-date-picker.png
// (calendar card, 476×372px likewise adjusted, shadow Y8/blur24/black16%). A
// later +50px pass applied to Iran during the Abroad correction cycle was
// reverted — that height increase was meant for Abroad only.
//
// Navigation arrows follow RTL reading direction per your explicit
// instruction: the right arrow (aligned above Saturday's column) moves to
// the previous month; the left arrow (aligned above Friday's column) moves
// to the next month. No upper bound on forward navigation; only the past is
// blocked — today itself is not bookable either, only strictly future days.
//
// Clicking the month or year label opens a scrollable list to jump directly
// to a month/year instead of only stepping one at a time. The year list is
// bounded to today's year through +5 years — an arbitrary but reasonable
// finite window for a dropdown (no Figma spec exists for this control,
// since forward navigation itself has no stated upper bound) — flagged as a
// judgment call, not a literal spec value.
//
// Phase 5.1 — extended (not duplicated) for the Abroad region: the calendar
// card is 476×392px (vs. Iran's 372px) and each day cell also shows the
// Gregorian equivalent (English numerals, 8px) beneath the Jalali number
// (14px), per public/abroad-date-picker.png. The stepper now comes from the
// shared `buildExistingPatientSteps` helper so Abroad's 6-step list (with
// "مکان") renders correctly; Iran's behavior/sizing is otherwise unchanged.

const YEAR_OPTIONS_COUNT = 6;

interface ExistingPatientDateStepProps {
  region: ExistingPatientRegion;
  viewYear: number;
  viewMonth: number;
  selectedDateKey: string | null;
  onViewMonthChange: (year: number, monthIdx: number) => void;
  onSelectDate: (year: number, monthIdx: number, day: number) => void;
  onNext: () => void;
  onPrev: () => void;
}

const ChevRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);
const ChevLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);
const CaretDown = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

export default function ExistingPatientDateStep({
  region,
  viewYear,
  viewMonth,
  selectedDateKey,
  onViewMonthChange,
  onSelectDate,
  onNext,
  onPrev,
}: ExistingPatientDateStepProps) {
  const isAbroad = region === 'abroad';
  const today = useMemo(() => getJalaliToday(), []);
  const weeks = useMemo(() => monthGrid(viewYear, viewMonth, today), [viewYear, viewMonth, today]);

  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const [yearPickerOpen, setYearPickerOpen] = useState(false);
  const monthPickerRef = useRef<HTMLDivElement>(null);
  const yearPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (monthPickerRef.current && !monthPickerRef.current.contains(e.target as Node)) {
        setMonthPickerOpen(false);
      }
      if (yearPickerRef.current && !yearPickerRef.current.contains(e.target as Node)) {
        setYearPickerOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const yearOptions = useMemo(
    () => Array.from({ length: YEAR_OPTIONS_COUNT }, (_, i) => today.year + i),
    [today.year],
  );

  // No upper bound on how far forward booking can navigate (per your
  // instruction) — only the past is blocked (can't view before today's month).
  const monthsFromToday = (viewYear - today.year) * 12 + (viewMonth - today.monthIdx);
  const canPrevMonth = monthsFromToday > 0;
  const canNextMonth = true;

  const stepMonth = (dir: number) => {
    let y = viewYear;
    let m = viewMonth + dir;
    if (m > 11) {
      m = 0;
      y++;
    } else if (m < 0) {
      m = 11;
      y--;
    }
    onViewMonthChange(y, m);
  };

  const selectMonth = (monthIdx: number) => {
    onViewMonthChange(viewYear, monthIdx);
    setMonthPickerOpen(false);
  };

  const selectYear = (year: number) => {
    onViewMonthChange(year, viewMonth);
    setYearPickerOpen(false);
  };

  return (
    <div className="flex h-full flex-col">
      <h2 className="text-center text-h5 font-medium text-neutral-900">رزرو آنلاین نوبت</h2>

      <StepperIndicator steps={buildExistingPatientSteps(region, 'date')} className="mt-6" />

      <p className="mt-6 text-right text-small text-neutral-700">تاریخ مراجعه را انتخاب کنید</p>

      <div
        className="mt-4 w-full rounded-[8px] bg-white p-4 shadow-[0_8px_24px_rgba(0,0,0,0.16)]"
        style={{ height: isAbroad ? 382 : 372 }}
      >
        <div className="grid grid-cols-7 items-center">
          <div className="flex justify-center">
            <button
              type="button"
              disabled={!canPrevMonth}
              onClick={() => stepMonth(-1)}
              aria-label="ماه قبل"
              className="text-neutral-500 disabled:opacity-30"
            >
              <ChevRight />
            </button>
          </div>

          <div className="col-span-5 flex items-center justify-center gap-4 text-body font-medium text-neutral-900">
            <div ref={monthPickerRef} className="relative">
              <button
                type="button"
                onClick={() => {
                  setMonthPickerOpen((v) => !v);
                  setYearPickerOpen(false);
                }}
                className="flex items-center gap-1"
              >
                {MONTHS[viewMonth]}
                <CaretDown />
              </button>
              {monthPickerOpen && (
                <div className="absolute right-1/2 top-full z-10 mt-1 max-h-[180px] w-[140px] translate-x-1/2 overflow-y-auto rounded-[8px] border border-neutral-100 bg-white p-1 shadow-[0_8px_24px_rgba(0,0,0,0.16)]">
                  {MONTHS.map((m, idx) => {
                    const disabled = viewYear === today.year && idx < today.monthIdx;
                    return (
                      <button
                        key={m}
                        type="button"
                        disabled={disabled}
                        onClick={() => selectMonth(idx)}
                        className={cn(
                          'block w-full rounded-[6px] px-3 py-1.5 text-right text-body',
                          idx === viewMonth
                            ? 'bg-primary-50 text-primary-500'
                            : disabled
                              ? 'text-neutral-300'
                              : 'text-neutral-900 hover:bg-neutral-50',
                        )}
                      >
                        {m}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div ref={yearPickerRef} className="relative">
              <button
                type="button"
                onClick={() => {
                  setYearPickerOpen((v) => !v);
                  setMonthPickerOpen(false);
                }}
                className="flex items-center gap-1"
              >
                {toFa(viewYear)}
                <CaretDown />
              </button>
              {yearPickerOpen && (
                <div className="absolute right-1/2 top-full z-10 mt-1 max-h-[180px] w-[100px] translate-x-1/2 overflow-y-auto rounded-[8px] border border-neutral-100 bg-white p-1 shadow-[0_8px_24px_rgba(0,0,0,0.16)]">
                  {yearOptions.map((y) => (
                    <button
                      key={y}
                      type="button"
                      onClick={() => selectYear(y)}
                      className={cn(
                        'block w-full rounded-[6px] px-3 py-1.5 text-right text-body',
                        y === viewYear ? 'bg-primary-50 text-primary-500' : 'text-neutral-900 hover:bg-neutral-50',
                      )}
                    >
                      {toFa(y)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-center">
            <button
              type="button"
              disabled={!canNextMonth}
              onClick={() => stepMonth(1)}
              aria-label="ماه بعد"
              className="text-neutral-500 disabled:opacity-30"
            >
              <ChevLeft />
            </button>
          </div>
        </div>

        <div className="mt-2 grid grid-cols-7">
          {DAY_INITIALS.map((d) => (
            <div key={d} className="flex h-8 items-center justify-center text-small text-neutral-400">
              {d}
            </div>
          ))}
        </div>

        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7">
            {week.map((d, di) => {
              if (d == null) return <div key={di} className="h-10" />;
              const available = isDayAvailable(viewYear, viewMonth, d, today);
              const key = dateKeyFor(viewYear, viewMonth, d);
              const selected = selectedDateKey === key;
              const gregorianLabel = isAbroad ? gregorianShortLabel(toGregorian(viewYear, viewMonth, d, today)) : null;
              return (
                <div key={di} className="flex items-center justify-center py-1">
                  <button
                    type="button"
                    disabled={!available}
                    onClick={() => onSelectDate(viewYear, viewMonth, d)}
                    className={cn(
                      'flex h-10 w-10 flex-col items-center justify-center rounded-[8px] transition-colors',
                      isAbroad ? 'text-caption' : 'text-body',
                      selected
                        ? 'bg-primary-500 text-white'
                        : available
                          ? 'text-neutral-900 hover:bg-neutral-50'
                          : 'text-neutral-300',
                    )}
                  >
                    {toFa(d)}
                    {gregorianLabel && (
                      <span
                        className={cn(
                          'text-[8px] leading-none',
                          selected ? 'text-white' : available ? 'text-neutral-400' : 'text-neutral-300',
                        )}
                      >
                        {gregorianLabel}
                      </span>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="mt-auto flex items-center gap-4">
        <Button type="button" variant="secondary" className="h-10 w-[160px]" onClick={onPrev}>
          قبلی
        </Button>
        <Button
          type="button"
          variant="primary"
          className="h-10 w-[300px]"
          disabled={!selectedDateKey}
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
