'use client';

import React from 'react';
import { Patient } from '@/lib/types';
import { toFa } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface PatientsPageProps {
  patients: Patient[];
  searchValue?: string;
  onPatientClick?: (patient: Patient) => void;
}

export default function PatientsPage({
  patients,
  searchValue = '',
  onPatientClick,
}: PatientsPageProps) {
  const filtered = patients.filter(p =>
    `${p.firstName} ${p.lastName}`.includes(searchValue) ||
    p.phone.includes(searchValue)
  );

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-ink mb-8">مراجعین</h1>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((patient) => (
          <button
            key={patient.id}
            onClick={() => onPatientClick?.(patient)}
            className={cn(
              'p-6 rounded-lg border-2 transition-all text-right hover:shadow-lg',
              `bg-${patient.color}-soft border-${patient.color}`
            )}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-bold text-ink text-lg">
                  {patient.firstName} {patient.lastName}
                </p>
                <p className="text-sm text-ink-muted">{patient.phone}</p>
              </div>
              <span className={cn(
                'text-xs font-medium px-2 py-1 rounded-full',
                patient.status === 'active'
                  ? 'bg-sage text-white'
                  : 'bg-gray-300 text-gray-700'
              )}>
                {patient.status === 'active' ? 'فعال' : 'غیرفعال'}
              </span>
            </div>

            <div className="space-y-1 text-xs text-ink-muted">
              <p>سن: {patient.age || '—'}</p>
              <p>جلسات: {toFa(patient.sessions)}</p>
              <p>آخرین جلسه: {patient.lastSession}</p>
            </div>

            {patient.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">
                {patient.tags.slice(0, 2).map((tag, i) => (
                  <span key={i} className="text-xs bg-white bg-opacity-50 px-2 py-1 rounded">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <p className="text-ink-muted text-lg">نتیجه‌ای یافت نشد</p>
        </div>
      )}
    </div>
  );
}
