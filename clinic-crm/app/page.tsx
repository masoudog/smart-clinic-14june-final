'use client';

import { useState, useEffect } from 'react';
import LandingPage from '@/components/pages/LandingPage';
import LoginPage from '@/components/pages/LoginPage';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { AuthProvider, useAuth } from '@/lib/auth';

function AppContent() {
  const { isAuthenticated } = useAuth();
  const [page, setPage] = useState<string>('landing');
  const [activePatient, setActivePatient] = useState<any>(null);

  useEffect(() => {
    if (isAuthenticated && (page === 'landing' || page === 'login')) {
      setPage('dashboard');
    }
  }, [isAuthenticated]);

  if (!isAuthenticated && page === 'login') {
    return <LoginPage onSuccess={() => setPage('dashboard')} onCancel={() => setPage('landing')} />;
  }

  if (!isAuthenticated) {
    return <LandingPage onLogin={() => setPage('login')} />;
  }

  return (
    <DashboardLayout
      page={page}
      setPage={setPage}
      activePatient={activePatient}
      setActivePatient={setActivePatient}
    />
  );
}

export default function Page() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
