// Notifications, Settings, and Modals
const toFa = (n) => String(n).replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
const NotificationsPage = ({ notifications, onMarkAllRead }) => {
  const iconFor = (type) => {
    if (type === 'reminder') return { icon: 'clock', bg: 'var(--sky-soft)', color: '#3d6680' };
    if (type === 'booking')  return { icon: 'calendar', bg: 'var(--sage-soft)', color: '#4a6b56' };
    return { icon: 'bell', bg: 'var(--bg-soft)', color: 'var(--ink-soft)' };
  };

  const unread = notifications.filter(n => !n.read);
  const earlier = notifications.filter(n => n.read);

  return (
    <div className="page" style={{ maxWidth: 800 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">اعلان‌ها</h1>
          <div className="page-sub">{toFa(unread.length)} اعلان خوانده‌نشده</div>
        </div>
        <button className="btn btn-soft" onClick={onMarkAllRead}>
          <Icon name="check" size={14} />
          همه را خوانده‌شده علامت بزن
        </button>
      </div>

      {unread.length > 0 && (
        <>
          <div style={{ fontSize: 11, color: 'var(--ink-muted)', marginBottom: 8, padding: '0 4px' }}>جدید</div>
          <div className="card" style={{ padding: 8, marginBottom: 24 }}>
            {unread.map(n => {
              const i = iconFor(n.type);
              return (
                <div key={n.id} className="notif-row unread">
                  <div className="notif-icon" style={{ background: i.bg, color: i.color }}>
                    <Icon name={i.icon} size={16} />
                  </div>
                  <div className="notif-content">
                    <div className="notif-title">{n.title}</div>
                    <div className="notif-body">{n.body}</div>
                    <div className="notif-time">{n.time}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <div style={{ fontSize: 11, color: 'var(--ink-muted)', marginBottom: 8, padding: '0 4px' }}>قبلی</div>
      <div className="card" style={{ padding: 8 }}>
        {earlier.map(n => {
          const i = iconFor(n.type);
          return (
            <div key={n.id} className="notif-row">
              <div className="notif-icon" style={{ background: i.bg, color: i.color }}>
                <Icon name={i.icon} size={16} />
              </div>
              <div className="notif-content">
                <div className="notif-title">{n.title}</div>
                <div className="notif-body">{n.body}</div>
                <div className="notif-time">{n.time}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const SettingsPage = ({ settings = {}, onSettingsChange, onToast }) => {
  const [toggles, setToggles] = React.useState({
    sessionReminders: true,
    weeklyReport: false,
    smsNotif: true,
  });
  const flip = (k) => setToggles({ ...toggles, [k]: !toggles[k] });

  // Local draft — committed only when the user presses Save.
  const [draft, setDraft] = React.useState(settings);
  const setD = (patch) => setDraft(d => ({ ...d, ...patch }));
  const dirty = JSON.stringify(draft) !== JSON.stringify(settings);
  const bookingOn = draft.onlineBookingEnabled !== false;

  const [blockHour, setBlockHour] = React.useState(draft.workStart != null ? draft.workStart : 9);
  const [blockEndHour, setBlockEndHour] = React.useState((draft.workStart != null ? draft.workStart : 9) + 1);
  const workHourOptions = Array.from({ length: (draft.workEnd || 18) - (draft.workStart || 9) }, (_, i) => (draft.workStart || 9) + i);

  // Simple 3-select Persian date picker for blocked slots
  const dayLabels = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'];
  const persianMonthNames = ['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];
  const monthLengths = [31,31,31,31,31,31,30,30,30,30,30,29];
  const [blockYear,  setBlockYear]  = React.useState(window.JALALI_TODAY.year);
  const [blockMonth, setBlockMonth] = React.useState(window.JALALI_TODAY.monthIdx + 1);
  const [blockDay,   setBlockDay]   = React.useState(window.JALALI_TODAY.day);
  // Derive weekday from the chosen Jalali date. Reference: 1405/02/14 = دوشنبه (dow index 2).
  const jalaliDow = (y, m, d) => {
    const doy = (mm, dd) => { let s = 0; for (let i = 0; i < mm - 1; i++) s += monthLengths[i]; return s + dd; };
    const total = (y - 1405) * 365 + doy(m, d) - doy(2, 14);
    return ((2 + total) % 7 + 7) % 7;
  };
  const blockDow = jalaliDow(blockYear, blockMonth, blockDay);
  const blockDateLabel = toFa(blockDay) + ' ' + persianMonthNames[blockMonth - 1] + ' ' + toFa(blockYear);
  const daysInMonth = monthLengths[blockMonth - 1] || 30;

  const blocked = draft.blockedSlots || [];

  // Patient-tag management
  const [newTag, setNewTag] = React.useState('');
  const addTag = () => {
    const t = newTag.trim();
    if (!t) return;
    const existing = draft.patientTags || [];
    if (!existing.includes(t)) setD({ patientTags: [...existing, t] });
    setNewTag('');
  };

  const addBlock = function() {
    const endH = blockEndHour > blockHour ? blockEndHour : blockHour + 1;
    const dateLabel = blockDateLabel;
    const dateKey = window.jKey(blockYear, blockMonth - 1, blockDay);
    const newSlots = [];
    for (let h = blockHour; h < endH; h++) {
      newSlots.push({ dow: blockDow, hour: h, endHour: endH, date: dateLabel, dateKey: dateKey });
    }
    const existing = blocked.filter(function(b) {
      return !newSlots.some(function(n) { return n.dateKey === b.dateKey && n.hour === b.hour; });
    });
    setD({ blockedSlots: existing.concat(newSlots) });
  };

  // Pre-compute one pill per blocked range
  const seenPills = {};
  const blockedPills = blocked.filter(function(b) {
    const bkey = b.dateKey || b.date;
    const k = bkey + '|' + b.endHour;
    const hasEarlier = blocked.some(function(x) {
      return (x.dateKey || x.date) === bkey && x.endHour === b.endHour && x.hour < b.hour;
    });
    if (hasEarlier || seenPills[k]) return false;
    seenPills[k] = true;
    return true;
  });

  const save = () => {
    onSettingsChange?.(draft);
    onToast?.('تنظیمات ذخیره شد');
  };

  return (
    <div className="page" style={{ maxWidth: 880 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">تنظیمات</h1>
          <div className="page-sub">حساب کاربری و ترجیحات کلینیک</div>
        </div>
        <button className="btn btn-primary" disabled={!dirty} style={{ opacity: dirty ? 1 : 0.5 }} onClick={save}>
          <Icon name="check" size={14} />
          ذخیره تغییرات
        </button>
      </div>

      {/* Online booking master switch */}
      <div className="card card-lg" style={{ marginBottom: 20 }}>
        <SettingsRow
          title="رزرو آنلاین از وب‌سایت"
          desc="وقتی خاموش باشد، فرم رزرو در صفحه اصلی بسته می‌شود و پیام تماس با دفتر نمایش داده می‌شود.">
          <Toggle on={bookingOn} onChange={() => setD({ onlineBookingEnabled: !bookingOn })} />
        </SettingsRow>

        {!bookingOn && (
          <>
            <SettingsRow title="پیام صفحه اصلی" desc="متنی که هنگام بسته بودن رزرو به بازدیدکنندگان نشان داده می‌شود. از <br/> برای خط جدید استفاده کنید.">
              <textarea
                style={{ ...inputStyle, width: 320, minHeight: 64, lineHeight: 1.7, resize: 'vertical' }}
                value={draft.closedMessage || ''}
                onChange={e => setD({ closedMessage: e.target.value })} />
            </SettingsRow>
            <SettingsRow title="شماره دفتر" desc="شماره‌ای که برای تماس در صفحه اصلی نشان داده می‌شود.">
              <input
                style={{ ...inputStyle, width: 200 }}
                value={draft.officePhone || ''}
                onChange={e => setD({ officePhone: e.target.value })} />
            </SettingsRow>
          </>
        )}
      </div>

      {/* Blocked booking times */}
      <div className="card card-lg" style={{ marginBottom: 20 }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>بستن زمان برای رزرو</div>
          <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 4, lineHeight: 1.7 }}>
            یک روز و بازهٔ ساعتی مشخص را ببندید تا در فرم رزرو آنلاین پیشنهاد نشود (مثلاً جلسهٔ تیمی یا مرخصی).
          </div>
        </div>
        <div className="row gap-8" style={{ alignItems: 'flex-end', marginBottom: blocked.length ? 16 : 0, flexWrap: 'wrap' }}>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>تاریخ</label>
            <div className="row gap-4">
              <select style={{ ...inputStyle, width: 60 }} value={blockYear} onChange={e => setBlockYear(+e.target.value)}>
                <option value={1405}>{toFa(1405)}</option>
                <option value={1406}>{toFa(1406)}</option>
                <option value={1407}>{toFa(1407)}</option>
              </select>
              <select style={{ ...inputStyle, width: 88 }} value={blockMonth} onChange={e => { setBlockMonth(+e.target.value); setBlockDay(1); }}>
                {persianMonthNames.map(function(mn, i) { return <option key={i} value={i + 1}>{mn}</option>; })}
              </select>
              <select style={{ ...inputStyle, width: 52 }} value={blockDay} onChange={e => setBlockDay(+e.target.value)}>
                {Array.from({ length: daysInMonth }).map(function(_, i) { return <option key={i} value={i + 1}>{toFa(i + 1)}</option>; })}
              </select>
            </div>
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>روز هفته</label>
            <div className="blocked-dow-display">{dayLabels[blockDow]}</div>
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>از ساعت</label>
            <select value={blockHour} onChange={e => { const h = +e.target.value; setBlockHour(h); if (blockEndHour <= h) setBlockEndHour(h + 1); }}>
              {workHourOptions.map(h => <option key={h} value={h}>{toFa(h)}:۰۰</option>)}
            </select>
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>تا ساعت</label>
            <select value={blockEndHour} onChange={e => setBlockEndHour(+e.target.value)}>
              {workHourOptions.filter(h => h > blockHour).map(h => <option key={h} value={h}>{toFa(h)}:۰۰</option>)}
            </select>
          </div>
          <button className="btn btn-soft" style={{ height: 38 }} onClick={addBlock}>
            <Icon name="plus" size={14} />
            بستن این بازه
          </button>
        </div>
        {blockedPills.length > 0 && (
          <div className="row gap-8" style={{ flexWrap: 'wrap' }}>
            {blockedPills.map((b, i) => (
              <span key={i} className="blocked-pill">
                {dayLabels[b.dow]} {b.date ? `— ${b.date}` : ''} • {toFa(b.hour)}:۰۰{b.endHour ? ` تا ${toFa(b.endHour)}:۰۰` : ''}
                <button onClick={() => setD({ blockedSlots: blocked.filter(x => !((x.dateKey || x.date) === (b.dateKey || b.date) && x.endHour === b.endHour)) })} title="حذف">
                  <Icon name="close" size={11} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Patient tags (برچسب‌ها) management */}
      <div className="card card-lg" style={{ marginBottom: 20 }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>برچسب‌ها</div>
          <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 4, lineHeight: 1.7 }}>
            برچسب‌هایی که هنگام افزودن مراجع می‌توانید انتخاب کنید. می‌توانید برچسب جدید بسازید یا حذف کنید.
          </div>
        </div>
        <div className="row gap-8" style={{ alignItems: 'flex-end', marginBottom: (draft.patientTags || []).length ? 16 : 0 }}>
          <div className="field" style={{ marginBottom: 0, flex: 1 }}>
            <label>برچسب جدید</label>
            <input
              style={{ ...inputStyle, width: '100%' }}
              placeholder="مثلاً اضطراب"
              value={newTag}
              onChange={e => setNewTag(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addTag(); }} />
          </div>
          <button className="btn btn-soft" style={{ height: 38 }} onClick={addTag}>
            <Icon name="plus" size={14} />
            افزودن برچسب
          </button>
        </div>
        {(draft.patientTags || []).length > 0 && (
          <div className="row gap-8" style={{ flexWrap: 'wrap' }}>
            {(draft.patientTags || []).map((t) => (
              <span key={t} className="blocked-pill">
                {t}
                <button onClick={() => setD({ patientTags: (draft.patientTags || []).filter(x => x !== t) })} title="حذف">
                  <Icon name="close" size={11} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="card card-lg">
        <SettingsRow title="نام کلینیک" desc="نامی که در سرتیتر و ایمیل‌ها نمایش داده می‌شود.">
          <input className="settings-input" value={draft.clinicName || ''} onChange={e => setD({ clinicName: e.target.value })} style={inputStyle} />
        </SettingsRow>

        <SettingsRow title="یادآوری جلسات" desc="ارسال یادآوری به مراجعین ۲۴ ساعت قبل از جلسه.">
          <Toggle on={toggles.sessionReminders} onChange={() => flip('sessionReminders')} />
        </SettingsRow>

        <SettingsRow title="گزارش هفتگی" desc="دریافت ایمیل خلاصه عملکرد در پایان هر هفته.">
          <Toggle on={toggles.weeklyReport} onChange={() => flip('weeklyReport')} />
        </SettingsRow>

        <SettingsRow title="پیامک به مراجعین" desc="ارسال پیامک تأیید برای جلسات جدید.">
          <Toggle on={toggles.smsNotif} onChange={() => flip('smsNotif')} />
        </SettingsRow>

        <SettingsRow title="ساعات کاری" desc="بازه پیش‌فرض پذیرش مراجعین در طول روز.">
          <div className="row gap-8" style={{ alignItems: 'center' }}>
            <select style={inputStyle} value={draft.workStart != null ? draft.workStart : 9} onChange={e => setD({ workStart: +e.target.value })}>
              {[7,8,9,10,11,12].map(h => <option key={h} value={h}>{toFa(h)}:۰۰</option>)}
            </select>
            <span style={{ color: 'var(--ink-muted)' }}>تا</span>
            <select style={inputStyle} value={draft.workEnd != null ? draft.workEnd : 18} onChange={e => setD({ workEnd: +e.target.value })}>
              {[14,15,16,17,18,19,20,21,22].map(h => <option key={h} value={h}>{toFa(h)}:۰۰</option>)}
            </select>
          </div>
        </SettingsRow>

        <SettingsRow title="فاصله بین جلسات (بافر)" desc="مدت زمان استراحت خودکار بین هر دو جلسه.">
          <select style={inputStyle} value={draft.sessionBuffer != null ? draft.sessionBuffer : 0} onChange={e => setD({ sessionBuffer: +e.target.value })}>
            <option value={0}>بدون فاصله</option>
            <option value={10}>۱۰ دقیقه</option>
            <option value={15}>۱۵ دقیقه</option>
            <option value={30}>۳۰ دقیقه</option>
          </select>
        </SettingsRow>
      </div>

      {dirty && (
        <div className="settings-savebar">
          <span>تغییرات ذخیره‌نشده دارید.</span>
          <button className="btn btn-primary" onClick={save}>
            <Icon name="check" size={14} />
            ذخیره تغییرات
          </button>
        </div>
      )}
    </div>
  );
};

const inputStyle = {
  background: 'var(--bg)',
  border: '1px solid var(--line)',
  borderRadius: 10,
  padding: '8px 14px',
  fontSize: 13,
  outline: 'none',
  fontFamily: 'inherit',
  color: 'var(--ink)',
  textAlign: 'right',
};

const SettingsRow = ({ title, desc, children }) => (
  <div className="settings-section">
    <div className="settings-label">
      <div className="title">{title}</div>
      <div className="desc">{desc}</div>
    </div>
    <div className="row" style={{ alignItems: 'center' }}>{children}</div>
  </div>
);

const Toggle = ({ on, onChange }) => (
  <div className={`toggle ${on ? 'on' : ''}`} onClick={onChange} role="button"></div>
);

// === Modals ===
const Modal = ({ children, onClose, title, sub }) => {
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="row between" style={{ marginBottom: 8 }}>
          <div>
            <div className="modal-title">{title}</div>
            {sub && <div className="modal-sub">{sub}</div>}
          </div>
          <button className="icon-btn" onClick={onClose}>
            <Icon name="close" size={16} />
          </button>
        </div>
        <div style={{ marginTop: 16 }}>
          {children}
        </div>
      </div>
    </div>
  );
};

const BookSessionModal = ({ onClose, onConfirm, prefill, settings = {} }) => {
  const D = window.CLINIC_DATA;
  const dayLabels = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'];
  const ws = settings.workStart != null ? settings.workStart : 9;
  const we = settings.workEnd   != null ? settings.workEnd   : 18;
  const hours = Array.from({ length: we - ws }, (_, i) => ws + i);
  const defaultHour = prefill?.hour != null ? Math.min(Math.max(prefill.hour, ws), we - 1) : ws;
  const jt = window.JALALI_TODAY;
  const padFa = (n) => toFa(String(n).padStart(2, '0'));
  const todayDateStr = `${toFa(jt.year)}/${padFa(jt.monthIdx + 1)}/${padFa(jt.day)}`;
  const [form, setForm] = React.useState({
    patientId: prefill?.patientId || D.patients[0].id,
    therapistId: 't1',
    mode: 'in-person',
    day: prefill?.day != null ? prefill.day : jt.dow,
    date: todayDateStr,
    time: `${toFa(defaultHour)}:۰۰`,
    duration: 60,
    buffer: settings.sessionBuffer || 0,
    double: false,
    notes: '',
  });

  return (
    <Modal title="رزرو جلسه جدید" sub="اطلاعات جلسه را وارد کنید" onClose={onClose}>
      <div className="field">
        <label>مراجع</label>
        <select value={form.patientId} onChange={e => setForm({ ...form, patientId: e.target.value })}>
          {D.patients.filter(p => p.status === 'active').map(p =>
            <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
          )}
        </select>
      </div>
      <div className="field">
        <label>نوع جلسه</label>
        <div className="row gap-8">
          <button type="button"
            className="btn"
            style={{
              flex: 1, justifyContent: 'center',
              padding: '12px 14px',
              border: form.mode === 'in-person' ? '1px solid var(--ink)' : '1px solid var(--line)',
              background: form.mode === 'in-person' ? 'var(--sky-soft)' : 'var(--bg)',
              color: 'var(--ink)',
            }}
            onClick={() => setForm({ ...form, mode: 'in-person' })}>
            ○ حضوری در کلینیک
          </button>
          <button type="button"
            className="btn"
            style={{
              flex: 1, justifyContent: 'center',
              padding: '12px 14px',
              border: form.mode === 'online' ? '1px solid var(--ink)' : '1px solid var(--line)',
              background: form.mode === 'online' ? 'var(--lavender-soft)' : 'var(--bg)',
              color: 'var(--ink)',
            }}
            onClick={() => setForm({ ...form, mode: 'online' })}>
            ⊙ آنلاین (ویدئویی)
          </button>
        </div>
      </div>
      <div className="field-row">
        <div className="field">
          <label>روز هفته</label>
          <select value={form.day} onChange={e => setForm({ ...form, day: +e.target.value })}>
            {dayLabels.map((lbl, i) => (
              i === 6 ? null : <option key={i} value={i}>{lbl}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>ساعت</label>
          <select value={form.time} onChange={e => setForm({ ...form, time: e.target.value })}>
            {hours.map(h => <option key={h} value={`${toFa(h)}:۰۰`}>{toFa(h)}:۰۰</option>)}
          </select>
        </div>
      </div>
      <div className="field">
        <label>تاریخ</label>
        <input value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
      </div>
      <div className="field">
        <label>مدت جلسه (دقیقه)</label>
        <select value={form.duration} onChange={e => setForm({ ...form, duration: +e.target.value })}>
          <option value={60}>۶۰ دقیقه</option>
          <option value={90}>۹۰ دقیقه</option>
        </select>
      </div>
      <label className="book-double" onClick={() => setForm({ ...form, double: !form.double })}>
        <span className={`book-check ${form.double ? 'on' : ''}`}>{form.double ? <Icon name="check" size={12} /> : null}</span>
        <span>
          <span style={{ fontWeight: 500 }}>دو جلسهٔ پشت‌سرهم برای این مراجع</span>
          <span style={{ display: 'block', fontSize: 11, color: 'var(--ink-muted)', marginTop: 2 }}>دو جلسهٔ متوالی در تقویم ثبت می‌شود.</span>
        </span>
      </label>
      <div className="field">
        <label>یادداشت (اختیاری)</label>
        <textarea placeholder="توضیحات جلسه..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}></textarea>
      </div>

      <div className="modal-actions">
        <button className="btn btn-primary" onClick={() => onConfirm(form)}>
          <Icon name="check" size={14} />
          تأیید رزرو
        </button>
        <button className="btn btn-ghost" onClick={onClose}>انصراف</button>
      </div>
    </Modal>
  );
};

const AddPatientModal = ({ onClose, onConfirm, settings = {} }) => {
  const [form, setForm] = React.useState({
    firstName: '', lastName: '', age: '', phone: '', notes: '', tags: [],
    companionRelation: '', companionName: '', companionPhone: '',
  });
  const valid = form.firstName && form.lastName && form.phone;
  const availableTags = settings.patientTags || [];
  const toggleTag = (t) => setForm(f => ({
    ...f,
    tags: f.tags.includes(t) ? f.tags.filter(x => x !== t) : [...f.tags, t],
  }));

  return (
    <Modal title="افزودن مراجع جدید" sub="اطلاعات اولیه را وارد کنید" onClose={onClose}>
      <div className="field-row">
        <div className="field">
          <label>نام</label>
          <input placeholder="مثلاً مریم" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} />
        </div>
        <div className="field">
          <label>نام خانوادگی</label>
          <input placeholder="مثلاً احمدی" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} />
        </div>
      </div>
      <div className="field-row">
        <div className="field">
          <label>سن</label>
          <input placeholder="۳۲" value={form.age} onChange={e => setForm({ ...form, age: e.target.value })} />
        </div>
        <div className="field">
          <label>شماره تماس</label>
          <input placeholder="۰۹۱۲..." value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
        </div>
      </div>
      <div className="field">
        <label>یادداشت اولیه (اختیاری)</label>
        <textarea placeholder="دلیل مراجعه، نکات مهم..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}></textarea>
      </div>

      {availableTags.length > 0 && (
        <div className="field">
          <label>برچسب‌ها (اختیاری)</label>
          <div className="row gap-8" style={{ flexWrap: 'wrap' }}>
            {availableTags.map(t => (
              <button
                key={t}
                type="button"
                className={`tag-choice ${form.tags.includes(t) ? 'on' : ''}`}
                onClick={() => toggleTag(t)}>
                {form.tags.includes(t) && <Icon name="check" size={11} />}
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ fontSize: 13, fontWeight: 600, margin: '8px 0 4px' }}>اطلاعات همراه (والد / همسر)</div>
      <div style={{ fontSize: 11, color: 'var(--ink-muted)', marginBottom: 12 }}>برای مراجعین زیر ۱۸ سال یا زوج‌درمانی تکمیل کنید (اختیاری).</div>
      <div className="field-row">
        <div className="field">
          <label>نسبت</label>
          <select value={form.companionRelation} onChange={e => setForm({ ...form, companionRelation: e.target.value })}>
            <option value="">انتخاب کنید</option>
            <option value="والد">والد</option>
            <option value="همسر">همسر</option>
            <option value="سرپرست">سرپرست</option>
            <option value="سایر">سایر</option>
          </select>
        </div>
        <div className="field">
          <label>نام همراه</label>
          <input placeholder="مثلاً علی" value={form.companionName} onChange={e => setForm({ ...form, companionName: e.target.value })} />
        </div>
      </div>
      <div className="field">
        <label>شماره تماس همراه</label>
        <input placeholder="۰۹۱۲..." value={form.companionPhone} onChange={e => setForm({ ...form, companionPhone: e.target.value })} />
      </div>

      <div className="modal-actions">
        <button className="btn btn-primary" disabled={!valid} style={{ opacity: valid ? 1 : 0.5 }} onClick={() => valid && onConfirm(form)}>
          <Icon name="plus" size={14} />
          افزودن مراجع
        </button>
        <button className="btn btn-ghost" onClick={onClose}>انصراف</button>
      </div>
    </Modal>
  );
};

const SessionEditModal = ({ event, onClose, onSave, onDelete }) => {
  const D = window.CLINIC_DATA;
  const p = event.patientId ? D.patients.find(x => x.id === event.patientId) : null;
  const name = event.name || (p ? `${p.firstName} ${p.lastName}` : 'مراجع');
  const dayLabels = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'];
  const [form, setForm] = React.useState({
    day: event.day,
    startHour: event.startHour,
    duration: Math.round((event.duration || 1) * 60),
    mode: event.mode || 'in-person',
    buffer: event.buffer || 0,
  });
  const hours = Array.from({ length: (window.CLINIC_DATA.clinicSettings?.workEnd || 18) - (window.CLINIC_DATA.clinicSettings?.workStart || 9) }, (_, i) => (window.CLINIC_DATA.clinicSettings?.workStart || 9) + i);
  const [cancelling, setCancelling] = React.useState(false);
  const [reason, setReason] = React.useState('');
  const [reasonNote, setReasonNote] = React.useState('');
  const reasons = ['درخواست مراجع', 'بیماری مراجع', 'عدم حضور مراجع', 'تغییر برنامه درمانگر', 'تعطیلی / فورس ماژور', 'سایر'];

  if (cancelling) {
    const finalReason = reason === 'سایر' ? (reasonNote.trim() || 'سایر') : (reason + (reasonNote.trim() ? ` — ${reasonNote.trim()}` : ''));
    return (
      <Modal title="لغو جلسه" sub={name} onClose={onClose}>
        <div style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.7, marginBottom: 16 }}>
          دلیل لغو را مشخص کنید. این دلیل در تایم‌لاین پروندهٔ مراجع ثبت می‌شود.
        </div>
        <div className="field">
          <label>دلیل لغو</label>
          <select value={reason} onChange={e => setReason(e.target.value)}>
            <option value="">انتخاب کنید</option>
            {reasons.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div className="field">
          <label>توضیح (اختیاری)</label>
          <textarea placeholder="جزئیات بیشتر..." value={reasonNote} onChange={e => setReasonNote(e.target.value)}></textarea>
        </div>
        <div className="modal-actions">
          <button className="btn btn-primary" disabled={!reason} style={{ opacity: reason ? 1 : 0.5, background: '#8b5050', borderColor: '#8b5050' }} onClick={() => reason && onDelete(event, finalReason)}>
            <Icon name="check" size={14} />
            ثبت لغو
          </button>
          <button className="btn btn-ghost" onClick={() => setCancelling(false)}>بازگشت</button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title="ویرایش جلسه" sub={name} onClose={onClose}>
      <div className="field-row">
        <div className="field">
          <label>روز هفته</label>
          <select value={form.day} onChange={e => setForm({ ...form, day: +e.target.value })}>
            {dayLabels.map((lbl, i) => (i === 6 ? null : <option key={i} value={i}>{lbl}</option>))}
          </select>
        </div>
        <div className="field">
          <label>ساعت شروع</label>
          <select value={form.startHour} onChange={e => setForm({ ...form, startHour: +e.target.value })}>
            {hours.map(h => <option key={h} value={h}>{toFa(h)}:۰۰</option>)}
          </select>
        </div>
      </div>
      <div className="field">
        <label>نوع جلسه</label>
        <div className="row gap-8">
          <button type="button" className="btn"
            style={{ flex: 1, justifyContent: 'center', padding: '12px 14px',
              border: form.mode === 'in-person' ? '1px solid var(--ink)' : '1px solid var(--line)',
              background: form.mode === 'in-person' ? 'var(--sky-soft)' : 'var(--bg)', color: 'var(--ink)' }}
            onClick={() => setForm({ ...form, mode: 'in-person' })}>○ حضوری</button>
          <button type="button" className="btn"
            style={{ flex: 1, justifyContent: 'center', padding: '12px 14px',
              border: form.mode === 'online' ? '1px solid var(--ink)' : '1px solid var(--line)',
              background: form.mode === 'online' ? 'var(--lavender-soft)' : 'var(--bg)', color: 'var(--ink)' }}
            onClick={() => setForm({ ...form, mode: 'online' })}>⊙ آنلاین</button>
        </div>
      </div>
      <div className="field">
        <label>مدت (دقیقه)</label>
        <select value={form.duration} onChange={e => setForm({ ...form, duration: +e.target.value })}>
          <option value={60}>۶۰ دقیقه</option>
          <option value={90}>۹۰ دقیقه</option>
        </select>
      </div>

      <div className="modal-actions">
        <button className="btn btn-primary" onClick={() => onSave({ ...event, day: form.day, startHour: form.startHour, duration: form.duration / 60, mode: form.mode, buffer: 0 })}>
          <Icon name="check" size={14} />
          ذخیره تغییرات
        </button>
        <button className="btn btn-ghost" style={{ color: '#8b5050' }} onClick={() => setCancelling(true)}>
          <Icon name="close" size={14} />
          لغو جلسه
        </button>
      </div>
    </Modal>
  );
};

Object.assign(window, { NotificationsPage, SettingsPage, BookSessionModal, AddPatientModal, SessionEditModal });
