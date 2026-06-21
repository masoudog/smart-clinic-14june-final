'use client';

import React from 'react';
import { Notification } from '@/lib/types';

interface NotificationsPageProps {
  notifications: Notification[];
  onMarkAllRead?: () => void;
}

export default function NotificationsPage({
  notifications,
  onMarkAllRead,
}: NotificationsPageProps) {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-ink">اعلان‌ها</h1>
        {notifications.some(n => !n.read) && (
          <button
            onClick={onMarkAllRead}
            className="text-sm text-accent hover:underline font-medium"
          >
            خواندن همه
          </button>
        )}
      </div>

      <div className="space-y-3">
        {notifications.map((notif) => (
          <div
            key={notif.id}
            className={`p-4 rounded-lg border-l-4 ${
              notif.read
                ? 'bg-bg-soft border-line'
                : 'bg-accent-soft border-accent'
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className={`font-medium ${notif.read ? 'text-ink-muted' : 'text-ink'}`}>
                  {notif.title}
                </p>
                <p className="text-sm text-ink-muted mt-1">{notif.body}</p>
              </div>
              <span className="text-xs text-ink-muted whitespace-nowrap ml-4">
                {notif.time}
              </span>
            </div>
          </div>
        ))}
      </div>

      {notifications.length === 0 && (
        <div className="text-center py-12">
          <p className="text-ink-muted text-lg">اعلانی وجود ندارد</p>
        </div>
      )}
    </div>
  );
}
