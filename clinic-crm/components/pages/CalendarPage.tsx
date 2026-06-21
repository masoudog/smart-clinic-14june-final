'use client';

import React from 'react';
import { CalendarEvent } from '@/lib/types';
import { toFa, dayNames, getWeekDayLabel } from '@/lib/utils';

interface CalendarPageProps {
  events: CalendarEvent[];
  onEventsChange?: (events: CalendarEvent[]) => void;
  onShowToast?: (msg: string) => void;
}

export default function CalendarPage({
  events,
  onEventsChange,
  onShowToast,
}: CalendarPageProps) {
  const [selectedDay, setSelectedDay] = React.useState(0);

  const dayEvents = events.filter(e => e.day === selectedDay).sort((a, b) => a.startHour - b.startHour);

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-ink mb-8">تقویم جلسات</h1>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Days */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-line">
          <h2 className="font-bold text-ink mb-4">روزهای هفته</h2>
          <div className="space-y-2">
            {dayNames.map((day, i) => (
              <button
                key={i}
                onClick={() => setSelectedDay(i)}
                className={`w-full text-right p-3 rounded-lg border-2 transition-all ${
                  selectedDay === i
                    ? 'bg-accent-soft border-accent text-accent'
                    : 'bg-white border-line hover:border-accent'
                }`}
              >
                <p className="font-medium">{day}</p>
                <p className="text-xs text-ink-muted">
                  {dayEvents.length} جلسه
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Events */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-line">
          <h2 className="font-bold text-ink mb-4">
            {getWeekDayLabel(selectedDay)} - {dayEvents.length} جلسه
          </h2>
          <div className="space-y-2">
            {dayEvents.map((event) => (
              <div
                key={event.id}
                className="p-3 rounded-lg border-l-4 bg-bg-soft"
                style={{ borderColor: `var(--${event.color || 'sky'})` }}
              >
                <p className="font-medium text-ink">
                  {toFa(event.startHour)}:۰۰
                </p>
                <p className="text-sm text-ink-muted">
                  {event.name || 'جلسهٔ نام‌گذاری نشده'}
                </p>
                <p className="text-xs text-ink-muted">
                  {event.mode === 'online' ? 'آنلاین' : 'حضوری'} • {toFa(event.duration)} ساعت
                </p>
              </div>
            ))}
            {dayEvents.length === 0 && (
              <p className="text-center text-ink-muted py-6">جلسه‌ای برنامه‌ریزی نشده</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
