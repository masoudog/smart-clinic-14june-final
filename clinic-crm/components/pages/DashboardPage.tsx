'use client';

import React from 'react';
import { Patient, BookingRequest } from '@/lib/types';
import { toFa } from '@/lib/utils';

interface DashboardPageProps {
  requests: BookingRequest[];
  patients: Patient[];
  onPatientClick?: (patient: Patient) => void;
  onNavigate?: (page: string) => void;
}

export default function DashboardPage({
  requests,
  patients,
  onPatientClick,
  onNavigate,
}: DashboardPageProps) {
  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-ink mb-2">داشبورد</h1>
        <p className="text-ink-muted">خوش‌آمدید به کلینیک آرامش</p>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-4 gap-6 mb-12">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-line">
          <div className="text-3xl mb-2">👥</div>
          <div className="text-2xl font-bold text-ink">{toFa(patients.length)}</div>
          <p className="text-sm text-ink-muted">کل مراجعین</p>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-line">
          <div className="text-3xl mb-2">📬</div>
          <div className="text-2xl font-bold text-rose">{toFa(requests.length)}</div>
          <p className="text-sm text-ink-muted">درخواست‌های زیرنظر</p>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-line">
          <div className="text-3xl mb-2">✅</div>
          <div className="text-2xl font-bold text-sage">{toFa(patients.filter(p => p.status === 'active').length)}</div>
          <p className="text-sm text-ink-muted">مراجعین فعال</p>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-line">
          <div className="text-3xl mb-2">📊</div>
          <div className="text-2xl font-bold text-sky">{toFa(patients.reduce((sum, p) => sum + p.sessions, 0))}</div>
          <p className="text-sm text-ink-muted">کل جلسات</p>
        </div>
      </div>

      {/* Pending Requests */}
      {requests.length > 0 && (
        <div className="bg-white rounded-lg p-8 shadow-sm border border-line mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-ink">درخواست‌های زیرنظر</h2>
            <button
              onClick={() => onNavigate?.('requests')}
              className="text-sm text-accent hover:underline font-medium"
            >
              مشاهدهٔ همه
            </button>
          </div>

          <div className="space-y-3">
            {requests.slice(0, 3).map((req) => (
              <div
                key={req.id}
                className="flex items-center justify-between p-4 bg-accent-soft rounded-lg border border-line"
              >
                <div>
                  <p className="font-medium text-ink">
                    {req.firstName} {req.lastName}
                  </p>
                  <p className="text-sm text-ink-muted">
                    {req.source === 'online' ? 'از وبسایت' : 'درخواست ادمین'} • {req.submittedAt}
                  </p>
                </div>
                <span className="text-sm bg-white px-3 py-1 rounded-full text-accent font-medium border border-line">
                  {req.mode === 'online' ? 'آنلاین' : 'حضوری'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Patients */}
      <div className="bg-white rounded-lg p-8 shadow-sm border border-line">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-ink">مراجعین اخیر</h2>
          <button
            onClick={() => onNavigate?.('patients')}
            className="text-sm text-accent hover:underline font-medium"
          >
            مشاهدهٔ همه
          </button>
        </div>

        <div className="space-y-2">
          {patients.slice(0, 5).map((patient) => (
            <button
              key={patient.id}
              onClick={() => onPatientClick?.(patient)}
              className="w-full text-right p-3 hover:bg-bg-soft rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor: `var(--${patient.color}-soft})`,
                  }}
                ></div>
                <div className="flex-1">
                  <p className="font-medium text-ink">
                    {patient.firstName} {patient.lastName}
                  </p>
                  <p className="text-xs text-ink-muted">
                    {toFa(patient.sessions)} جلسه • {patient.lastSession}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
