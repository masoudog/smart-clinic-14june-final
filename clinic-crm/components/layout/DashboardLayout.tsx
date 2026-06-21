'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import DashboardPage from '@/components/pages/DashboardPage';
import PatientsPage from '@/components/pages/PatientsPage';
import CalendarPage from '@/components/pages/CalendarPage';
import NotificationsPage from '@/components/pages/NotificationsPage';
import RequestsPage from '@/components/pages/RequestsPage';
import SettingsPage from '@/components/pages/SettingsPage';
import PatientProfilePage from '@/components/pages/PatientProfilePage';
import Toast from '@/components/Toast';
import { db } from '@/lib/dynamodb';
import { useAuth } from '@/lib/auth';
import { Patient, CalendarEvent, BookingRequest, Notification } from '@/lib/types';

interface DashboardLayoutProps {
  page: string;
  setPage: (page: string) => void;
  activePatient: Patient | null;
  setActivePatient: (patient: Patient | null) => void;
}

export default function DashboardLayout({
  page,
  setPage,
  activePatient,
  setActivePatient,
}: DashboardLayoutProps) {
  const { user } = useAuth();
  const [searchValue, setSearchValue] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [requests, setRequests] = useState<BookingRequest[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2800);
  };

  useEffect(() => {
    if (!user?.clinicId) return;

    const loadData = async () => {
      try {
        const [p, e, r, n] = await Promise.all([
          db.getPatients(user.clinicId),
          db.getEvents(user.clinicId),
          db.getBookingRequests(user.clinicId),
          db.getNotifications(user.clinicId),
        ]);
        setPatients(p);
        setEvents(e);
        setRequests(r);
        setNotifications(n);
      } catch (error) {
        console.error('Failed to load data:', error);
        showToast('خطا در بارگذاری داده‌ها');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user?.clinicId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-ink-muted">بارگذاری...</div>
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.read).length;
  const pendingCount = requests.filter(r => r.status === 'pending').length;

  return (
    <div className="container-app">
      <Sidebar
        activePage={page === 'patient-profile' ? 'patients' : page}
        onNavigate={setPage}
        unreadCount={unreadCount}
        requestCount={pendingCount}
        onLogout={() => setPage('landing')}
      />

      <div className="main-content">
        <Topbar
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          onNotificationsClick={() => setPage('notifications')}
          unreadCount={unreadCount}
          onAddPatient={() => showToast('فیچر افزودن مراجع به زودی')}
          onLogout={() => setPage('landing')}
        />

        <div className="page-content">
          {page === 'dashboard' && (
            <DashboardPage
              requests={requests.filter(r => r.status === 'pending')}
              patients={patients}
              onPatientClick={setActivePatient}
              onNavigate={setPage}
            />
          )}
          {page === 'patients' && (
            <PatientsPage
              patients={patients}
              searchValue={searchValue}
              onPatientClick={(patient) => {
                setActivePatient(patient);
                setPage('patient-profile');
              }}
            />
          )}
          {page === 'patient-profile' && activePatient && (
            <PatientProfilePage
              patient={activePatient}
              onBack={() => setPage('patients')}
              onShowToast={showToast}
            />
          )}
          {page === 'calendar' && (
            <CalendarPage
              events={events}
              onEventsChange={setEvents}
              onShowToast={showToast}
            />
          )}
          {page === 'notifications' && (
            <NotificationsPage
              notifications={notifications}
              onMarkAllRead={() => {
                setNotifications(notifications.map(n => ({ ...n, read: true })));
                showToast('همه اعلان‌ها خوانده‌شده شدند');
              }}
            />
          )}
          {page === 'requests' && (
            <RequestsPage
              requests={requests.filter(r => r.status === 'pending')}
              onAccept={(req) => {
                setRequests(requests.map(r => r.id === req.id ? { ...r, status: 'scheduled' } : r));
                showToast(`رزرو ${req.firstName} تأیید شد`);
              }}
              onReject={(req) => {
                setRequests(requests.filter(r => r.id !== req.id));
                showToast('درخواست رد شد');
              }}
            />
          )}
          {page === 'settings' && (
            <SettingsPage onShowToast={showToast} />
          )}
        </div>
      </div>

      {toast && <Toast message={toast} />}
    </div>
  );
}
