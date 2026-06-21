// === DynamoDB Models ===

export interface Patient {
  id: string;
  clinicId: string;
  firstName: string;
  lastName: string;
  phone: string;
  age?: string;
  status: 'active' | 'inactive' | 'archived';
  color: 'sky' | 'sage' | 'beige' | 'lavender' | 'rose';
  lastSession?: string;
  sessions: number;
  tags: string[];
  notes: string;
  companion?: {
    relation: string;
    name: string;
    phone: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CalendarEvent {
  id: string;
  clinicId: string;
  day: number; // 0-6 (Sunday-Saturday)
  startHour: number;
  duration: number; // in hours
  therapistId: string;
  mode: 'in-person' | 'online';
  patientId?: string;
  name?: string;
  color?: string;
  buffer?: number;
  fromBooking?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BookingRequest {
  id: string;
  clinicId: string;
  firstName: string;
  lastName: string;
  phone: string;
  dateLabel: string;
  time: string;
  dow?: number;
  hour?: number;
  mode: 'in-person' | 'online';
  reason: string;
  double?: boolean;
  submittedAt: string;
  isReturning: boolean;
  source: 'online' | 'admin';
  color: string;
  status: 'pending' | 'scheduled' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  clinicId: string;
  type: 'booking' | 'session' | 'cancellation' | 'info';
  time: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

export interface ClinicSettings {
  clinicId: string;
  clinicName: string;
  onlineBookingEnabled: boolean;
  closedMessage?: string;
  sessionBuffer?: number; // minutes
  blockedSlots?: BlockedSlot[];
  workingDays: number[]; // 0-6 (Sunday-Saturday)
  workingHours: {
    start: number; // hour
    end: number; // hour
  };
  updatedAt: string;
}

export interface BlockedSlot {
  id: string;
  dateKey: string; // YYYY-MM-DD
  startHour: number;
  endHour: number;
  reason?: string;
}

export interface User {
  sub: string; // Cognito user ID
  email: string;
  name?: string;
  role: 'admin' | 'therapist';
  clinicId: string;
}
