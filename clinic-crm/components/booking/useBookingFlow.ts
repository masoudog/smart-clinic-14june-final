'use client';

import { useCallback, useReducer } from 'react';
import { bookingService } from '@/lib/mock/bookingService';
import { getJalaliToday, dateKeyFor } from '@/lib/jalali';
import type { LocationRecord } from '@/lib/locationService';

// Phase 4.0 scaffold, extended in Phase 4.1 (New Patient intake), Phase 4.2
// (New Patient submission + terminal states), Phase 5.0 (Existing Patient /
// Iran: reference code, date, time, checkout, terminal states), and Phase
// 5.1 (Existing Patient / Abroad: location/timezone step inserted between
// Code and Date, same shell — region is a parameter, not a forked flow).

export type BookingPersona = 'new' | 'existing' | null;

export type BookingStep =
  | 'entry'
  | 'new-intake'
  | 'new-terminal'
  | 'existing-code'
  | 'existing-location'
  | 'existing-date'
  | 'existing-time'
  | 'existing-checkout'
  | 'existing-terminal';

export type NewPatientTerminalStatus = 'success' | 'error' | 'no-service';

export interface NewPatientIntakeData {
  fullName: string;
  phone: string;
  referrerName: string;
  reason: string;
}

export type NewPatientIntakeField = keyof NewPatientIntakeData;

export type NewPatientIntakeErrors = Partial<Record<NewPatientIntakeField, string>>;

export type ExistingPatientRegion = 'iran' | 'abroad' | null;

export type ExistingPatientTerminalStatus = 'success' | 'error';

export interface ExistingPatientData {
  referenceCode: string;
  referenceCodeError?: string;
  region: ExistingPatientRegion;
  patientName: string;
  forcePaymentFailure: boolean;
  selectedLocation: LocationRecord | null;
  viewYear: number;
  viewMonth: number;
  selectedDateKey: string | null;
  selectedHour: number | null;
  terminal: ExistingPatientTerminalStatus | null;
  referenceNumber: string | null;
}

export interface BookingFlowState {
  persona: BookingPersona;
  step: BookingStep;
  newPatientIntake: NewPatientIntakeData;
  newPatientIntakeErrors: NewPatientIntakeErrors;
  isValidatingIntake: boolean;
  newPatientTerminal: NewPatientTerminalStatus | null;
  existingPatient: ExistingPatientData;
  isVerifyingCode: boolean;
  isSubmittingPayment: boolean;
}

type BookingFlowAction =
  | { type: 'SET_PERSONA'; persona: BookingPersona }
  | { type: 'GO_TO_NEW_INTAKE' }
  | { type: 'GO_TO_ENTRY' }
  | { type: 'SET_INTAKE_FIELD'; field: NewPatientIntakeField; value: string }
  | { type: 'SET_INTAKE_ERRORS'; errors: NewPatientIntakeErrors }
  | { type: 'SET_VALIDATING_INTAKE'; value: boolean }
  | { type: 'GO_TO_NEW_TERMINAL'; status: NewPatientTerminalStatus }
  | { type: 'RETRY_INTAKE' }
  | { type: 'RESET_BOOKING_FLOW' }
  | { type: 'GO_TO_EXISTING_CODE' }
  | { type: 'SET_REFERENCE_CODE'; value: string }
  | { type: 'SET_VERIFYING_CODE'; value: boolean }
  | { type: 'SET_REFERENCE_CODE_ERROR'; error: string }
  | {
      type: 'REFERENCE_CODE_VERIFIED';
      region: 'iran' | 'abroad';
      patientName: string;
      forcePaymentFailure: boolean;
    }
  | { type: 'GO_TO_EXISTING_LOCATION' }
  | { type: 'SELECT_LOCATION'; location: LocationRecord }
  | { type: 'GO_TO_EXISTING_DATE' }
  | { type: 'SET_VIEW_MONTH'; year: number; monthIdx: number }
  | { type: 'SELECT_DATE'; dateKey: string }
  | { type: 'GO_TO_EXISTING_TIME' }
  | { type: 'SELECT_HOUR'; hour: number }
  | { type: 'GO_TO_EXISTING_CHECKOUT' }
  | { type: 'SET_SUBMITTING_PAYMENT'; value: boolean }
  | { type: 'PAYMENT_RESULT'; status: ExistingPatientTerminalStatus; referenceNumber: string | null }
  | { type: 'RETRY_PAYMENT' };

const initialIntake: NewPatientIntakeData = {
  fullName: '',
  phone: '',
  referrerName: '',
  reason: '',
};

const today = getJalaliToday();

const initialExistingPatient: ExistingPatientData = {
  referenceCode: '',
  referenceCodeError: undefined,
  region: null,
  patientName: '',
  forcePaymentFailure: false,
  selectedLocation: null,
  viewYear: today.year,
  viewMonth: today.monthIdx,
  selectedDateKey: null,
  selectedHour: null,
  terminal: null,
  referenceNumber: null,
};

