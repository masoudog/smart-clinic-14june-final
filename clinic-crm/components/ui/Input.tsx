'use client';

import React from 'react';
import { cn, toEn, toFa } from '@/lib/utils';

interface InputProps {
  label?: string;
  required?: boolean;
  error?: string;
  multiline?: boolean;
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  name?: string;
  type?: string;
  inputMode?: React.InputHTMLAttributes<HTMLInputElement>['inputMode'];
  autoFocus?: boolean;
  rows?: number;
  // Digits-only field (reference code, phone number, ...): accepts both
  // English and Persian digits as typed or pasted, always displays Persian
  // digits, strips any non-digit character, and reports the value back to
  // `onChange` already normalized to English digits — callers don't need to
  // do any of this themselves, `value`/`onChange` keep their existing shape.
  numeric?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  className?: string;
  containerClassName?: string;
}

/**
 * Figma-grounded field primitive — node 184:2158 "Inputs" component-states sheet.
 * Implements: Default, Filled, Error, Defaul-number/Filled-number (pass type="tel"), Reason (multiline).
 *
 * NOT implemented here: Timezone / Time zone-selected. Those states are a searchable
 * combobox (search field + scrollable menu + selected-item row) — a structurally different
 * widget from a plain field. Flagged as a separate future component (e.g. TimezoneCombobox)
 * rather than folded into this primitive; see the Phase 2 QA report.
 *
 * Judgment call (flagged, not silently assumed): Figma names the darker-border state
 * "Filled" (implying value-presence), not "Focused". This implementation darkens the
 * border on browser focus instead of on value-presence, since a value-presence-only
 * border with no focus indication at all would be an accessibility gap the static
 * Figma frames don't actually settle either way.
 */
export default function Input({
  label,
  required,
  error,
  multiline,
  className,
  containerClassName,
  rows,
  numeric,
  value,
  onChange,
  inputMode,
  ...rest
}: InputProps) {
  const hasError = !!error;

  const displayValue = numeric && typeof value === 'string' ? toFa(value) : value;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (numeric) {
      // Same path handles typing and paste alike, since both fire a change
      // event — normalize Persian/English digits to English, drop anything
      // else, so callers always receive a plain digits-only string.
      e.target.value = toEn(e.target.value).replace(/[^0-9]/g, '');
    }
    onChange?.(e);
  };

  const resolvedInputMode = numeric ? 'numeric' : inputMode;

  const AlertIcon = () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0 text-red-500"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );

  const shellBase = cn(
    'w-full rounded-[8px] bg-white text-body text-neutral-900 outline-none transition-colors',
    'placeholder:text-neutral-300',
    'shadow-[0_1px_2px_rgba(0,0,0,0.05)]'
  );

  return (
    <div className={cn('flex w-full flex-col items-end gap-1.5', containerClassName)}>
      {label && (
        <p className="w-full text-right text-body text-neutral-800" dir="auto">
          {label} {required && <span className="text-red-500">*</span>}
        </p>
      )}

      {hasError ? (
        <div className={cn(shellBase, 'flex items-center gap-2 border border-red-500 px-3 py-2')}>
          <AlertIcon />
          <input
            dir="auto"
            className="w-full flex-1 bg-transparent text-right outline-none"
            value={displayValue}
            onChange={handleChange}
            inputMode={resolvedInputMode}
            {...rest}
          />
        </div>
      ) : multiline ? (
        <textarea
          dir="auto"
          rows={rows ?? 4}
          className={cn(
            shellBase,
            'h-[150px] resize-none border border-neutral-100 px-3.5 py-3 text-right focus:border-neutral-500',
            className
          )}
          value={displayValue}
          onChange={handleChange}
          inputMode={resolvedInputMode}
          {...rest}
        />
      ) : (
        <input
          dir="auto"
          className={cn(
            shellBase,
            'h-11 border border-neutral-100 px-3.5 py-2.5 text-right focus:border-neutral-500',
            className
          )}
          value={displayValue}
          onChange={handleChange}
          inputMode={resolvedInputMode}
          {...rest}
        />
      )}

      {hasError && (
        <p className="w-full text-right text-body text-red-500" dir="auto">
          {error}
        </p>
      )}
    </div>
  );
}
