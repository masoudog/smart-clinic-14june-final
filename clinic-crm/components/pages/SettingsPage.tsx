'use client';

import React, { useState } from 'react';

interface SettingsPageProps {
  onShowToast?: (msg: string) => void;
}

export default function SettingsPage({ onShowToast }: SettingsPageProps) {
  const [onlineBooking, setOnlineBooking] = useState(true);
  const [closedMessage, setClosedMessage] = useState('کلینیک مسدود است');

  const handleSave = () => {
    onShowToast?.('تنظیمات ذخیره شد');
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-ink mb-8">تنظیمات</h1>

      <div className="space-y-8">
        {/* Online Booking */}
        <div className="bg-white rounded-lg p-6 border border-line shadow-sm">
          <h2 className="text-lg font-bold text-ink mb-4">رزرو آنلاین</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-ink">فعال‌سازی رزرو آنلاین</p>
                <p className="text-sm text-ink-muted">اجازه دهید مراجعین از وبسایت رزرو کنند</p>
              </div>
              <input
                type="checkbox"
                checked={onlineBooking}
                onChange={(e) => setOnlineBooking(e.target.checked)}
                className="w-5 h-5"
              />
            </div>

            {!onlineBooking && (
              <div>
                <label className="block text-sm font-medium text-ink-soft mb-2">
                  پیام بسته بودن
                </label>
                <textarea
                  value={closedMessage}
                  onChange={(e) => setClosedMessage(e.target.value)}
                  className="w-full px-4 py-2 border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
                  rows={3}
                />
              </div>
            )}
          </div>
        </div>

        {/* Session Settings */}
        <div className="bg-white rounded-lg p-6 border border-line shadow-sm">
          <h2 className="text-lg font-bold text-ink mb-4">تنظیمات جلسات</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink-soft mb-2">
                وقت کاشی بین جلسات (دقیقه)
              </label>
              <input
                type="number"
                defaultValue={15}
                className="w-full px-4 py-2 border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          className="w-full px-6 py-3 bg-accent text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          ذخیرهٔ تنظیمات
        </button>
      </div>
    </div>
  );
}
