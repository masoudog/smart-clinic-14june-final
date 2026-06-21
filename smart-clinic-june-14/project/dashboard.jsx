// Dashboard page
const DashboardPage = ({ requests = [], settings = {}, onNavigate, onBookSession, onAddPatient, onPatientClick }) => {
  const D = window.CLINIC_DATA;
  const today = D.todaySessions;
  const total = today.length;
  const pending = requests.filter(r => r.status === 'pending');
  // Upcoming bookings for the coming days — pending shown first so they get reviewed.
  const upcoming = [...requests].sort((a, b) => (a.status === 'pending' ? 0 : 1) - (b.status === 'pending' ? 0 : 1)).slice(0, 5);

  const dayLabels = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'];
  const persianMonths = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
  const jToday = window.JALALI_TODAY;
  const weekdayName = dayLabels[jToday.dow];
  const todayLabel = `${weekdayName}، ${toFa(jToday.day)} ${persianMonths[jToday.monthIdx]} ${toFa(jToday.year)}`;

  // Greeting + hero message — driven by the time of day AND the configured working hours.
  const now = new Date();
  const hr = now.getHours();
  const nowMin = hr * 60 + now.getMinutes();
  const workEnd = settings.workEnd != null ? settings.workEnd : 18;
  const workStart = settings.workStart != null ? settings.workStart : 9;

  // Parse each session's Persian "HH:MM" into minutes-of-day so we can tell
  // which sessions are still ahead and which are already done.
  const faToInt = (s) => parseInt(String(s).replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)), 10) || 0;
  const sessionMin = (t) => { const [h, m] = String(t).split(':'); return faToInt(h) * 60 + faToInt(m); };
  const upcomingToday = today.filter((s) => sessionMin(s.time) >= nowMin);
  const remaining = upcomingToday.length;
  const completed = total - remaining; // derived, not mocked — keeps stats & rows honest
  const nextTime = upcomingToday[0]?.time;

  let greeting, heroMsg;
  if (hr < workStart) {
    // Before the configured opening hour — clinic hasn't started yet.
    greeting = 'وقت بخیر';
    heroMsg = total > 0
      ? `امروز ${toFa(total)} جلسه پیشِ‌رو دارید${nextTime ? `، نخستین جلسه ساعت ${nextTime}` : ''}. فعلاً کمی برای خودتان وقت بگذارید.`
      : `هنوز جلسه‌ای ثبت نشده. کمی برای خودتان وقت بگذارید.`;
  } else if (hr >= workEnd) {
    // After the configured closing hour.
    greeting = 'شب بخیر';
    heroMsg = `کارِ امروز به پایان رسید. ${total > 0 ? `${toFa(total)} جلسه برگزار شد. ` : ''}کمی استراحت کنید — فردا دوباره اینجاییم.`;
  } else {
    // Open hours — speak to what's actually left on the schedule.
    greeting = hr < 12 ? 'صبح بخیر' : hr < 16 ? 'ظهر بخیر' : 'عصر بخیر';
    if (total === 0) {
      heroMsg = 'امروز جلسه‌ای ثبت نشده — فرصتی آرام برای رسیدگی به کارهای دیگر.';
    } else if (remaining === 0) {
      heroMsg = `همهٔ جلسات امروز برگزار شد — تا پایان ساعت کاری (${toFa(workEnd)}:۰۰) فرصتی آرام دارید.`;
    } else {
      heroMsg = `${toFa(remaining)} جلسهٔ پیشِ‌رو دارید — جلسهٔ بعدی ساعت ${nextTime}. فضای آرامی برای کارتان آماده است.`;
    }
  }

  return (
    <div className="page">
      {/* Calm hero — warm tone matched to the landing page */}
      <div className="dash-hero">
        <div className="dash-hero-orb a"></div>
        <div className="dash-hero-orb b"></div>
        <TimeMotif className="dash-hero-motif" />

        <div className="dash-hero-inner">
          <div className="dash-hero-text">
            <div className="dash-hero-eyebrow">
              <span className="dash-hero-dot"></span>
              {todayLabel}
            </div>
            <h1 className="dash-hero-title">
              {greeting}، پوریا
            </h1>
            <div className="dash-hero-sub">
              {heroMsg}
            </div>
            <div className="dash-hero-actions" style={{ marginTop: 24 }}>
              <button className="btn btn-primary" onClick={() => onBookSession()}>
                <Icon name="plus" size={14} />
                رزرو جلسه
              </button>
              <button className="btn btn-ghost" onClick={() => onNavigate('calendar')}>
                <Icon name="calendar" size={14} />
                تقویم کامل
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
        <StatCard label="جلسات امروز" value={toFa(total)} sub={`${toFa(completed)} انجام شده`} accent="sky" icon="calendar" />
        <StatCard label="مراجعین فعال" value={toFa(D.patients.filter(p=>p.status==='active').length)} sub="۲ مراجع جدید این هفته" accent="sage" icon="users" />
        <StatCard label="جلسات این هفته" value={toFa(16)} sub="۲ جلسه آنلاین" accent="lavender" icon="clock" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 24 }}>
        {/* Today's schedule */}
        <div className="card card-lg">
          <div className="row between" style={{ marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>جلسات امروز</div>
              <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 2 }}>{toFa(total)} جلسه برنامه‌ریزی شده</div>
            </div>
            <button className="btn btn-soft" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => onNavigate('calendar')}>
              همه
            </button>
          </div>

          <div className="col gap-8">
            {today.map((s, i) => {
              const p = getPatient(s.patientId);
              const isPast = i < completed;
              return (
                <div key={s.id} className="session-row" onClick={() => onPatientClick(p)}>
                  <div className="session-time">
                    <div className="time-num">{s.time}</div>
                    <div className="time-dur">{toFa(s.duration)} دقیقه</div>
                  </div>
                  <div style={{ width: 1, alignSelf: 'stretch', background: 'var(--line-soft)' }}></div>
                  <Avatar initials={patientInitials(p)} color={p.color} />
                  <div className="col" style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 500, fontSize: 14 }}>{p.firstName} {p.lastName}</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{p.tags?.[0] || `${toFa(p.sessions)} جلسه قبلی`}</div>
                  </div>
                  <div className="col gap-4" style={{ alignItems: 'flex-end' }}>
                    {s.mode === 'online'
                      ? <span className="tag tag-online"><span className="tag-dot"></span>آنلاین</span>
                      : <span className="tag tag-inperson"><span className="tag-dot"></span>حضوری</span>
                    }
                    {isPast && <span style={{ fontSize: 11, color: 'var(--ink-muted)' }}>تکمیل شده</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right column */}
        <div className="col gap-16">
          {/* Quick add card */}
          <div className="card card-lg" style={{
            background: 'linear-gradient(135deg, var(--accent-soft) 0%, #F2F4FB 100%)',
            border: 'none',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div className="organic-shape" style={{ background: 'var(--accent)', opacity: 0.10, width: 120, height: 120, top: -40, left: -40 }}></div>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <Icon name="leaf" size={28} />
              <div style={{ fontSize: 18, fontWeight: 600, marginTop: 12, letterSpacing: '-0.01em' }}>
                مراجع جدید دارید؟
              </div>
              <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 4, marginBottom: 16 }}>
                در کمتر از یک دقیقه ثبت کنید
              </div>
              <button className="btn btn-primary" onClick={onAddPatient}>
                <Icon name="plus" size={14} />
                افزودن مراجع
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Upcoming bookings for the coming days (online + office) */}
      <div className="card card-lg" style={{ marginTop: 24 }}>
        <div className="row between" style={{ marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>رزروهای روزهای آینده</div>
            <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 2 }}>
              {pending.length > 0
                ? `${toFa(pending.length)} درخواست در انتظار بررسی`
                : 'همه درخواست‌ها بررسی شده‌اند'}
            </div>
          </div>
          <button className="btn btn-soft" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => onNavigate('requests')}>
            بررسی درخواست‌ها
          </button>
        </div>

        {upcoming.length === 0 ? (
          <div style={{ fontSize: 13, color: 'var(--ink-muted)', padding: '8px 2px' }}>
            رزرو تازه‌ای برای روزهای آینده ثبت نشده است.
          </div>
        ) : (
          <div className="col gap-8">
            {upcoming.map(r => {
              const fromWeb = r.source === 'online';
              const isOnline = r.mode === 'online';
              return (
                <div key={r.id} className="session-row" style={{ cursor: 'pointer' }} onClick={() => onNavigate('requests')}>
                  <Avatar initials={(r.firstName.charAt(0) || '') + (r.lastName.charAt(0) || '')} color={r.color} />
                  <div className="col" style={{ flex: 1, minWidth: 0 }}>
                    <div className="row gap-8" style={{ alignItems: 'center' }}>
                      <span style={{ fontWeight: 500, fontSize: 14 }}>{r.firstName} {r.lastName}</span>
                      <span className="req-pill" style={{
                        background: fromWeb ? 'var(--lavender-soft)' : 'var(--bg-soft)',
                        color: fromWeb ? '#6a5a85' : 'var(--ink-soft)',
                      }}>
                        <span className="tag-dot" style={{ background: fromWeb ? '#6a5a85' : 'var(--ink-muted)' }}></span>
                        {fromWeb ? 'از وب‌سایت' : 'ثبت دفتر'}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 2 }}>
                      {r.dateLabel} • {r.time}
                    </div>
                  </div>
                  <div className="col gap-4" style={{ alignItems: 'flex-end' }}>
                    {isOnline
                      ? <span className="tag tag-online"><span className="tag-dot"></span>آنلاین</span>
                      : <span className="tag tag-inperson"><span className="tag-dot"></span>حضوری</span>}
                    <span className="req-pill" style={{
                      background: r.status === 'pending' ? 'var(--beige-soft)' : 'var(--sage-soft)',
                      color: r.status === 'pending' ? '#8a7345' : '#4a6b56',
                    }}>
                      {r.status === 'pending' ? 'در انتظار تأیید' : 'تأیید شده'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ label, value, sub, accent, icon }) => (
  <div className="card" style={{ padding: 20 }}>
    <div className="row between" style={{ marginBottom: 12 }}>
      <div style={{
        width: 32, height: 32, borderRadius: 10,
        background: `var(--${accent}-soft)`,
        color: colorMapInk[accent],
        display: 'grid', placeItems: 'center'
      }}>
        <Icon name={icon} size={16} />
      </div>
    </div>
    <div style={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.1 }}>{value}</div>
    <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 6, fontWeight: 500 }}>{label}</div>
    <div style={{ fontSize: 11, color: 'var(--ink-muted)', marginTop: 2 }}>{sub}</div>
  </div>
);

Object.assign(window, { DashboardPage });
