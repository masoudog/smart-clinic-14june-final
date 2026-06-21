// Sidebar + Topbar (admin shell)
const Sidebar = ({ activePage, onNavigate, unreadCount, requestCount, onLogout }) => {
  const navItems = [
    { id: 'dashboard', label: 'داشبورد', icon: 'dashboard' },
    { id: 'patients', label: 'مراجعین', icon: 'users' },
    { id: 'calendar', label: 'تقویم جلسات', icon: 'calendar' },
    { id: 'requests', label: 'درخواست‌های رزرو', icon: 'leaf', badge: requestCount },
    { id: 'notifications', label: 'اعلان‌ها', icon: 'bell', badge: unreadCount },
    { id: 'settings', label: 'تنظیمات', icon: 'settings' },
  ];

  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-dot"></span>
        <div className="brand-name">کلینیک پوریا</div>
      </div>

      <nav className="nav">
        {navItems.map(item => (
          <button key={item.id}
            className={`nav-item ${activePage === item.id ? 'active' : ''}`}
            onClick={() => onNavigate(item.id)}>
            <Icon name={item.icon} className="nav-icon" />
            <span>{item.label}</span>
            {item.badge > 0 && <span className="badge">{toFa(item.badge)}</span>}
          </button>
        ))}
      </nav>
    </aside>
  );
};

const Topbar = ({ searchValue, onSearchChange, onNotificationsClick, unreadCount, onAddPatient, onLogout }) => {
  return (
    <header className="topbar">
      <div className="search">
        <Icon name="search" size={16} className="search-icon" />
        <input
          type="text"
          placeholder="جستجوی مراجعین، جلسات، یادداشت‌ها..."
          value={searchValue}
          onChange={e => onSearchChange(e.target.value)}
        />
      </div>

      <div className="topbar-actions">
        <button className="icon-btn" onClick={onNotificationsClick} title="اعلان‌ها">
          <Icon name="bell" size={18} />
          {unreadCount > 0 && <span className="dot"></span>}
        </button>
        <button className="btn btn-ghost btn-logout" onClick={onLogout} title="خروج از حساب">
          <Icon name="arrow" size={16} />
          <span>خروج</span>
        </button>
      </div>
    </header>
  );
};

// Persian numeral helper
const toFa = (n) => String(n).replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);

Object.assign(window, { Sidebar, Topbar, toFa });
