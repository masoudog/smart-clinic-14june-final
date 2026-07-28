// Phase 4.0 scaffold — interface only, per SMART_CLINIC_MIGRATION_PLAN.md §5.
// Method bodies are filled in as each downstream step defines its real
// payload/return shape: checkNewPatientName in Phase 4.1, submitBooking in
// Phase 4.2, verifyReferenceCode/submitAppointmentPayment in Phase 5.0.
// verifyOtp/lookupPatientByPhone remain unused stubs — the actual Phase 5.0
// design identifies existing patients by a single reference code, not a
// phone+OTP exchange, so these two never ended up needed. Left in place
// (harmless) rather than removed, in case a real phone/OTP mechanism is
// reintroduced later.

export type SubmitBookingResult =
  | { status: 'success' }
  | { status: 'error' }
  | { status: 'no-service' };

export type ReferenceCodeResult =
  | { valid: true; region: 'iran' | 'abroad'; patientName: string; forcePaymentFailure: boolean }
  | { valid: false };

export type PaymentResult =
  | { status: 'success'; referenceNumber: string }
  | { status: 'error' };

export interface BookingServiceApi {
  submitBooking: (payload: unknown) => Promise<SubmitBookingResult>;
  verifyOtp: (phone: string, code: string) => Promise<unknown>;
  lookupPatientByPhone: (phone: string) => Promise<unknown>;
  checkNewPatientName: (fullName: string) => Promise<{ isDuplicate: boolean }>;
  verifyReferenceCode: (code: string) => Promise<ReferenceCodeResult>;
  submitAppointmentPayment: (payload: { forcePaymentFailure: boolean }) => Promise<PaymentResult>;
}

const notImplemented = (name: string) => () => {
  throw new Error(`bookingService.${name} not implemented yet (Phase 4.0 scaffold)`);
};

// Static mock fixture (§5 "Static mock fixtures" — read-only reference data, not
// mutated): a name already "on file" so the duplicate-name error path is demoable.
const EXISTING_PATIENT_NAMES = ['حسین ملکی'];

const checkNewPatientName = (fullName: string): Promise<{ isDuplicate: boolean }> =>
  new Promise((resolve) => {
    setTimeout(() => {
      resolve({ isDuplicate: EXISTING_PATIENT_NAMES.includes(fullName.trim()) });
    }, 400);
  });

// Static mock clinic settings (§5 "static mock fixtures") — mirrors the real
// ClinicSettings.onlineBookingEnabled concept from lib/types.ts without
// importing/touching that (dashboard-shared) type this phase. Forces the
// No-service terminal state for every submission when false.
const MOCK_CLINIC_SETTINGS = { onlineBookingEnabled: true };

// Demo-only triggers (Phase 4.2, approved): there's no real backend to decide
// a submission's outcome, so two reserved substrings in the full name let
// every terminal state be reached deterministically for testing/demo, on top
// of the settings flag above. Not a real validation rule — purely a mock-data
// convenience, same spirit as the duplicate-name fixture.
// Priority: error trigger is checked first, then the settings flag / no-service
// trigger, then success — error must win even if a name also matches no-service.
const ERROR_TRIGGER = 'ارور';
const NO_SERVICE_TRIGGER = 'تعطیل';

const submitBooking = (payload: unknown): Promise<SubmitBookingResult> =>
  new Promise((resolve) => {
    setTimeout(() => {
      const fullName = (payload as { fullName?: string })?.fullName ?? '';
      if (fullName.includes(ERROR_TRIGGER)) {
        resolve({ status: 'error' });
      } else if (!MOCK_CLINIC_SETTINGS.onlineBookingEnabled || fullName.includes(NO_SERVICE_TRIGGER)) {
        resolve({ status: 'no-service' });
      } else {
        resolve({ status: 'success' });
      }
    }, 600);
  });

// Static mock reference-code directory (§5 "static mock fixtures" — read-only,
// existing "patients on file"). Existing patients don't retype their name;
// it's looked up from the record their code identifies. '444444' and
// '555555' are dev-only demo codes (your explicit instruction, Phase 5.0 and
// 5.1 respectively) that resolve as a normal patient of their region but
// always fail at the payment step, so the checkout Error screen is
// reachable on demand for each region independently — remove once a real
// payment gateway replaces this mock.
const REFERENCE_CODE_RECORDS: Record<
  string,
  { region: 'iran' | 'abroad'; patientName: string; forcePaymentFailure?: boolean }
> = {
  '111111': { region: 'iran', patientName: 'حسین ملکی' },
  '222222': { region: 'abroad', patientName: 'مریم احمدی' },
  '444444': { region: 'iran', patientName: 'حسین ملکی', forcePaymentFailure: true },
  '555555': { region: 'abroad', patientName: 'مریم احمدی', forcePaymentFailure: true },
};

const verifyReferenceCode = (code: string): Promise<ReferenceCodeResult> =>
  new Promise((resolve) => {
    setTimeout(() => {
      const record = REFERENCE_CODE_RECORDS[code.trim()];
      resolve(
        record
          ? {
              valid: true,
              region: record.region,
              patientName: record.patientName,
              forcePaymentFailure: !!record.forcePaymentFailure,
            }
          : { valid: false },
      );
    }, 400);
  });

const generateMockReferenceNumber = (): string =>
  String(Math.floor(1000000000 + Math.random() * 9000000000));

const submitAppointmentPayment = (payload: { forcePaymentFailure: boolean }): Promise<PaymentResult> =>
  new Promise((resolve) => {
    setTimeout(() => {
      if (payload.forcePaymentFailure) {
        resolve({ status: 'error' });
      } else {
        resolve({ status: 'success', referenceNumber: generateMockReferenceNumber() });
      }
    }, 600);
  });

export const bookingService: BookingServiceApi = {
  submitBooking,
  verifyOtp: notImplemented('verifyOtp'),
  lookupPatientByPhone: notImplemented('lookupPatientByPhone'),
  checkNewPatientName,
  verifyReferenceCode,
  submitAppointmentPayment,
};
