// Main App component
const { useState, useEffect } = React;

const App = () => {
  const [page, setPage] = useState('landing');
  const [searchValue, setSearchValue] = useState('');
  const [activePatient, setActivePatient] = useState(null);
  const [showBookModal, setShowBookModal] = useState(false);
  const [bookPrefill, setBookPrefill] = useState(null);
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [editEvent, setEditEvent] = useState(null);
  const [toast, setToast] = useState(null);
  const [events, setEvents] = useState(window.CLINIC_DATA.calendarEvents);
  const [notifications, setNotifications] = useState(window.CLINIC_DATA.notifications);
  const [requests, setRequests] = useState(window.CLINIC_DATA.bookingRequests);
  const [patients, setPatients] = useState(window.CLINIC_DATA.patients);

  // Clinic settings (online-booking switch + closed message) persisted to localStorage
  const [settings, setSettings] = useState(() => {
    let base = window.CLINIC_DATA.clinicSettings;
    try {
      const saved = localStorage.getItem('clinic-settings');
      if (saved) base = { ...base, ...JSON.parse(saved) };
    } catch (e) {}
    // Upgrade older blocked slots so each carries a specific date key.
    return { ...base, blockedSlots: window.migrateBlocked(base.blockedSlots) };
  });
  useEffect(() => {
    try { localStorage.setItem('clinic-settings', JSON.stringify(settings)); } catch (e) {}
  }, [settings]);

  const unreadCount = notifications.filter(n => !n.read).length;
  const pendingCount = requests.filter(r => r.status === 'pending').length;

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  };

  const handleNavigate = (id) => {
    setPage(id);
    setActivePatient(null);
  };

  const handlePatientClick = (p) => {
    setActivePatient(p);
    setPage('patient-profile');
  };

  const handleBookSession = (prefill) => {
    setBookPrefill(prefill?.firstName ? { patientId: prefill.id } : prefill);
    setShowBookModal(true);
  };

  // Office (admin) books a session — lands as a 'scheduled' booking tagged source 'admin'.
  const handleConfirmBooking = (form) => {
    setShowBookModal(false);
    setBookPrefill(null);
    const p = window.CLINIC_DATA.patients.find(x => x.id === form.patientId);
    const hour = parseInt(String(form.time).replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)), 10) || 10;
    setRequests(rs => [{
      id: 'br' + Date.now(),
      firstName: p ? p.firstName : 'مراجع', lastName: p ? p.lastName : '',
      phone: p ? p.phone : '', dateLabel: form.date, time: form.time,
      dow: form.day != null ? form.day : null, hour,
      mode: form.mode, reason: form.notes || '', submittedAt: 'همین حالا',
      isReturning: true, source: 'admin', color: p ? p.color : 'beige', status: 'scheduled',
    }, ...rs]);
    if (form.day != null) {
      const dur = (form.duration || 60) / 60;
      const base = { therapistId: 't1', mode: form.mode, patientId: form.patientId, buffer: form.buffer || settings.sessionBuffer || 0 };
      const newEvents = [{ id: 'e' + Date.now(), day: form.day, startHour: hour, duration: dur, ...base }];
      if (form.double) {
        newEvents.push({ id: 'e' + (Date.now() + 1), day: form.day, startHour: hour + dur, duration: dur, ...base });
      }
      setEvents(ev => [...ev, ...newEvents]);
    }
    showToast(form.double ? 'دو جلسهٔ پشت‌سرهم رزرو شد' : 'جلسه با موفقیت رزرو شد');
  };

  // Public website booking submission → pending request for admin review.
  const handlePublicBooking = (payload) => {
    const parts = (payload.name || '').trim().split(' ');
    const slot = payload.slot;
    setRequests(rs => [{
      id: 'br' + Date.now(),
      firstName: parts[0] || 'مراجع جدید', lastName: parts.slice(1).join(' '),
      phone: payload.phone || '', 
      dateLabel: slot ? slot.dateLabel : 'درخواست تماس برای هماهنگی',
      time: slot ? slot.timeLabel : '—',
      dow: slot ? slot.dow : null, hour: slot ? slot.hour : null,
      mode: payload.mode || 'in-person', reason: payload.reason === 'urgent' ? 'نیاز فوری' : (payload.reason === 'none' ? 'درخواست زمان دیگر' : (payload.double ? 'درخواست دو جلسهٔ پشت‌سرهم' : '')),
      double: !!payload.double,
      submittedAt: 'همین حالا', isReturning: false, source: 'online',
      color: ['sky', 'sage', 'lavender', 'rose'][Math.floor(Math.random() * 4)], status: 'pending',
    }, ...rs]);
    setNotifications(ns => [{
      id: 'n' + Date.now(), type: 'booking', time: 'همین حالا',
      title: 'درخواست رزرو جدید', body: `${payload.name || 'مراجع جدید'} — از وب‌سایت`, read: false,
    }, ...ns]);
  };

  // Admin reviews a pending request.
  const handleAcceptRequest = (req) => {
    setRequests(rs => rs.map(r => r.id === req.id ? { ...r, status: 'scheduled' } : r));
    if (req.dow != null && req.hour != null) {
      const mk = (h, i) => ({
        id: 'e' + (Date.now() + i), day: req.dow, startHour: h, duration: 1,
        mode: req.mode, name: `${req.firstName} ${req.lastName}`.trim(),
        color: req.color, fromBooking: true, buffer: settings.sessionBuffer || 0,
      });
      const evs = [mk(req.hour, 0)];
      if (req.double) evs.push(mk(req.hour + 1, 1));
      setEvents(ev => [...ev, ...evs]);
    }
    showToast(`رزرو ${req.firstName} تأیید و به تقویم افزوده شد`);
  };
  const handleRejectRequest = (req) => {
    setRequests(rs => rs.filter(r => r.id !== req.id));
    showToast('درخواست رد شد');
  };

  // Edit / delete an existing calendar session.
  const handleSaveEvent = (updated) => {
    setEvents(ev => ev.map(e => e.id === updated.id ? updated : e));
    setEditEvent(null);
    showToast('تغییرات جلسه ذخیره شد');
  };
  const handleDeleteEvent = (ev, reason) => {
    setEvents(es => es.filter(e => e.id !== ev.id));
    setEditEvent(null);
    // Log the cancellation so it surfaces in the patient's timeline.
    const p = ev.patientId ? window.CLINIC_DATA.patients.find(x => x.id === ev.patientId) : null;
    const name = ev.name || (p ? `${p.firstName} ${p.lastName}` : 'مراجع');
    window.CLINIC_DATA.cancellations = [{
      id: 'cx' + Date.now(), patientId: ev.patientId || null, name,
      date: '۱۴۰۵/۰۲/۱۶', time: `${toFa(ev.startHour)}:۰۰`,
      reason: reason || 'دلیل ثبت نشد',
    }, ...(window.CLINIC_DATA.cancellations || [])];
    showToast('جلسه لغو شد و در پرونده ثبت شد');
  };

  const handleAddPatient = () => setShowAddPatient(true);

  const handleConfirmAddPatient = (form) => {
    setShowAddPatient(false);
    const colors = ['sky', 'sage', 'beige', 'lavender', 'rose'];
    const newP = {
      id: 'p' + Date.now(),
      firstName: form.firstName, lastName: form.lastName,
      age: form.age || '—', phone: form.phone,
      status: 'active', color: colors[Math.floor(Math.random() * colors.length)],
      lastSession: '—', sessions: 0, tags: form.tags || [],
      notes: form.notes || '',
      companion: (form.companionRelation || form.companionName || form.companionPhone)
        ? { relation: form.companionRelation, name: form.companionName, phone: form.companionPhone }
        : null,
    };
    // Keep the global list in sync so dropdowns + getPatient() see the new profile.
    window.CLINIC_DATA.patients = [newP, ...window.CLINIC_DATA.patients];
    setPatients(prev => [newP, ...prev]);
    showToast(`پروندهٔ ${form.firstName} ${form.lastName} افزوده شد`);
  };

  const handleMarkAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
    showToast('همه اعلان‌ها خوانده‌شده شدند');
  };

  // Public landing page — also serves as login + booking entry
  if (page === 'landing') {
    return (
      <LandingPage
        settings={settings}
        slots={window.computeSlots(events, settings.blockedSlots, settings)}
        events={events}
        onLogin={() => setPage('login')}
        onBookingSubmit={(payload) => { handlePublicBooking(payload); }}
      />
    );
  }

  if (page === 'login') {
    return (
      <LoginScreen
        onSuccess={() => { setPage('dashboard'); }}
        onCancel={() => setPage('landing')}
      />
    );
  }

  return (
    <div className="app">
      <Sidebar
        activePage={page === 'patient-profile' ? 'patients' : page}
        onNavigate={handleNavigate}
        unreadCount={unreadCount}
        requestCount={pendingCount}
        onLogout={() => setPage('landing')}
      />
      <div className="main">
        <Topbar
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          onNotificationsClick={() => handleNavigate('notifications')}
          unreadCount={unreadCount}
          onAddPatient={handleAddPatient}
          onLogout={() => setPage('landing')}
        />

        {page === 'dashboard' && (
          <DashboardPage
            requests={requests}
            settings={settings}
            onNavigate={handleNavigate}
            onBookSession={handleBookSession}
            onAddPatient={handleAddPatient}
            onPatientClick={handlePatientClick}
          />
        )}
        {page === 'patients' && (
          <PatientsPage
            patients={patients}
            searchValue={searchValue}
            onPatientClick={handlePatientClick}
            onAddPatient={handleAddPatient}
          />
        )}
        {page === 'patient-profile' && activePatient && (
          <PatientProfilePage
            key={activePatient.id}
            patient={activePatient}
            onBack={() => handleNavigate('patients')}
            onBookSession={handleBookSession}
            settings={settings}
          />
        )}
        {page === 'calendar' && (
          <CalendarPage
            events={events}
            onEventsChange={setEvents}
            onBookSession={handleBookSession}
            onEditEvent={setEditEvent}
            settings={settings}
          />
        )}
        {page === 'notifications' && (
          <NotificationsPage
            notifications={notifications}
            onMarkAllRead={handleMarkAllRead}
          />
        )}
        {page === 'requests' && (
          <RequestsPage
            requests={requests.filter(r => r.status === 'pending')}
            onAccept={handleAcceptRequest}
            onReject={handleRejectRequest}
          />
        )}
        {page === 'settings' && (
          <SettingsPage settings={settings} onSettingsChange={setSettings} onToast={showToast} />
        )}
      </div>

      {showBookModal && (
        <BookSessionModal
          prefill={bookPrefill}
          onClose={() => { setShowBookModal(false); setBookPrefill(null); }}
          onConfirm={handleConfirmBooking}
          settings={settings}
        />
      )}
      {showAddPatient && (
        <AddPatientModal
          onClose={() => setShowAddPatient(false)}
          onConfirm={handleConfirmAddPatient}
          settings={settings}
        />
      )}
      {editEvent && (
        <SessionEditModal
          event={editEvent}
          onClose={() => setEditEvent(null)}
          onSave={handleSaveEvent}
          onDelete={handleDeleteEvent}
        />
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
