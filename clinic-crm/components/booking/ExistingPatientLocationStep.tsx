'use client';

import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import Button from '@/components/ui/Button';
import StepperIndicator from '@/components/ui/StepperIndicator';
import { buildExistingPatientSteps } from './existingPatientSteps';
import { locationService, formatUtcOffset, type LocationRecord } from '@/lib/locationService';

// Phase 5.1 — Abroad flow location/timezone step, built from
// public/abroad-time-zone.png (524×330px, closed) and
// public/abroad-time-zone-selected.png (524×570px, open). The trigger and
// dropdown use dir="ltr" since city/timezone content is Latin script — the
// same precedent the Phase 2 primitives review flagged for a future
// TimezoneCombobox (mixed Latin content inside an RTL form). The UI talks
// only to lib/locationService.ts, never to the mock dataset directly, so
// the mock can later be swapped for a real backend/timezone-data library
// without this component changing.
//
// Dropdown option format ("City  (UTC+H:MM)") matches the reference
// screenshot literally; the prose spec's "GMT+1" shorthand was treated as a
// paraphrase for illustration, not a literal format — flagged for review.
// The screenshot's "or 5:36 am" live-clock hint next to the selected value
// was left out as a deliberate simplification (not explicitly requested,
// and would need a ticking clock) — flagged, not silently dropped.
//
// The trigger's border classes need the `!` (important) modifier: same
// unlayered `button { border: none; ... }` reset in app/globals.css
// documented in ExistingPatientTimeStep.tsx (and originally the Phase 3.1
// nav-link bug) otherwise silently wins over plain Tailwind border classes
// on any <button>.

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);
const CaretDown = ({ className }: { className?: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);
const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

// Open dropdown is a fixed 476×218px per your correction — the search row
// is a fixed height and the results list fills the remainder (flex-1),
// which naturally shows ~3 rows before scrolling.
const DROPDOWN_WIDTH = 476;
const DROPDOWN_HEIGHT = 218;

interface ExistingPatientLocationStepProps {
  selectedLocation: LocationRecord | null;
  onSelectLocation: (location: LocationRecord) => void;
  onNext: () => void;
  onPrev: () => void;
  onOpenChange: (open: boolean) => void;
}

export default function ExistingPatientLocationStep({
  selectedLocation,
  onSelectLocation,
  onNext,
  onPrev,
  onOpenChange,
}: ExistingPatientLocationStepProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LocationRecord[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    onOpenChange(open);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    locationService.searchLocations(query).then((locations) => {
      if (!cancelled) setResults(locations);
    });
    return () => {
      cancelled = true;
    };
  }, [open, query]);

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  return (
    <div className="flex h-full flex-col">
      <h2 className="text-center text-h5 font-medium text-neutral-900">رزرو آنلاین نوبت</h2>

      <StepperIndicator steps={buildExistingPatientSteps('abroad', 'location')} className="mt-6" />

      <p className="mt-6 text-right text-small text-neutral-700">موقعیت مکانی خود را انتخاب کنید</p>
      <p className="mt-2 text-right text-body text-neutral-700">موقعیت زمان شما:</p>

      <div ref={containerRef} dir="ltr" className="relative mt-2">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={cn(
            'flex h-12 w-full items-center justify-between rounded-[8px] bg-white px-4 text-body',
            '!border !border-solid',
            open ? '!border-neutral-500' : '!border-neutral-100',
          )}
        >
          <span className={selectedLocation ? 'text-neutral-900' : 'text-neutral-300'}>
            {selectedLocation
              ? `${selectedLocation.city} (${formatUtcOffset(selectedLocation.utcOffsetMinutes)})`
              : 'Select your time zone'}
          </span>
          <CaretDown className={cn('shrink-0 text-neutral-500 transition-transform', open && 'rotate-180')} />
        </button>

        {open && (
          <div
            className="absolute inset-x-0 top-full z-10 mt-1 flex flex-col rounded-[8px] border border-neutral-100 bg-white p-2 shadow-[0_8px_24px_rgba(0,0,0,0.16)]"
            style={{ width: DROPDOWN_WIDTH, height: DROPDOWN_HEIGHT }}
          >
            <div className="flex shrink-0 items-center gap-2 rounded-[8px] border border-neutral-100 px-3 py-2">
              <SearchIcon />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search"
                className="w-full text-body text-neutral-900 outline-none placeholder:text-neutral-300"
              />
            </div>

            <div className="mt-2 flex-1 overflow-y-auto">
              {results.map((loc) => {
                const isSelected = selectedLocation?.id === loc.id;
                return (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => {
                      onSelectLocation(loc);
                      setOpen(false);
                      setQuery('');
                    }}
                    className={cn(
                      'flex w-full items-center justify-between rounded-[8px] px-3 py-3 text-body',
                      isSelected ? 'bg-primary-50 text-primary-500' : 'text-neutral-900 hover:bg-neutral-50',
                    )}
                  >
                    <span>
                      <span className="font-medium">{loc.city}</span>{' '}
                      <span>({formatUtcOffset(loc.utcOffsetMinutes)})</span>
                    </span>
                    {isSelected && <CheckIcon />}
                  </button>
                );
              })}
              {results.length === 0 && (
                <p className="px-3 py-4 text-center text-caption text-neutral-400">No results</p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="mt-auto flex items-center gap-4">
        <Button type="button" variant="secondary" className="h-10 w-[160px]" onClick={onPrev}>
          قبلی
        </Button>
        <Button
          type="button"
          variant="primary"
          className="h-10 w-[300px]"
          disabled={!selectedLocation}
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
