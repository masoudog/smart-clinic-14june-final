// DynamoDB Service Layer
// Handles all database operations

import { Patient, CalendarEvent, BookingRequest, Notification, ClinicSettings } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

class DynamoDBService {
  private async fetchAPI(endpoint: string, method: string = 'GET', body?: any) {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getToken()}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  }

  private getToken(): string {
    if (typeof window === 'undefined') return '';
    const user = localStorage.getItem('clinic_user');
    return user ? JSON.parse(user).token || '' : '';
  }

  // Patients
  async getPatients(clinicId: string): Promise<Patient[]> {
    return this.fetchAPI(`/patients?clinicId=${clinicId}`);
  }

  async getPatient(clinicId: string, patientId: string): Promise<Patient> {
    return this.fetchAPI(`/patients/${patientId}?clinicId=${clinicId}`);
  }

  async createPatient(clinicId: string, patient: Omit<Patient, 'id' | 'clinicId' | 'createdAt' | 'updatedAt'>): Promise<Patient> {
    return this.fetchAPI('/patients', 'POST', { ...patient, clinicId });
  }

  async updatePatient(clinicId: string, patientId: string, updates: Partial<Patient>): Promise<Patient> {
    return this.fetchAPI(`/patients/${patientId}`, 'PATCH', { ...updates, clinicId });
  }

  async deletePatient(clinicId: string, patientId: string): Promise<void> {
    return this.fetchAPI(`/patients/${patientId}`, 'DELETE', { clinicId });
  }

  // Calendar Events
  async getEvents(clinicId: string, week?: number): Promise<CalendarEvent[]> {
    const url = week ? `/events?clinicId=${clinicId}&week=${week}` : `/events?clinicId=${clinicId}`;
    return this.fetchAPI(url);
  }

  async createEvent(clinicId: string, event: Omit<CalendarEvent, 'id' | 'clinicId' | 'createdAt' | 'updatedAt'>): Promise<CalendarEvent> {
    return this.fetchAPI('/events', 'POST', { ...event, clinicId });
  }

  async updateEvent(clinicId: string, eventId: string, updates: Partial<CalendarEvent>): Promise<CalendarEvent> {
    return this.fetchAPI(`/events/${eventId}`, 'PATCH', { ...updates, clinicId });
  }

  async deleteEvent(clinicId: string, eventId: string): Promise<void> {
    return this.fetchAPI(`/events/${eventId}`, 'DELETE', { clinicId });
  }

  // Booking Requests
  async getBookingRequests(clinicId: string, status?: string): Promise<BookingRequest[]> {
    const url = status ? `/bookings?clinicId=${clinicId}&status=${status}` : `/bookings?clinicId=${clinicId}`;
    return this.fetchAPI(url);
  }

  async createBookingRequest(clinicId: string, request: Omit<BookingRequest, 'id' | 'clinicId' | 'createdAt' | 'updatedAt'>): Promise<BookingRequest> {
    return this.fetchAPI('/bookings', 'POST', { ...request, clinicId });
  }

  async updateBookingRequest(clinicId: string, requestId: string, updates: Partial<BookingRequest>): Promise<BookingRequest> {
    return this.fetchAPI(`/bookings/${requestId}`, 'PATCH', { ...updates, clinicId });
  }

  // Notifications
  async getNotifications(clinicId: string): Promise<Notification[]> {
    return this.fetchAPI(`/notifications?clinicId=${clinicId}`);
  }

  async markNotificationRead(clinicId: string, notificationId: string): Promise<void> {
    return this.fetchAPI(`/notifications/${notificationId}/read`, 'PATCH', { clinicId });
  }

  async markAllNotificationsRead(clinicId: string): Promise<void> {
    return this.fetchAPI('/notifications/mark-all-read', 'PATCH', { clinicId });
  }

  // Clinic Settings
  async getClinicSettings(clinicId: string): Promise<ClinicSettings> {
    return this.fetchAPI(`/settings?clinicId=${clinicId}`);
  }

  async updateClinicSettings(clinicId: string, settings: Partial<ClinicSettings>): Promise<ClinicSettings> {
    return this.fetchAPI('/settings', 'PATCH', { ...settings, clinicId });
  }
}

export const db = new DynamoDBService();
