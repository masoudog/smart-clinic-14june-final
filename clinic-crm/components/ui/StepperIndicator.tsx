'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export type StepState = 'pending' | 'current' | 'done';

export interface Step {
  key: string;
  label: string;
  state: StepState;
}

interface StepperIndicatorProps {
  steps: Step[];
  className?: string;
}

/**
 * Generic N-step progress indicator.
 *
 * Grounded in node 184:1213 "Progress Bar" (Reserved From Iran, "Date selected" state):
 * - pending: white circle, neutral-100 border.
 * - current: white circle, primary-500 border. Figma shows an inner "Proggressing
 *   Animation" asset here that could not be resolved from static code (and the
 *   rate limit blocked a follow-up motion-context pull) — approximated below as a
 *   static filled primary-500 dot. Flagged as inferred, not a literal reproduction.
 * - done: filled `#0d824b` circle (matches the `success-700` token exactly) with a checkmark.
 * - connector line: the Figma track segments use a raw `#c6c6c6`, which does not exactly
 *   match any sampled neutral-* step (closest is neutral-200 `#b9bdc7`). Reproduced here
 *   with the literal Figma value rather than silently substituted with the closest token —
 *   flagged in the Phase 2 QA report.
 *
 * Note (relevant to future phases, not this one): the real Iran-flow stepper has 5 steps
 * including a "پرداخت" (Payment) step not previously identified in the architecture
 * discovery — this component is intentionally generic/step-count-agnostic so that
 * discovery doesn't require rework here.
 */
export default function StepperIndicator({ steps, className }: StepperIndicatorProps) {
  const doneCount = steps.filter((s) => s.state === 'done').length;
  const fillPercent = steps.length > 1 ? (doneCount / (steps.length - 1)) * 100 : 0;

  return (
    <div className={cn('relative flex w-full items-start justify-between', className)}>
      <div className="absolute left-[33px] right-[33px] top-2.5 h-px -translate-y-1/2 rounded-full bg-[#c6c6c6]">
        <div
          className="h-full rounded-full bg-success-700 transition-all"
          style={{ width: `${fillPercent}%` }}
        />
      </div>

      {steps.map((s) => (
        <div key={s.key} className="relative z-10 flex w-12 flex-col items-center gap-0.5">
          <span
            className={cn(
              'flex size-5 items-center justify-center rounded-full border',
              s.state === 'pending' && 'border-neutral-100 bg-white',
              s.state === 'current' && 'border-primary-500 bg-white',
              s.state === 'done' && 'border-success-700 bg-success-700'
            )}
          >
            {s.state === 'current' && <span className="size-2 rounded-full bg-primary-500" />}
            {s.state === 'done' && (
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12l5 5L20 7" />
              </svg>
            )}
          </span>
          <span className="whitespace-nowrap text-small font-light text-neutral-800">{s.label}</span>
        </div>
      ))}
    </div>
  );
}
