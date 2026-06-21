'use client';

import React from 'react';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';

interface SidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
  unreadCount?: number;
  requestCount?: number;
  onLogout?: () => void;
}

export default function Sidebar({
  activePage,
  onNavigate,
  unreadCount = 0,
  requestCount = 0,
  onLogout,
}: SidebarProps) {
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    onLogout?.();
  };

  const menuItems = [
    { id: 'dashboard', label: 'داشبورد', icon: '📊' },
    { id: 'patients', label: 'مراجعین', icon: '👥' },
    { id: 'calendar', label: 'تقویم', icon: '📅' },
    { id: 'requests', label: 'درخواست‌ها', icon: '📬', badge: requestCount },
    { id: 'notifications', label: 'اعلان‌ها', icon: '🔔', badge: unreadCount },
    { id: 'settings', label: 'تنظیمات', icon: '⚙️' },
  ];

  return (
    <div className="sidebar">
      {/* Brand */}
      <div className="flex items-center gap-2 px-2">
        <div className="w-9 h-9 rounded-[12px] bg-gradient-to-br from-sage to-sky flex items-center justify-center">
          <div className="w-3.5 h-3.5 rounded-full bg-white opacity-70"></div>
        </div>
        <span className="text-ink font-semibold">کلینیک آرامش</span>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-2 flex-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={cn(
              'w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors',
              activePage === item.id
                ? 'bg-accent-soft text-accent font-medium'
                : 'text-ink-soft hover:bg-bg-soft'
            )}
          >
            <span className="flex items-center gap-3">
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </span>
            {item.badge && item.badge > 0 && (
              <span className="text-xs bg-rose text-ink px-1.5 py-0.5 rounded-full font-medium">
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full px-3 py-2.5 rounded-lg text-ink-soft hover:bg-bg-soft transition-colors text-sm"
      >
        خروج
      </button>
    </div>
  );
}
