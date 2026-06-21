'use client';

import React from 'react';
import { BookingRequest } from '@/lib/types';

interface RequestsPageProps {
  requests: BookingRequest[];
  onAccept?: (req: BookingRequest) => void;
  onReject?: (req: BookingRequest) => void;
}

export default function RequestsPage({
  requests,
  onAccept,
  onReject,
}: RequestsPageProps) {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-ink mb-8">درخواست‌های رزرو</h1>

      <div className="space-y-4">
        {requests.map((req) => (
          <div
            key={req.id}
            className="bg-white rounded-lg p-6 border border-line shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-ink">
                  {req.firstName} {req.lastName}
                </h3>
                <p className="text-sm text-ink-muted">{req.phone}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-ink-muted">{req.submittedAt}</p>
                <span className={`text-xs font-medium px-2 py-1 rounded-full mt-1 inline-block ${
                  req.source === 'online'
                    ? 'bg-sky-soft text-sky'
                    : 'bg-sage-soft text-sage'
                }`}>
                  {req.source === 'online' ? 'وبسایت' : 'ادمین'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
              <div>
                <p className="text-ink-muted">تاریخ درخواست</p>
                <p className="font-medium text-ink">{req.dateLabel}</p>
              </div>
              <div>
                <p className="text-ink-muted">زمان</p>
                <p className="font-medium text-ink">{req.time}</p>
              </div>
              <div>
                <p className="text-ink-muted">نوع جلسه</p>
                <p className="font-medium text-ink">
                  {req.mode === 'online' ? 'آنلاین' : 'حضوری'}
                </p>
              </div>
              <div>
                <p className="text-ink-muted">توضیح</p>
                <p className="font-medium text-ink">{req.reason || '—'}</p>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-line">
              <button
                onClick={() => onAccept?.(req)}
                className="flex-1 px-4 py-2 bg-sage text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
              >
                تأیید
              </button>
              <button
                onClick={() => onReject?.(req)}
                className="flex-1 px-4 py-2 bg-rose text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
              >
                رد
              </button>
            </div>
          </div>
        ))}
      </div>

      {requests.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-line">
          <p className="text-ink-muted text-lg">درخواستی موجود نیست</p>
        </div>
      )}
    </div>
  );
}
