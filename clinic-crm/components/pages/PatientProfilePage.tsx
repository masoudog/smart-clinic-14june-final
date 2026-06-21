'use client';

import React from 'react';
import { Patient } from '@/lib/types';
import { toFa } from '@/lib/utils';

interface PatientProfilePageProps {
  patient: Patient;
  onBack?: () => void;
  onShowToast?: (msg: string) => void;
}

export default function PatientProfilePage({
  patient,
  onBack,
  onShowToast,
}: PatientProfilePageProps) {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-ink">
            {patient.firstName} {patient.lastName}
          </h1>
          <p className="text-ink-muted">{patient.phone}</p>
        </div>
        <button
          onClick={onBack}
          className="px-6 py-2.5 border border-line rounded-lg text-ink hover:bg-bg-soft transition-colors"
        >
          بازگشت
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Info */}
        <div className="bg-white rounded-lg p-6 border border-line shadow-sm">
          <h2 className="text-lg font-bold text-ink mb-4">اطلاعات</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-ink-muted">سن</span>
              <span className="font-medium text-ink">{patient.age || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-muted">وضعیت</span>
              <span className="font-medium text-ink">
                {patient.status === 'active' ? 'فعال' : 'غیرفعال'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-muted">کل جلسات</span>
              <span className="font-medium text-ink">{toFa(patient.sessions)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-muted">آخرین جلسه</span>
              <span className="font-medium text-ink">{patient.lastSession}</span>
            </div>
          </div>
        </div>

        {/* Companion */}
        {patient.companion && (
          <div className="bg-white rounded-lg p-6 border border-line shadow-sm">
            <h2 className="text-lg font-bold text-ink mb-4">همراه</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-ink-muted">رابطه</span>
                <span className="font-medium text-ink">{patient.companion.relation}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">نام</span>
                <span className="font-medium text-ink">{patient.companion.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">تماس</span>
                <span className="font-medium text-ink">{patient.companion.phone}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Notes */}
      {patient.notes && (
        <div className="bg-white rounded-lg p-6 border border-line shadow-sm mt-8">
          <h2 className="text-lg font-bold text-ink mb-4">یادداشت‌ها</h2>
          <p className="text-ink whitespace-pre-wrap">{patient.notes}</p>
        </div>
      )}

      {/* Tags */}
      {patient.tags.length > 0 && (
        <div className="bg-white rounded-lg p-6 border border-line shadow-sm mt-8">
          <h2 className="text-lg font-bold text-ink mb-4">برچسب‌ها</h2>
          <div className="flex flex-wrap gap-2">
            {patient.tags.map((tag, i) => (
              <span
                key={i}
                className="px-3 py-1 bg-accent-soft text-accent rounded-full text-sm font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
