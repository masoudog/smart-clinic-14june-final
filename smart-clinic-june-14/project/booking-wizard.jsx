// Online reservation wizard — recreated from the Figma "Reservation" frame.
// Steps (RTL, right→left): خدمت → تاریخ → ساعت → اطلاعات → (success)
// Presented as a centered modal over the marketing site. Integrates with the
// CRM's availability engine (window.* Jalali helpers + live calendar events).

const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const toFa = (n) => String(n).replace(/[0-9]/g, (d) => FA_DIGITS[d]);
const PMONTHS = ['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];
const MONTH_LEN = [31,31,31,31,31,31,30,30,30,30,30,29];
const DAY_LABELS = ['شنبه','یکشنبه','دوشنبه','سه‌شنبه','چهارشنبه','پنج‌شنبه','جمعه'];
// Single-letter weekday headers for the calendar (Sat → Fri)
const DAY_INITIALS = ['ش','ی','د','س','چ','پ','ج'];

// Build, per upcoming open day, the full list of free hours by reading the live
// calendar events — richer than computeSlots (which only spreads one pick/day).
const buildAvailability = (events, blocked, settings = {}) => {
  const ws = settings.workStart != null ? settings.workStart : 9;
  const we = settings.workEnd != null ? settings.workEnd : 18;
  const buf = settings.sessionBuffer || 0;
  const allHours = Array.from({ length: we - ws }, (_, i) => ws + i);
  const isBlocked = (key, dow, h) =>
    (blocked || []).some((b) => (b.dateKey ? b.dateKey === key : b.dow === dow) && b.hour === h);
  const nowHour = new Date().getHours();
  const byKey = {};
  const days = [];
  for (let off = 0; off <= 21 && days.length < 21; off++) {
    const j = window.jalaliFromOffset(off);
    const dow = j.dow;
    if (dow === 6) continue; // Friday closed
    const key = window.jKey(j.year, j.monthIdx, j.day);
    const taken = (events || []).filter((e) => e.day === dow).map((e) => e.startHour);
    const isFree = (h) =>
      h !== 12 &&                                   // lunch break
      !taken.includes(h) && !isBlocked(key, dow, h) &&
      (buf === 0 || (!taken.includes(h - buf) && !isBlocked(key, dow, h - buf))) &&
      (off !== 0 || h > nowHour);                   // today: only times still ahead
    const free = allHours.filter(isFree);
    if (!free.length) continue;
    const rec = {
      off, dow, day: j.day, monthIdx: j.monthIdx, year: j.year,
      isToday: off === 0,
      dayLabel: DAY_LABELS[dow],
      shortLabel: `${DAY_LABELS[dow]} ${toFa(j.day)} ${PMONTHS[j.monthIdx]}`,
      dateLabel: off === 0
        ? `امروز — ${toFa(j.day)} ${PMONTHS[j.monthIdx]}`
        : `${DAY_LABELS[dow]}، ${toFa(j.day)} ${PMONTHS[j.monthIdx]}`,
      hours: allHours.map((h) => ({ hour: h, label: `${toFa(h)}:۰۰`, blocked: !isFree(h) })),
    };
    byKey[key] = rec;
    days.push(rec);
  }
  return { days, byKey };
};

// Weeks (arrays of cells) for a Jalali month grid. day-1 weekday is derived
// from today (reliable within the booking window's month range).
const monthGrid = (year, monthIdx) => {
  const T = window.JALALI_TODAY;
  let day1Dow;
  if (year === T.year && monthIdx === T.monthIdx) {
    day1Dow = ((T.dow - (T.day - 1)) % 7 + 7) % 7;
  } else {
    // walk forward from this month's day-1
    let dow = ((T.dow - (T.day - 1)) % 7 + 7) % 7;
    let y = T.year, m = T.monthIdx;
    while (!(y === year && m === monthIdx)) {
      dow = (dow + MONTH_LEN[m]) % 7;
      m++; if (m > 11) { m = 0; y++; }
      if (y > T.year + 1) break;
    }
    day1Dow = dow;
  }
  const len = MONTH_LEN[monthIdx];
  const cells = [];
  for (let i = 0; i < day1Dow; i++) cells.push(null);
  for (let d = 1; d <= len; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
};

const SERVICES = [
  { id: 'adult',   label: 'روانشناسی بزرگسال',        icon: 'brain',  tint: '#3A404A' },
  { id: 'child',   label: 'روانشناسی کودک و نوجوان',  icon: 'users',  tint: '#3A404A' },
  { id: 'anxiety', label: 'اختلالات اضطرابی',          icon: 'zap',    tint: '#8951E0' },
  { id: 'sleep',   label: 'اختلالات خواب',             icon: 'moon',   tint: '#E06161' },
];

const STEPS = [
  { id: 'service', label: 'خدمت' },
  { id: 'date',    label: 'تاریخ' },
  { id: 'time',    label: 'ساعت' },
  { id: 'info',    label: 'اطلاعات' },
];

/* ---------- stepper ---------- */
const StepDot = ({ state }) => {
  // state: 'empty' | 'active' | 'done'
  if (state === 'done') {
    return (
      <span className="bw-dot bw-done">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7" /></svg>
      </span>
    );
  }
  if (state === 'active') return <span className="bw-dot bw-active"><i></i></span>;
  return <span className="bw-dot bw-empty"></span>;
};

const Stepper = ({ index }) => (
  <div className="bw-stepper">
    {STEPS.map((s, i) => {
      const state = i < index ? 'done' : i === index ? 'active' : 'empty';
      return (
        <React.Fragment key={s.id}>
          {i > 0 && <span className={`bw-line ${i <= index ? 'fill' : ''}`}></span>}
          <div className="bw-step">
            <StepDot state={state} />
            <span className={`bw-step-label ${state !== 'empty' ? 'on' : ''}`}>{s.label}</span>
          </div>
        </React.Fragment>
      );
    })}
  </div>
);

/* ---------- the wizard ---------- */
const BookingWizard = ({ events = [], settings = {}, onClose, onSubmit, initialService = null, embed = false }) => {
  const avail = React.useMemo(
    () => buildAvailability(events, settings.blockedSlots, settings),
    [events, settings]
  );
  const firstDay = avail.days[0];
  const [step, setStep] = React.useState('service');
  const [service, setService] = React.useState(initialService);
  const [viewYear, setViewYear] = React.useState(firstDay ? firstDay.year : window.JALALI_TODAY.year);
  const [viewMonth, setViewMonth] = React.useState(firstDay ? firstDay.monthIdx : window.JALALI_TODAY.monthIdx);
  const [dateKey, setDateKey] = React.useState(null);
  const [hour, setHour] = React.useState(null);
  const [name, setName] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const phoneRef = React.useRef(null);

  const stepIndex = STEPS.findIndex((s) => s.id === step);
  const dayRec = dateKey ? avail.byKey[dateKey] : null;
  const serviceObj = SERVICES.find((s) => s.id === service);

  const canNext =
    step === 'service' ? !!service :
    step === 'date'    ? !!dateKey  :
    step === 'time'    ? hour != null :
    step === 'info'    ? name.trim() && phone.trim() : false;

  const next = () => {
    if (!canNext) {
      if (step === 'info' && !phone.trim()) {
        const f = phoneRef.current?.closest('.bw-field');
        f?.animate(
          [{ transform: 'translateX(0)' }, { transform: 'translateX(-5px)' }, { transform: 'translateX(4px)' }, { transform: 'translateX(0)' }],
          { duration: 320, easing: 'ease-out' });
        phoneRef.current?.focus();
      }
      return;
    }
    if (step === 'service') setStep('date');
    else if (step === 'date') setStep('time');
    else if (step === 'time') setStep('info');
    else if (step === 'info') submit();
  };
  const prev = () => {
    if (step === 'date') setStep('service');
    else if (step === 'time') setStep('date');
    else if (step === 'info') setStep('time');
  };

  const submit = () => {
    const slot = {
      dateLabel: dayRec.dateLabel,
      timeLabel: `${toFa(hour)}:۰۰`,
      dow: dayRec.dow,
      hour,
    };
    onSubmit?.({
      kind: 'booking',
      name: name.trim(),
      phone: phone.trim(),
      slot,
      mode: 'in-person',
      reason: serviceObj ? serviceObj.label : '',
    });
    setStep('done');
  };

  const restart = () => {
    setService(null); setDateKey(null); setHour(null); setName(''); setPhone('');
    setStep('service');
  };

  // month navigation bounds: only months that contain availability
  const monthsWithSlots = React.useMemo(() => {
    const set = new Set(avail.days.map((d) => `${d.year}-${d.monthIdx}`));
    return set;
  }, [avail]);
  const stepMonth = (dir) => {
    let y = viewYear, m = viewMonth + dir;
    if (m > 11) { m = 0; y++; } else if (m < 0) { m = 11; y--; }
    setViewYear(y); setViewMonth(m);
  };
  const canPrevMonth = (() => {
    let y = viewYear, m = viewMonth - 1; if (m < 0) { m = 11; y--; }
    return monthsWithSlots.has(`${y}-${m}`);
  })();
  const canNextMonth = (() => {
    let y = viewYear, m = viewMonth + 1; if (m > 11) { m = 0; y++; }
    return monthsWithSlots.has(`${y}-${m}`);
  })();

  const card = (
      <div className={`bw-card ${step === 'done' ? 'done' : ''} ${embed ? 'embed' : ''}`} role="dialog" aria-modal={!embed}>
        {!embed && (
          <button className="bw-close" onClick={onClose} aria-label="بستن">
            <Icon name="close" size={18} />
          </button>
        )}

        <div className="bw-head">
          <h2>رزرو آنلاین نوبت</h2>
          <p>اولین قدم به سوی سلامت روان</p>
        </div>

        {step !== 'done' && <Stepper index={stepIndex} />}

        {/* ---- SERVICE ---- */}
        {step === 'service' && (
          <div className="bw-body">
            <div className="bw-prompt">چه خدمتی نیاز دارید؟</div>
            <div className="bw-services">
              {SERVICES.map((s) => (
                <button
                  key={s.id}
                  className={`bw-service ${service === s.id ? 'sel' : ''}`}
                  onClick={() => setService(s.id)}>
                  <span className="bw-ico" style={{ color: s.tint }}><Icon name={s.icon} size={16} /></span>
                  <span className="bw-service-label">{s.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ---- DATE ---- */}
        {step === 'date' && (
          <div className="bw-body">
            <div className="bw-prompt">تاریخ مراجعه را انتخاب کنید</div>
            <div className="bw-cal">
              <div className="bw-cal-head">
                <button className="bw-cal-nav" disabled={!canNextMonth} onClick={() => stepMonth(1)} aria-label="ماه بعد">
                  <Icon name="chevronLeft" size={16} />
                </button>
                <span className="bw-cal-title">{PMONTHS[viewMonth]} {toFa(viewYear)}</span>
                <button className="bw-cal-nav" disabled={!canPrevMonth} onClick={() => stepMonth(-1)} aria-label="ماه قبل">
                  <Icon name="chevronRight" size={16} />
                </button>
              </div>
              <div className="bw-cal-grid bw-cal-dow">
                {DAY_INITIALS.map((d, i) => <span key={i} className="bw-cal-wd">{d}</span>)}
              </div>
              {monthGrid(viewYear, viewMonth).map((week, wi) => (
                <div className="bw-cal-grid" key={wi}>
                  {week.map((d, di) => {
                    if (d == null) return <span key={di} className="bw-cal-cell bw-cell-empty"></span>;
                    const key = window.jKey(viewYear, viewMonth, d);
                    const open = !!avail.byKey[key];
                    const sel = dateKey === key;
                    return (
                      <button
                        key={di}
                        className={`bw-cal-cell ${open ? 'open' : 'closed'} ${sel ? 'sel' : ''}`}
                        disabled={!open}
                        onClick={() => { setDateKey(key); setHour(null); }}>
                        {toFa(d)}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ---- TIME ---- */}
        {step === 'time' && (
          <div className="bw-body">
            <div className="bw-prompt">ساعت مراجعه را انتخاب کنید</div>
            <div className="bw-subprompt">ساعت‌های آزاد — {dayRec ? dayRec.shortLabel : ''}</div>
            <div className="bw-times">
              {dayRec && dayRec.hours.map((h) => (
                <button
                  key={h.hour}
                  className={`bw-time ${hour === h.hour ? 'sel' : ''} ${h.blocked ? 'blocked' : ''}`}
                  disabled={h.blocked}
                  onClick={() => !h.blocked && setHour(h.hour)}>
                  {h.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ---- INFO ---- */}
        {step === 'info' && (
          <div className="bw-body">
            <div className="bw-prompt">اطلاعات تماس خود را وارد کنید</div>
            <div className="bw-fields">
              <div className="bw-field">
                <label>نام و نام خانوادگی</label>
                <input
                  autoFocus
                  placeholder="مثال: حسین ملکی"
                  value={name}
                  onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="bw-field">
                <label>شماره تماس</label>
                <input
                  ref={phoneRef}
                  inputMode="tel"
                  placeholder="مثال: ۰۹۱۴۱۲۳۴۵۶۷"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && next()} />
              </div>
            </div>
          </div>
        )}

        {/* ---- SUCCESS ---- */}
        {step === 'done' && (
          <div className="bw-body bw-done">
            <div className="bw-check">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7" /></svg>
            </div>
            <div className="bw-done-title">نوبت شما ثبت شد!</div>
            <div className="bw-done-sub">به زودی با شما تماس می‌گیریم</div>
            <div className="bw-summary">
              <div className="bw-sum-row">
                <span className="bw-sum-key"><Icon name={serviceObj ? serviceObj.icon : 'brain'} size={16} />خدمت</span>
                <span className="bw-sum-val">{serviceObj ? serviceObj.label : ''}</span>
              </div>
              <div className="bw-sum-row">
                <span className="bw-sum-key"><Icon name="calendar" size={16} />روز</span>
                <span className="bw-sum-val">{dayRec ? dayRec.shortLabel : ''}</span>
              </div>
              <div className="bw-sum-row">
                <span className="bw-sum-key"><Icon name="clock" size={16} />ساعت</span>
                <span className="bw-sum-val">{toFa(hour)}:۰۰</span>
              </div>
              <div className="bw-sum-row">
                <span className="bw-sum-key"><Icon name="user" size={16} />به نام</span>
                <span className="bw-sum-val">{name}</span>
              </div>
            </div>
            <button className="bw-btn primary full" onClick={restart}>رزرو نوبت جدید</button>
          </div>
        )}

        {/* ---- FOOTER NAV ---- */}
        {step !== 'done' && (
          <div className="bw-actions">
            <button className={`bw-btn primary ${stepIndex > 0 ? '' : 'full'} ${canNext ? '' : 'disabled'}`} onClick={next}>
              <Icon name="arrowLeft" size={20} />
              <span>{step === 'info' ? 'ثبت نوبت' : 'بعدی'}</span>
            </button>
            {stepIndex > 0 && (
              <button className="bw-btn ghost" onClick={prev}>قبلی</button>
            )}
          </div>
        )}
      </div>
  );

  if (embed) return card;
  return (
    <div className="bw-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      {card}
    </div>
  );
};

Object.assign(window, { BookingWizard });

/* ============================================================
   URGENT-NEED MODAL — opened by the header «ثبت نیاز فوری» button.
   Amber-headed callback form; files a "نیاز فوری" request.
   ============================================================ */
const UrgentModal = ({ phone = '۰۴۱۳–۳۵۰۵۸۰۰۸', tel = '0413355058008', onClose, onSubmit }) => {
  const [name, setName] = React.useState('');
  const [num, setNum] = React.useState('');
  const phoneRef = React.useRef(null);
  const canSubmit = name.trim() && num.trim();

  const submit = () => {
    if (!canSubmit) {
      if (!num.trim()) {
        const f = phoneRef.current?.closest('.bw-field');
        f?.animate(
          [{ transform: 'translateX(0)' }, { transform: 'translateX(-5px)' }, { transform: 'translateX(4px)' }, { transform: 'translateX(0)' }],
          { duration: 320, easing: 'ease-out' });
        phoneRef.current?.focus();
      }
      return;
    }
    onSubmit?.({ kind: 'urgent', name: name.trim(), phone: num.trim(), reason: 'urgent', mode: 'in-person' });
    onClose?.();
  };

  return (
    <div className="bw-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div className="bw-card urgent" role="dialog" aria-modal="true">
        <div className="ur-head">
          <span className="ur-ico">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><path d="M12 8v5" /><path d="M12 16h.01" />
            </svg>
          </span>
          نیاز فوری دارید؟
        </div>

        <div className="ur-body">
          <p className="ur-lead">
            اگر شرایط اضطراری است، همین حالا تماس بگیرید. در غیر این صورت شماره خود را ثبت کنید
            تا با شما در سریع‌ترین زمان ممکن تماس گرفته شود.
          </p>
          <a className="ur-call" href={`tel:${tel}`}>
            <span className="ur-call-num">{phone}</span>
            <Icon name="phone" size={18} />
          </a>

          <div className="ur-divider"></div>

          <p className="ur-sub">نام و شماره تماس خود را ثبت کنید.</p>
          <div className="bw-fields">
            <div className="bw-field">
              <label>نام و نام خانوادگی</label>
              <input autoFocus placeholder="مثال: حسین ملکی" value={name}
                     onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="bw-field">
              <label>شماره تماس</label>
              <input ref={phoneRef} inputMode="tel" placeholder="مثال: ۰۹۱۴۱۲۳۴۵۶۷" value={num}
                     onChange={(e) => setNum(e.target.value)}
                     onKeyDown={(e) => e.key === 'Enter' && submit()} />
            </div>
          </div>

          <div className="bw-actions">
            <button className={`bw-btn primary ${canSubmit ? '' : 'disabled'}`} onClick={submit}>ثبت درخواست</button>
            <button className="bw-btn ghost" onClick={onClose}>بستن</button>
          </div>
        </div>
      </div>
    </div>
  );
};

Object.assign(window, { BookingWizard, UrgentModal });
