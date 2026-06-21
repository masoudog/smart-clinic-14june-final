// Booking flow — embeddable in landing page or anywhere.
// Multi-step form with confirmation screen.

const BookingFlow = ({ onSubmit }) => {
  const [step, setStep] = React.useState(1); // 1: type, 2: date/time, 3: info, 4: confirm
  const [booking, setBooking] = React.useState({
    mode: 'in-person',
    duration: 60,
    date: null,
    time: null,
    firstName: '',
    lastName: '',
    phone: '',
    reason: '',
    isReturning: false,
  });

  const update = (patch) => setBooking({ ...booking, ...patch });

  // Generate next 14 days starting from 15 ordibehesht
  const days = React.useMemo(() => {
    const labels = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'];
    const result = [];
    for (let i = 1; i <= 14; i++) {
      const dayLabel = labels[(2 + i) % 7]; // base: monday = index 2
      const date = 14 + i;
      const isFriday = ((2 + i) % 7) === 6;
      result.push({
        id: `d${i}`,
        dayLabel,
        date: toFa(date > 31 ? date - 31 : date),
        month: date > 31 ? 'خرداد' : 'اردیبهشت',
        disabled: isFriday,
      });
    }
    return result;
  }, []);

  const timeSlots = ['۰۹:۰۰', '۱۰:۰۰', '۱۱:۰۰', '۱۲:۰۰', '۱۴:۰۰', '۱۵:۰۰', '۱۶:۰۰', '۱۷:۰۰'];
  const unavailable = ['۱۲:۰۰', '۱۵:۰۰']; // mock

  const canProceed =
    (step === 1 && booking.mode) ||
    (step === 2 && booking.date && booking.time) ||
    (step === 3 && booking.firstName && booking.lastName && booking.phone);

  const reset = () => {
    setBooking({ mode: 'in-person', duration: 60, date: null, time: null, firstName: '', lastName: '', phone: '', reason: '', isReturning: false });
    setStep(1);
  };

  if (step === 4) {
    return <BookingConfirmation booking={booking} onReset={reset} days={days} />;
  }

  return (
    <div className="booking-flow">
      {/* Stepper */}
      <div className="booking-stepper">
        {[
          { n: 1, label: 'نوع جلسه' },
          { n: 2, label: 'تاریخ و ساعت' },
          { n: 3, label: 'اطلاعات شما' },
        ].map((s, i, arr) => (
          <React.Fragment key={s.n}>
            <div className={`step ${step >= s.n ? 'active' : ''} ${step > s.n ? 'done' : ''}`}>
              <div className="step-num">{step > s.n ? <Icon name="check" size={14} /> : toFa(s.n)}</div>
              <div className="step-label">{s.label}</div>
            </div>
            {i < arr.length - 1 && <div className={`step-line ${step > s.n ? 'active' : ''}`}></div>}
          </React.Fragment>
        ))}
      </div>

      <div className="booking-card">
        {step === 1 && (
          <div className="booking-step">
            <div className="step-title">جلسه را چگونه می‌خواهید برگزار کنید؟</div>
            <div className="step-sub">می‌توانید بعداً هم تغییرش بدهید.</div>

            <div className="mode-grid">
              <ModeCard
                icon="user"
                title="حضوری در مطب"
                desc="ملاقات حضوری در محیطی آرام در مطب، شمال تهران."
                meta="۶۰ دقیقه"
                selected={booking.mode === 'in-person'}
                accent="sky"
                onClick={() => update({ mode: 'in-person' })}
              />
              <ModeCard
                icon="sparkle"
                title="آنلاین (ویدیویی)"
                desc="گفتگوی تصویری از طریق لینک امن. در هر کجا که هستید."
                meta="۶۰ دقیقه"
                selected={booking.mode === 'online'}
                accent="lavender"
                onClick={() => update({ mode: 'online' })}
              />
            </div>

            <label className="returning-row">
              <input type="checkbox" checked={booking.isReturning} onChange={e => update({ isReturning: e.target.checked })} />
              <span>قبلاً به این مطب مراجعه کرده‌ام</span>
            </label>
          </div>
        )}

        {step === 2 && (
          <div className="booking-step">
            <div className="step-title">یک تاریخ و ساعت انتخاب کنید</div>
            <div className="step-sub">ساعات خاکستری در دسترس نیستند.</div>

            <div style={{ marginTop: 24 }}>
              <div className="field-label">تاریخ</div>
              <div className="day-scroller">
                {days.map(d => (
                  <button
                    key={d.id}
                    disabled={d.disabled}
                    className={`day-pill ${booking.date === d.id ? 'selected' : ''}`}
                    onClick={() => update({ date: d.id })}
                  >
                    <div className="day-pill-label">{d.dayLabel}</div>
                    <div className="day-pill-date">{d.date}</div>
                    <div className="day-pill-month">{d.month}</div>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginTop: 28 }}>
              <div className="field-label">ساعت</div>
              <div className="time-grid">
                {timeSlots.map(t => {
                  const dis = unavailable.includes(t) || !booking.date;
                  return (
                    <button
                      key={t}
                      disabled={dis}
                      className={`time-pill ${booking.time === t ? 'selected' : ''}`}
                      onClick={() => update({ time: t })}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="booking-step">
            <div className="step-title">آخرین قدم — کمی درباره خودتان</div>
            <div className="step-sub">این اطلاعات کاملاً محرمانه می‌مانند.</div>

            <div className="field-row" style={{ marginTop: 20 }}>
              <div className="field">
                <label>نام</label>
                <input placeholder="مثلاً مریم" value={booking.firstName} onChange={e => update({ firstName: e.target.value })} />
              </div>
              <div className="field">
                <label>نام خانوادگی</label>
                <input placeholder="مثلاً احمدی" value={booking.lastName} onChange={e => update({ lastName: e.target.value })} />
              </div>
            </div>
            <div className="field">
              <label>شماره موبایل</label>
              <input placeholder="۰۹۱۲..." value={booking.phone} onChange={e => update({ phone: e.target.value })} />
            </div>
            <div className="field">
              <label>چه چیزی شما را به اینجا آورده؟ <span style={{ color: 'var(--ink-muted)', fontWeight: 400 }}>(اختیاری)</span></label>
              <textarea
                placeholder="هر چه راحت‌تر هستید بنویسید — یک کلمه هم کافی است."
                value={booking.reason}
                onChange={e => update({ reason: e.target.value })}
              ></textarea>
            </div>
          </div>
        )}

        <div className="booking-nav">
          <button
            className="btn btn-ghost"
            disabled={step === 1}
            style={{ visibility: step === 1 ? 'hidden' : 'visible' }}
            onClick={() => setStep(step - 1)}
          >
            <Icon name="arrowRight" size={14} />
            مرحله قبل
          </button>

          <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
            مرحله {toFa(step)} از ۳
          </div>

          <button
            className="btn btn-primary"
            disabled={!canProceed}
            style={{ opacity: canProceed ? 1 : 0.4 }}
            onClick={() => {
              if (!canProceed) return;
              if (step === 3) onSubmit?.(booking);
              setStep(step + 1);
            }}
          >
            {step === 3 ? 'تأیید و رزرو' : 'مرحله بعد'}
            <Icon name="arrow" size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

const ModeCard = ({ icon, title, desc, meta, selected, accent, onClick }) => (
  <button className={`mode-card ${selected ? 'selected' : ''}`} onClick={onClick}>
    <div className="mode-icon" style={{ background: `var(--${accent}-soft)`, color: colorMapInk[accent] }}>
      <Icon name={icon} size={22} />
    </div>
    <div className="mode-title">{title}</div>
    <div className="mode-desc">{desc}</div>
    <div className="mode-meta">{meta}</div>
    <div className="mode-radio">
      <div className="mode-radio-inner"></div>
    </div>
  </button>
);

const BookingConfirmation = ({ booking, onReset, days }) => {
  const day = days.find(d => d.id === booking.date);
  return (
    <div className="confirmation">
      <div className="confirm-mark">
        <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
          <circle cx="28" cy="28" r="26" stroke="currentColor" strokeWidth="1.5" opacity="0.25"/>
          <path d="M18 28l7 7 13-14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <h2 className="confirm-title">رزرو شما ثبت شد</h2>
      <p className="confirm-sub">
        پیامک تأیید به شماره {booking.phone || '۰۹...'} ارسال خواهد شد.
        <br />منتظر دیدارتان هستیم، {booking.firstName}.
      </p>

      <div className="confirm-card">
        <ConfirmRow label="تاریخ" value={day ? `${day.dayLabel}، ${day.date} ${day.month}` : '-'} />
        <ConfirmRow label="ساعت" value={booking.time || '-'} />
        <ConfirmRow label="نوع جلسه" value={booking.mode === 'online' ? 'آنلاین (ویدیویی)' : 'حضوری در مطب'} />
        <ConfirmRow label="مدت" value="۶۰ دقیقه" />
        <ConfirmRow label="هزینه" value="در پیامک تأیید ارسال می‌شود" last />
      </div>

      <div className="row gap-8" style={{ justifyContent: 'center', marginTop: 28 }}>
        <button className="btn btn-soft">
          <Icon name="calendar" size={14} />
          افزودن به تقویم
        </button>
        <button className="btn btn-ghost" onClick={onReset}>
          رزرو جلسه دیگر
        </button>
      </div>
    </div>
  );
};

const ConfirmRow = ({ label, value, last }) => (
  <div className="row between" style={{
    padding: '12px 0',
    borderBottom: last ? 'none' : '1px solid var(--line-soft)',
    fontSize: 13,
  }}>
    <span style={{ color: 'var(--ink-muted)' }}>{label}</span>
    <span style={{ color: 'var(--ink)', fontWeight: 500 }}>{value}</span>
  </div>
);

Object.assign(window, { BookingFlow, ModeCard, BookingConfirmation, ConfirmRow });
