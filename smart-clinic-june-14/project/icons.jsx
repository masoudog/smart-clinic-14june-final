// Lightweight inline SVG icons - calm, thin stroke
const Icon = ({ name, size = 18, className = '' }) => {
  const icons = {
    dashboard: <><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/></>,
    users: <><circle cx="9" cy="8" r="3.5"/><path d="M3 20c0-3 2.5-5 6-5s6 2 6 5"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14c2.5 0 5 1.5 5 4"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></>,
    bell: <><path d="M6 9a6 6 0 0112 0c0 4 1.5 5 2 6H4c.5-1 2-2 2-6z"/><path d="M10 19a2 2 0 004 0"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.5-4.5"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    chevronLeft: <><path d="M15 6l-6 6 6 6"/></>,
    chevronRight: <><path d="M9 6l6 6-6 6"/></>,
    chevronDown: <><path d="M6 9l6 6 6-6"/></>,
    chevronLeft: <><path d="M15 6l-6 6 6 6"/></>,
    chevronRight: <><path d="M9 6l6 6-6 6"/></>,
    arrowLeft: <><path d="M19 12H5M11 19l-7-7 7-7"/></>,
    close: <><path d="M6 6l12 12M18 6L6 18"/></>,
    phone: <><path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6 19.8 19.8 0 01-3-8.6A2 2 0 014.1 2h3a2 2 0 012 1.7 13 13 0 00.7 2.8 2 2 0 01-.5 2.1L8 9.8a16 16 0 006 6l1.2-1.2a2 2 0 012.1-.5c.9.3 1.8.6 2.8.7a2 2 0 011.7 2z"/></>,
    note: <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M9 13h6M9 17h6"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    check: <><path d="M5 12l5 5L20 7"/></>,
    arrow: <><path d="M5 12h14M13 5l7 7-7 7"/></>,
    arrowRight: <><path d="M19 12H5M11 19l-7-7 7-7"/></>,
    moreH: <><circle cx="6" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="18" cy="12" r="1.5"/></>,
    edit: <><path d="M12 20h9M16.5 3.5a2.1 2.1 0 113 3L7 19l-4 1 1-4z"/></>,
    trash: <><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></>,
    leaf: <><path d="M11 20A7 7 0 014 13V8a7 7 0 017-7h7v5a7 7 0 01-7 7h-2"/><path d="M4 21l8-12"/></>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7"/></>,
    filter: <><path d="M3 5h18l-7 9v6l-4-2v-4z"/></>,
    sparkle: <><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/></>,
    grid: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    list: <><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></>,
    // — clinic site additions —
    brain: <><path d="M9.5 3.5A2.5 2.5 0 007 6v.1A2.4 2.4 0 005.5 8.5 2.4 2.4 0 005 11a2.5 2.5 0 00.6 3.3A2.5 2.5 0 007 18.5a2.5 2.5 0 005 .5V6a2.5 2.5 0 00-2.5-2.5z"/><path d="M14.5 3.5A2.5 2.5 0 0117 6v.1a2.4 2.4 0 011.5 2.4 2.4 2.4 0 01.5 2.5 2.5 2.5 0 01-.6 3.3 2.5 2.5 0 01-1.4 4.2 2.5 2.5 0 01-5 .5"/></>,
    moon: <><path d="M21 12.8A9 9 0 1111.2 3 7 7 0 0021 12.8z"/></>,
    zap: <><path d="M13 2L4.5 13.5H11l-1 8.5L18.5 10.5H12z"/></>,
    pin: <><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1116 0z"/><circle cx="12" cy="10" r="3"/></>,
    instagram: <><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.3" cy="6.7" r="1.1" fill="currentColor" stroke="none"/></>,
    linkedin: <><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 10v7M8 7v.01M12 17v-4a2 2 0 014 0v4M12 17v-7"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className}>
      {icons[name] || null}
    </svg>
  );
};

// Avatar component with colored backgrounds
const colorMap = {
  sky: '#DCE8F0',
  sage: '#DEEBE2',
  beige: '#F2EBDB',
  lavender: '#E5DDED',
  rose: '#F2DCDC',
};
const colorMapInk = {
  sky: '#3d6680',
  sage: '#4a6b56',
  beige: '#8a7345',
  lavender: '#6a5a85',
  rose: '#8b5050',
};

const Avatar = ({ initials, color = 'sky', size = 'md' }) => {
  const sizeClass = size === 'lg' ? 'avatar-lg' : size === 'xl' ? 'avatar-xl' : '';
  const iconSize = size === 'xl' ? 28 : size === 'lg' ? 22 : 16;
  return (
    <div className={`avatar ${sizeClass}`}
         style={{ background: colorMap[color], color: colorMapInk[color] }}>
      <Icon name="user" size={iconSize} />
    </div>
  );
};

// Get patient/therapist by id helpers
const getPatient = (id) => window.CLINIC_DATA.patients.find(p => p.id === id);
const getTherapist = (id) => window.CLINIC_DATA.therapists.find(t => t.id === id);
const patientInitials = (p) => p ? (p.firstName.charAt(0) + p.lastName.charAt(0)) : '';

Object.assign(window, { Icon, Avatar, getPatient, getTherapist, patientInitials, colorMap, colorMapInk });