const initialState: BookingFlowState = {
  persona: null,
  step: 'entry',
  newPatientIntake: initialIntake,
  newPatientIntakeErrors: {},
  isValidatingIntake: false,
  newPatientTerminal: null,
  existingPatient: initialExistingPatient,
  isVerifyingCode: false,
  isSubmittingPayment: false,
};

function bookingFlowReducer(
  state: BookingFlowState,
  action: BookingFlowAction,
): BookingFlowState {
  switch (action.type) {
    case 'SET_PERSONA':
      return { ...state, persona: action.persona };
    case 'GO_TO_NEW_INTAKE':
      return { ...state, step: 'new-intake' };
    case 'GO_TO_ENTRY':
      return { ...state, step: 'entry' };
    case 'SET_INTAKE_FIELD':
      return {
        ...state,
        newPatientIntake: { ...state.newPatientIntake, [action.field]: action.value },
        newPatientIntakeErrors: { ...state.newPatientIntakeErrors, [action.field]: undefined },
      };
    case 'SET_INTAKE_ERRORS':
      return { ...state, newPatientIntakeErrors: action.errors };
    case 'SET_VALIDATING_INTAKE':
      return { ...state, isValidatingIntake: action.value };
    case 'GO_TO_NEW_TERMINAL':
      return { ...state, step: 'new-terminal', newPatientTerminal: action.status };
    case 'RETRY_INTAKE':
      return { ...state, step: 'new-intake', newPatientTerminal: null, newPatientIntakeErrors: {} };
    case 'RESET_BOOKING_FLOW':
      return initialState;

    case 'GO_TO_EXISTING_CODE':
      return { ...state, step: 'existing-code' };
    case 'SET_REFERENCE_CODE':
      return {
        ...state,
        existingPatient: {
          ...state.existingPatient,
          referenceCode: action.value,
          referenceCodeError: undefined,
        },
      };
    case 'SET_VERIFYING_CODE':
      return { ...state, isVerifyingCode: action.value };
    case 'SET_REFERENCE_CODE_ERROR':
      return {
        ...state,
        existingPatient: { ...state.existingPatient, referenceCodeError: action.error },
      };
    case 'REFERENCE_CODE_VERIFIED':
      return {
        ...state,
        step: action.region === 'abroad' ? 'existing-location' : 'existing-date',
        existingPatient: {
          ...state.existingPatient,
          region: action.region,
          patientName: action.patientName,
          forcePaymentFailure: action.forcePaymentFailure,
          referenceCodeError: undefined,
        },
      };
    case 'GO_TO_EXISTING_LOCATION':
      return { ...state, step: 'existing-location' };
    case 'SELECT_LOCATION':
      return {
        ...state,
        existingPatient: { ...state.existingPatient, selectedLocation: action.location },
      };
    case 'GO_TO_EXISTING_DATE':
      return { ...state, step: 'existing-date' };
    case 'SET_VIEW_MONTH':
      return {
        ...state,
        existingPatient: { ...state.existingPatient, viewYear: action.year, viewMonth: action.monthIdx },
      };
    case 'SELECT_DATE':
      return {
        ...state,
        existingPatient: { ...state.existingPatient, selectedDateKey: action.dateKey, selectedHour: null },
      };
    case 'GO_TO_EXISTING_TIME':
      return { ...state, step: 'existing-time' };
    case 'SELECT_HOUR':
      return { ...state, existingPatient: { ...state.existingPatient, selectedHour: action.hour } };
    case 'GO_TO_EXISTING_CHECKOUT':
      return { ...state, step: 'existing-checkout' };
    case 'SET_SUBMITTING_PAYMENT':
      return { ...state, isSubmittingPayment: action.value };
    case 'PAYMENT_RESULT':
      return {
        ...state,
        step: 'existing-terminal',
        existingPatient: {
          ...state.existingPatient,
          terminal: action.status,
          referenceNumber: action.referenceNumber,
        },
      };
    case 'RETRY_PAYMENT':
      return {
        ...state,
        step: 'existing-checkout',
        existingPatient: { ...state.existingPatient, terminal: null },
      };

    default:
      return state;
  }
}

