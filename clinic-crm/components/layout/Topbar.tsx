'use client';

import React from 'react';

interface TopbarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  onNotificationsClick?: () => void;
  unreadCount?: number;
  onAddPatient?: () => void;
  onLogout?: () => void;
}

export default function Topbar({
  searchValue,
  onSearchChange,
  onNotificationsClick,
  unreadCount = 0,
  onAddPatient,
  onLogout,
}: TopbarProps) {
  return (
    <div className="topbar bg-bg-elevated border-b border-line">
      {/* Search Bar */}
      <div className="flex-1">
        <input
          type="text"
          placeholder="جستجو..."
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full max-w-xs px-4 py-2 bg-bg-soft border border-line rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <button
          onClick={onAddPatient}
          className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          + افزودن مراجع
        </button>

        <button
          onClick={onNotificationsClick}
          className="relative p-2 hover:bg-bg-soft rounded-lg transition-colors"
        >
          <span className="text-xl">🔔</span>
          {unreadCount > 0 && (
            <span className="absolute top-0 left-0 w-5 h-5 bg-rose text-white text-xs rounded-full flex items-center justify-center font-bold">
              {unreadCount}
            </span>
          )}
        </button>

        <button
          onClick={onLogout}
          className="p-2 hover:bg-bg-soft rounded-lg transition-colors text-ink-muted"
          title="خروج"
        >
          <span className="text-xl">🚪</span>
        </button>
      </div>
    </div>
  );
}
