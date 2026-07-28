import type { Step } from '@/components/ui/StepperIndicator';
import type { ExistingPatientRegion } from './useBookingFlow';

// Phase 5.1 — shared stepper-list builder for the Existing Patient shell.
// Previously each step component (Date/Time/Checkout) duplicated its own
// fixed 5-entry Iran-only step list. Abroad needs a 6th step ("مکان" /
// Location) inserted between Code and Date, so this is now a single shared
// helper parametrized by region, per the migration plan's §5 architecture
// principle ("Iran vs Abroad is a region parameter on one shared flow, not
// a forked codebase") — extending the existing components instead of
// duplicating them for Abroad.

export type ExistingPatientStepKey = 'file' | 'code' | 'location' | 'date' | 'time' | 'payment';

const STEP_LABELS: Record<ExistingPatientStepKey, string> = {
  file: 'پرونده',
  code: 'کد مرجع',
  location: 'مکان',
  date: 'تاریخ',
  time: 'ساعت',
  payment: 'پرداخت',
};

const IRAN_ORDER: ExistingPatientStepKey[] = ['file', 'code', 'date', 'time', 'payment'];
const ABROAD_ORDER: ExistingPatientStepKey[] = ['file', 'code', 'location', 'date', 'time', 'payment'];

export function buildExistingPatientSteps(
  region: ExistingPatientRegion,
  current: ExistingPatientStepKey,
): Step[] {
  const order = region === 'abroad' ? ABROAD_ORDER : IRAN_ORDER;
  const currentIdx = order.indexOf(current);
  return order.map((key, i) => ({
    key,
    label: STEP_LABELS[key],
    state: i < currentIdx ? 'done' : i === currentIdx ? 'current' : 'pending',
  }));
}