export function useBookingFlow() {
  const [state, dispatch] = useReducer(bookingFlowReducer, initialState);

  const setPersona = useCallback((persona: BookingPersona) => {
    dispatch({ type: 'SET_PERSONA', persona });
  }, []);

  const goToNewIntake = useCallback(() => {
    dispatch({ type: 'GO_TO_NEW_INTAKE' });
  }, []);

  const goToEntry = useCallback(() => {
    dispatch({ type: 'GO_TO_ENTRY' });
  }, []);

  const setIntakeField = useCallback((field: NewPatientIntakeField, value: string) => {
    dispatch({ type: 'SET_INTAKE_FIELD', field, value });
  }, []);

  const retryIntake = useCallback(() => {
    dispatch({ type: 'RETRY_INTAKE' });
  }, []);

  const resetBookingFlow = useCallback(() => {
    dispatch({ type: 'RESET_BOOKING_FLOW' });
  }, []);

  // Validates (mock duplicate-name check), then submits (mock submitBooking)
  // and lands on the matching terminal state. No review/confirmation step —
  // confirmed with you that none exists in the design (Phase 4.2).
  const submitNewPatientIntake = useCallback(async () => {
    const fullName = state.newPatientIntake.fullName.trim();
    if (!fullName) return;

    dispatch({ type: 'SET_VALIDATING_INTAKE', value: true });

    const { isDuplicate } = await bookingService.checkNewPatientName(fullName);
    if (isDuplicate) {
      dispatch({ type: 'SET_VALIDATING_INTAKE', value: false });
      dispatch({
        type: 'SET_INTAKE_ERRORS',
        errors: { fullName: 'این نام قبلا ثبت شده است' },
      });
      return;
    }
    dispatch({ type: 'SET_INTAKE_ERRORS', errors: {} });

    const result = await bookingService.submitBooking({
      fullName,
      phone: state.newPatientIntake.phone.trim(),
      referrerName: state.newPatientIntake.referrerName.trim(),
      reason: state.newPatientIntake.reason.trim(),
    });
    dispatch({ type: 'SET_VALIDATING_INTAKE', value: false });
    dispatch({ type: 'GO_TO_NEW_TERMINAL', status: result.status });
  }, [state.newPatientIntake]);

  const goToExistingCode = useCallback(() => {
    dispatch({ type: 'GO_TO_EXISTING_CODE' });
  }, []);

  const setReferenceCode = useCallback((value: string) => {
    dispatch({ type: 'SET_REFERENCE_CODE', value });
  }, []);

  // Region ("Iran" vs "Abroad") is resolved purely from the reference code
  // (per your instruction) — no separate region-detection step exists.
  // Phase 5.1: Abroad codes now proceed to the location/timezone step
  // instead of the "not implemented" error this used to show.
  const submitReferenceCode = useCallback(async () => {
    const code = state.existingPatient.referenceCode.trim();
    if (!/^\d{6}$/.test(code)) return;

    dispatch({ type: 'SET_VERIFYING_CODE', value: true });
    const result = await bookingService.verifyReferenceCode(code);
    dispatch({ type: 'SET_VERIFYING_CODE', value: false });

    if (!result.valid) {
      dispatch({ type: 'SET_REFERENCE_CODE_ERROR', error: 'کد مرجع وارد شده اشتباه است.' });
      return;
    }

    dispatch({
      type: 'REFERENCE_CODE_VERIFIED',
      region: result.region,
      patientName: result.patientName,
      forcePaymentFailure: result.forcePaymentFailure,
    });
  }, [state.existingPatient.referenceCode]);

  const goToExistingLocation = useCallback(() => {
    dispatch({ type: 'GO_TO_EXISTING_LOCATION' });
  }, []);

  const selectLocation = useCallback((location: LocationRecord) => {
    dispatch({ type: 'SELECT_LOCATION', location });
  }, []);

  const goToExistingDate = useCallback(() => {
    dispatch({ type: 'GO_TO_EXISTING_DATE' });
  }, []);

  const setViewMonth = useCallback((year: number, monthIdx: number) => {
    dispatch({ type: 'SET_VIEW_MONTH', year, monthIdx });
  }, []);

  const selectDate = useCallback((year: number, monthIdx: number, day: number) => {
    dispatch({ type: 'SELECT_DATE', dateKey: dateKeyFor(year, monthIdx, day) });
  }, []);

  const goToExistingTime = useCallback(() => {
    dispatch({ type: 'GO_TO_EXISTING_TIME' });
  }, []);

  const selectHour = useCallback((hour: number) => {
    dispatch({ type: 'SELECT_HOUR', hour });
  }, []);

  const goToExistingCheckout = useCallback(() => {
    dispatch({ type: 'GO_TO_EXISTING_CHECKOUT' });
  }, []);

  const submitPayment = useCallback(async () => {
    dispatch({ type: 'SET_SUBMITTING_PAYMENT', value: true });
    const result = await bookingService.submitAppointmentPayment({
      forcePaymentFailure: state.existingPatient.forcePaymentFailure,
    });
    dispatch({ type: 'SET_SUBMITTING_PAYMENT', value: false });
    dispatch({
      type: 'PAYMENT_RESULT',
      status: result.status,
      referenceNumber: result.status === 'success' ? result.referenceNumber : null,
    });
  }, [state.existingPatient.forcePaymentFailure]);

  const retryPayment = useCallback(() => {
    dispatch({ type: 'RETRY_PAYMENT' });
  }, []);

  return {
    state,
    setPersona,
    goToNewIntake,
    goToEntry,
    setIntakeField,
    submitNewPatientIntake,
    retryIntake,
    resetBookingFlow,
    goToExistingCode,
    setReferenceCode,
    submitReferenceCode,
    goToExistingLocation,
    selectLocation,
    goToExistingDate,
    setViewMonth,
    selectDate,
    goToExistingTime,
    selectHour,
    goToExistingCheckout,
    submitPayment,
    retryPayment,
  };
}
