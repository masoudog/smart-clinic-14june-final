'use client';

import React, { useState, useMemo } from 'react';

const FA = '۰۱۲۳۴۵۶۷۸۹';
const toFa = (n: number | string) => String(n).replace(/[0-9]/g, (d) => FA[parseInt(d)]);
const MONTHS = ['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];
const MONTH_LEN = [31,31,31,31,31,31,30,30,30,30,30,29];
const DAY_LABELS = ['شنبه','یکشنبه','دوشنبه','سه‌شنبه','چهارشنبه','پنج‌شنبه','جمعه'];
const DAY_INITIALS = ['ش','ی','د','س','چ','پ','ج'];

const SERVICES = [
  { id: 'adult',   label: 'روانشناسی بزرگسال',       icon: '🧠', tint: '#3A404A' },
  { id: 'child',   label: 'روانشناسی کودک و نوجوان', icon: '👥', tint: '#3A404A' },
  { id: 'anxiety', label: 'اختلالات اضطرابی',         icon: '⚡', tint: '#8951E0' },
  { id: 'sleep',   label: 'اختلالات خواب',            icon: '🌙', tint: '#E06161' },
];

const STEPS = [
  { id: 'service', label: 'خدمت' },
  { id: 'date',    label: 'تاریخ' },
  { id: 'time',    label: 'ساعت' },
  { id: 'info',    label: 'اطلاعات' },
];

function getJalaliToday() {
  const now = new Date();
  const jd = Math.floor(now.getTime() / 86400000) + 2440588;
  let l = jd + 68569;
  const n = Math.floor(4 * l / 146097);
  l = l - Math.floor((146097 * n + 3) / 4);
  const i = Math.floor(4000 * (l + 1) / 1461001);
  l = l - Math.floor(1461 * i / 4) + 31;
  const j = Math.floor(80 * l / 2447);
  const gDay = l - Math.floor(2447 * j / 80);
  l = Math.floor(j / 11);
  const gMonth = j + 2 - 12 * l;
  const gYear = 100 * (n - 49) + i + l;
  // Convert Gregorian to Jalali
  const gy = gYear - 1600; const gm = gMonth - 1; const gd = gDay - 1;
  let gDayNo = 365 * gy + Math.floor((gy + 3) / 4) - Math.floor((gy + 99) / 100) + Math.floor((gy + 399) / 400);
  const gm2 = [0,31,59,90,120,151,181,212,243,273,304,334];
  gDayNo += gm2[gm] + gd;
  if (gm > 1 && ((gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0)) gDayNo++;
  let jDayNo = gDayNo - 79;
  const jNp = Math.floor(jDayNo / 12053);
  jDayNo %= 12053;
  let jy = 979 + 33 * jNp + 4 * Math.floor(jDayNo / 1461);
  jDayNo %= 1461;
  if (jDayNo >= 366) { jy += Math.floor((jDayNo - 1) / 365); jDayNo = (jDayNo - 1) % 365; }
  let jm = 0;
  const jml = [31,31,31,31,31,31,30,30,30,30,30,29];
  for (let i2 = 0; i2 < 11; i2++) { if (jDayNo >= jml[i2]) { jDayNo -= jml[i2]; jm++; } else break; }
  const dow = (now.getDay() + 1) % 7; // 0=Saturday
  return { year: jy, monthIdx: jm, day: jDayNo + 1, dow };
}

function monthGrid(year: number, monthIdx: number, today: any) {
  let day1Dow: number;
  if (year === today.year && monthIdx === today.monthIdx) {
    day1Dow = ((today.dow - (today.day - 1)) % 7 + 7) % 7;
  } else {
    let dow = ((today.dow - (today.day - 1)) % 7 + 7) % 7;
    let y = today.year, m = today.monthIdx;
    while (!(y === year && m === monthIdx)) {
      dow = (dow + MONTH_LEN[m]) % 7;
      m++; if (m > 11) { m = 0; y++; }
    }
    day1Dow = dow;
  }
  const len = MONTH_LEN[monthIdx];
  const cells: (number | null)[] = [];
  for (let i = 0; i < day1Dow; i++) cells.push(null);
  for (let d = 1; d <= len; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

function buildAvailability(today: any) {
  const ws = 9, we = 18;
  const allHours = Array.from({ length: we - ws }, (_, i) => ws + i);
  const days = [];
  const byKey: Record<string, any> = {};
  for (let off = 0; off <= 21 && days.length < 21; off++) {
    let y = today.year, m = today.monthIdx, d = today.day;
    let remaining = off;
    while (remaining > 0) {
      d++; remaining--;
      if (d > MONTH_LEN[m]) { d = 1; m++; if (m > 11) { m = 0; y++; } }
    }
    const dow = (today.dow + off) % 7;
    if (dow === 6) continue; // Friday closed
    const key = `${y}-${m}-${d}`;
    const free = allHours.filter((h) => h !== 12 && (off !== 0 || h > new Date().getHours()));
    if (!free.length) continue;
    const dateLabel = off === 0
      ? `امروز — ${toFa(d)} ${MONTHS[m]}`
      : `${DAY_LABELS[dow]}، ${toFa(d)} ${MONTHS[m]}`;
    const rec = {
      off, dow, day: d, monthIdx: m, year: y,
      dateLabel,
      shortLabel: `${DAY_LABELS[dow]} ${toFa(d)} ${MONTHS[m]}`,
      hours: allHours.map((h) => ({ hour: h, label: `${toFa(h)}:۰۰`, blocked: !free.includes(h) })),
    };
    byKey[key] = rec;
    days.push(rec);
  }
  return { days, byKey };
}

interface BookingWizardProps {
  embed?: boolean;
  initialService?: string | null;
  onClose?: () => void;
  onSubmit?: (payload: any) => void;
}

export default function BookingWizard({ embed = false, initialService = null, onClose, onSubmit }: BookingWizardProps) {
  const today = useMemo(() => getJalaliToday(), []);
  const avail = useMemo(() => buildAvailability(today), [today]);
  const firstDay = avail.days[0];

  const [step, setStep] = useState(initialService ? 'date' : 'service');
  const [service, setService] = useState<string | null>(initialService);
  const [viewYear, setViewYear] = useState(firstDay ? firstDay.year : today.year);
  const [viewMonth, setViewMonth] = useState(firstDay ? firstDay.monthIdx : today.monthIdx);
  const [dateKey, setDateKey] = useState<string | null>(null);
  const [hour, setHour] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const stepIndex = STEPS.findIndex((s) => s.id === step);
  const dayRec = dateKey ? avail.byKey[dateKey] : null;
  const serviceObj = SERVICES.find((s) => s.id === service);

  const canNext = step === 'service' ? !!service : step === 'date' ? !!dateKey : step === 'time' ? hour != null : name.trim().length > 0 && phone.trim().length > 0;

  const next = () => {
    if (!canNext) return;
    if (step === 'service') setStep('date');
    else if (step === 'date') setStep('time');
    else if (step === 'time') setStep('info');
    else if (step === 'info') {
      onSubmit?.({ kind: 'booking', name: name.trim(), phone: phone.trim(), slot: { dateLabel: dayRec?.dateLabel, timeLabel: `${toFa(hour!)}:۰۰`, dow: dayRec?.dow, hour }, mode: 'in-person', reason: serviceObj?.label || '' });
      setStep('done');
    }
  };
  const prev = () => {
    if (step === 'date') setStep('service');
    else if (step === 'time') setStep('date');
    else if (step === 'info') setStep('time');
  };

  const monthsWithSlots = useMemo(() => new Set(avail.days.map((d) => `${d.year}-${d.monthIdx}`)), [avail]);
  const stepMonth = (dir: number) => {
    let y = viewYear, m = viewMonth + dir;
    if (m > 11) { m = 0; y++; } else if (m < 0) { m = 11; y--; }
    setViewYear(y); setViewMonth(m);
  };
  const canPrevMonth = (() => { let y = viewYear, m = viewMonth - 1; if (m < 0) { m = 11; y--; } return monthsWithSlots.has(`${y}-${m}`); })();
  const canNextMonth = (() => { let y = viewYear, m = viewMonth + 1; if (m > 11) { m = 0; y++; } return monthsWithSlots.has(`${y}-${m}`); })();

  const CheckIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7"/></svg>;
  const ArrowLeft = ({ size = 16 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>;
  const ChevLeft = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>;
  const ChevRight = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>;
  const CloseIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;

  const StepDot = ({ state }: { state: string }) => {
    if (state === 'done') return <span className="bw-dot bw-done"><CheckIcon /></span>;
    if (state === 'active') return <span className="bw-dot bw-active"><i></i></span>;
    return <span className="bw-dot bw-empty"></span>;
  };

  const card = (
    <div className={`bw-card ${step === 'done' ? 'done' : ''} ${embed ? 'embed' : ''}`} role="dialog">
      {!embed && (
        <button className="bw-close" onClick={onClose} aria-label="بستن"><CloseIcon /></button>
      )}

      <div className="bw-head">
        <h2>رزرو آنلاین نوبت</h2>
        <p>اولین قدم به سوی سلامت روان</p>
      </div>

      {step !== 'done' && (
        <div className="bw-stepper">
          {STEPS.map((s, i) => {
            const state = i < stepIndex ? 'done' : i === stepIndex ? 'active' : 'empty';
            return (
              <React.Fragment key={s.id}>
                {i > 0 && <span className={`bw-line ${i <= stepIndex ? 'fill' : ''}`}></span>}
                <div className="bw-step">
                  <StepDot state={state} />
                  <span className={`bw-step-label ${state !== 'empty' ? 'on' : ''}`}>{s.label}</span>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      )}

      {/* SERVICE */}
      {step === 'service' && (
        <div className="bw-body">
          <div className="bw-prompt">چه خدمتی نیاز دارید؟</div>
          <div className="bw-services">
            {SERVICES.map((s) => (
              <button key={s.id} className={`bw-service ${service === s.id ? 'sel' : ''}`} onClick={() => setService(s.id)}>
                <span className="bw-ico" style={{ color: s.tint }}>{s.icon}</span>
                <span className="bw-service-label">{s.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* DATE */}
      {step === 'date' && (
        <div className="bw-body">
          <div className="bw-prompt">تاریخ مراجعه را انتخاب کنید</div>
          <div className="bw-cal">
            <div className="bw-cal-head">
              <button className="bw-cal-nav" disabled={!canNextMonth} onClick={() => stepMonth(1)} aria-label="ماه بعد"><ChevLeft /></button>
              <span className="bw-cal-title">{MONTHS[viewMonth]} {toFa(viewYear)}</span>
              <button className="bw-cal-nav" disabled={!canPrevMonth} onClick={() => stepMonth(-1)} aria-label="ماه قبل"><ChevRight /></button>
            </div>
            <div className="bw-cal-grid bw-cal-dow">
              {DAY_INITIALS.map((d, i) => <span key={i} className="bw-cal-wd">{d}</span>)}
            </div>
            {monthGrid(viewYear, viewMonth, today).map((week, wi) => (
              <div className="bw-cal-grid" key={wi}>
                {week.map((d, di) => {
                  if (d == null) return <span key={di} className="bw-cal-cell bw-cell-empty"></span>;
                  const key = `${viewYear}-${viewMonth}-${d}`;
                  const open = !!avail.byKey[key];
                  const sel = dateKey === key;
                  return (
                    <button key={di} className={`bw-cal-cell ${open ? 'open' : 'closed'} ${sel ? 'sel' : ''}`} disabled={!open} onClick={() => { setDateKey(key); setHour(null); }}>
                      {toFa(d)}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TIME */}
      {step === 'time' && (
        <div className="bw-body">
          <div className="bw-prompt">ساعت مراجعه را انتخاب کنید</div>
          <div className="bw-subprompt">ساعت‌های آزاد — {dayRec ? dayRec.shortLabel : ''}</div>
          <div className="bw-times">
            {dayRec && dayRec.hours.map((h: any) => (
              <button key={h.hour} className={`bw-time ${hour === h.hour ? 'sel' : ''} ${h.blocked ? 'blocked' : ''}`} disabled={h.blocked} onClick={() => !h.blocked && setHour(h.hour)}>
                {h.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* INFO */}
      {step === 'info' && (
        <div className="bw-body">
          <div className="bw-prompt">اطلاعات تماس خود را وارد کنید</div>
          <div className="bw-fields">
            <div className="bw-field">
              <label>نام و نام خانوادگی</label>
              <input autoFocus placeholder="مثال: حسین ملکی" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="bw-field">
              <label>شماره تماس</label>
              <input inputMode="tel" placeholder="مثال: ۰۹۱۴۱۲۳۴۵۶۷" value={phone} onChange={(e) => setPhone(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && next()} />
            </div>
          </div>
        </div>
      )}

      {/* DONE */}
      {step === 'done' && (
        <div className="bw-body bw-done">
          <div className="bw-check">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7"/></svg>
          </div>
          <div className="bw-done-title">نوبت شما ثبت شد!</div>
          <div className="bw-done-sub">به زودی با شما تماس می‌گیریم</div>
          <div className="bw-summary">
            <div className="bw-sum-row">
              <span className="bw-sum-key">خدمت</span>
              <span className="bw-sum-val">{serviceObj?.label}</span>
            </div>
            <div className="bw-sum-row">
              <span className="bw-sum-key">روز</span>
              <span className="bw-sum-val">{dayRec?.shortLabel}</span>
            </div>
            <div className="bw-sum-row">
              <span className="bw-sum-key">ساعت</span>
              <span className="bw-sum-val">{toFa(hour!)}:۰۰</span>
            </div>
            <div className="bw-sum-row">
              <span className="bw-sum-key">به نام</span>
              <span className="bw-sum-val">{name}</span>
            </div>
          </div>
          <button className="bw-btn primary full" onClick={() => { setStep('service'); setService(null); setDateKey(null); setHour(null); setName(''); setPhone(''); }}>رزرو نوبت جدید</button>
        </div>
      )}

      {step !== 'done' && (
        <div className="bw-actions">
          <button className={`bw-btn primary ${stepIndex > 0 ? '' : 'full'} ${canNext ? '' : 'disabled'}`} onClick={next}>
            <ArrowLeft size={20} />
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
}
