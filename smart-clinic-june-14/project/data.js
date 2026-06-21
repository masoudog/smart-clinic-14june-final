// Mock data for clinic CRM

// === Live Jalali (Persian) "today" — single source of truth ===
// Everything date-related (calendar, hero, booking slots) reads from this so
// the app always reflects the real current date instead of a frozen day.
window.getJalaliToday = function (d) {
  d = d || new Date();
  const parts = new Intl.DateTimeFormat('en-US-u-ca-persian-nu-latn', {
    year: 'numeric', month: 'numeric', day: 'numeric',
  }).formatToParts(d);
  const get = (t) => parseInt(parts.find((p) => p.type === t).value, 10);
  // App weekday order is 0 = Saturday … 6 = Friday. JS getDay(): 0 = Sunday.
  const dow = (d.getDay() + 1) % 7;
  return { year: get('year'), monthIdx: get('month') - 1, day: get('day'), dow };
};
// Jalali parts for a date N whole days from real today.
window.jalaliFromOffset = function (offsetDays) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + (offsetDays || 0));
  return window.getJalaliToday(d);
};
window.JALALI_TODAY = window.getJalaliToday();

// Canonical date key (e.g. "1405-03-08") for matching date-specific data like
// blocked booking slots. monthIdx is 0-based.
window.jKey = function (year, monthIdx, day) {
  return year + '-' + String(monthIdx + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0');
};

// Back-fill a date key on blocked slots created before keys existed, by
// parsing their Persian label (e.g. "۸ خرداد ۱۴۰۵") — so old blocks become
// date-specific instead of repeating every week.
window.blockKeyFromLabel = function (label) {
  const months = ['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];
  const faToInt = (s) => parseInt(String(s).replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)), 10);
  const parts = String(label || '').trim().split(/\s+/);
  if (parts.length < 3) return null;
  const day = faToInt(parts[0]);
  const mIdx = months.indexOf(parts[1]);
  const year = faToInt(parts[2]);
  if (!day || mIdx < 0 || !year) return null;
  return window.jKey(year, mIdx, day);
};
window.migrateBlocked = function (slots) {
  return (slots || []).map((b) => b.dateKey ? b : { ...b, dateKey: window.blockKeyFromLabel(b.date) || undefined });
};

window.CLINIC_DATA = {
  therapists: [
    { id: 't1', name: 'دکتر اسماعیل‌زاده', role: 'روانشناس بالینی', color: 'sky', online: true, initials: 'از' },
  ],

  patients: [
    { id: 'p1', firstName: 'مریم',  lastName: 'احمدی',    age: 32, phone: '۰۹۱۲۳۴۵۶۷۸۹', status: 'active',   color: 'sky',      lastSession: '۱۴۰۵/۰۲/۱۰', sessions: 12, tags: ['اضطراب', 'استرس کاری'] },
    { id: 'p2', firstName: 'رضا',   lastName: 'کریمی',    age: 28, phone: '۰۹۱۲۹۸۷۶۵۴۳', status: 'active',   color: 'sage',     lastSession: '۱۴۰۵/۰۲/۰۸', sessions: 6,  tags: ['افسردگی'] },
    { id: 'p3', firstName: 'سارا',  lastName: 'محمدی',    age: 41, phone: '۰۹۱۳۴۴۴۲۲۱۱', status: 'active',   color: 'beige',    lastSession: '۱۴۰۵/۰۲/۱۲', sessions: 24, tags: ['زوج‌درمانی'] },
    { id: 'p4', firstName: 'علی',   lastName: 'رضوی',     age: 35, phone: '۰۹۱۲۱۱۱۲۲۳۳', status: 'active',   color: 'lavender', lastSession: '۱۴۰۵/۰۲/۰۵', sessions: 9,  tags: ['اضطراب', 'بی‌خوابی'] },
    { id: 'p5', firstName: 'نیلوفر', lastName: 'شایان',    age: 26, phone: '۰۹۳۶۷۷۷۸۸۹۹', status: 'active',   color: 'rose',     lastSession: '۱۴۰۵/۰۲/۱۱', sessions: 3,  tags: ['استرس'] },
    { id: 'p6', firstName: 'حسین',  lastName: 'نوری',     age: 47, phone: '۰۹۱۲۵۵۵۴۴۳۳', status: 'inactive', color: 'sky',      lastSession: '۱۴۰۴/۱۲/۰۲', sessions: 18, tags: ['افسردگی'] },
    { id: 'p7', firstName: 'مهدی',  lastName: 'فرهادی',   age: 30, phone: '۰۹۱۲۳۳۳۲۲۱۱', status: 'active',   color: 'sage',     lastSession: '۱۴۰۵/۰۲/۰۹', sessions: 5,  tags: ['وسواس'] },
    { id: 'p8', firstName: 'فاطمه', lastName: 'صادقی',    age: 38, phone: '۰۹۱۲۸۸۸۷۷۶۶', status: 'active',   color: 'beige',    lastSession: '۱۴۰۵/۰۲/۰۷', sessions: 15, tags: ['زوج‌درمانی', 'خانواده'] },
    { id: 'p9', firstName: 'بهنام', lastName: 'یزدانی',    age: 29, phone: '۰۹۳۹۲۲۲۱۱۰۰', status: 'inactive', color: 'lavender', lastSession: '۱۴۰۴/۱۱/۱۸', sessions: 4,  tags: ['اضطراب اجتماعی'] },
  ],

  // Booking requests — from public site (online) or entered by the office (admin).
  // status: 'pending' (awaiting admin review) | 'scheduled' (accepted → on calendar)
  bookingRequests: [
    { id: 'br1', firstName: 'سپیده', lastName: 'افشار',  phone: '۰۹۱۲۸۸۸۲۲۱۱', dateLabel: 'پنج‌شنبه، ۱۷ اردیبهشت', time: '۱۰:۰۰', dow: 5, hour: 10, mode: 'in-person', reason: 'احساس فرسودگی و بی‌انگیزگی در کار',                 submittedAt: '۲ ساعت پیش',   isReturning: false, source: 'online', color: 'sage',     status: 'pending' },
    { id: 'br2', firstName: 'کیان',  lastName: 'بهرامی', phone: '۰۹۳۸۱۱۱۹۹۸۸', dateLabel: 'شنبه، ۱۹ اردیبهشت',    time: '۱۴:۰۰', dow: 0, hour: 14, mode: 'online',    reason: 'حملات اضطرابی شبانه',                              submittedAt: '۵ ساعت پیش',   isReturning: false, source: 'online', color: 'lavender', status: 'pending' },
    { id: 'br3', firstName: 'لیلا',  lastName: 'طاهری',  phone: '۰۹۱۰۵۵۵۴۴۳۳', dateLabel: 'یکشنبه، ۲۰ اردیبهشت',  time: '۱۶:۰۰', dow: 1, hour: 16, mode: 'online',    reason: 'پیگیری جلسات قبلی',                                 submittedAt: 'دیروز',         isReturning: true,  source: 'admin',  color: 'rose',     status: 'pending' },
  ],

  // Clinic-level settings persisted via localStorage at runtime
  clinicSettings: {
    onlineBookingEnabled: true,
    closedMessage: 'در حال حاضر رزرو آنلاین از وب‌سایت بسته است.<br/>لطفاً برای هماهنگی با دفتر تماس بگیرید.',
    officePhone: '۰۲۱‍۰۰ ۰۰ ۰۰۰۰',
    clinicName: 'کلینیک روان درمانی پوریا',
    hoursFrom: '۰۹:۰۰',
    hoursTo: '۱۸:۰۰',
    workStart: 9,
    workEnd: 18,
    sessionBuffer: 0,
    // Blocked booking slots — admin can ban a specific day+hour from online booking.
    // Each: { dow: 0-6 (0=Sat), hour: 9-17, label: '…' }
    blockedSlots: [],
    // Managed list of patient tags (برچسب‌ها) — editable in Settings, offered in the
    // add-patient form. Seeded from the common labels already in use.
    patientTags: ['اضطراب', 'افسردگی', 'استرس', 'استرس کاری', 'بی‌خوابی', 'وسواس', 'زوج‌درمانی', 'خانواده', 'اضطراب اجتماعی'],
  },

  // Cancellation log — populated at runtime when a session is deleted with a reason.
  // Each: { id, patientId, name, date, time, reason }
  cancellations: [],

  // Today's sessions
  todaySessions: [
    { id: 's1', time: '۰۹:۰۰', duration: 60, patientId: 'p1', therapistId: 't1', status: 'upcoming', mode: 'in-person', notes: 'پیگیری از جلسه قبل' },
    { id: 's2', time: '۱۰:۳۰', duration: 45, patientId: 'p3', therapistId: 't1', status: 'upcoming', mode: 'online',    notes: '' },
    { id: 's3', time: '۱۲:۰۰', duration: 60, patientId: 'p4', therapistId: 't1', status: 'upcoming', mode: 'in-person', notes: 'جلسه اول' },
    { id: 's4', time: '۱۵:۰۰', duration: 60, patientId: 'p5', therapistId: 't1', status: 'upcoming', mode: 'online',    notes: '' },
    { id: 's5', time: '۱۶:۳۰', duration: 45, patientId: 'p7', therapistId: 't1', status: 'upcoming', mode: 'in-person', notes: '' },
  ],

  // Calendar events - keyed by day index (0=Saturday) and time slot
  calendarEvents: [
    // Saturday
    { id: 'e1', day: 0, startHour: 9,  duration: 1,    patientId: 'p1', therapistId: 't1', mode: 'in-person' },
    { id: 'e2', day: 0, startHour: 11, duration: 1,    patientId: 'p2', therapistId: 't1', mode: 'online' },
    { id: 'e3', day: 0, startHour: 14, duration: 1.5,  patientId: 'p3', therapistId: 't1', mode: 'in-person' },
    // Sunday
    { id: 'e4', day: 1, startHour: 10, duration: 1,    patientId: 'p4', therapistId: 't1', mode: 'online' },
    { id: 'e5', day: 1, startHour: 13, duration: 1,    patientId: 'p5', therapistId: 't1', mode: 'in-person' },
    { id: 'e6', day: 1, startHour: 16, duration: 1,    patientId: 'p7', therapistId: 't1', mode: 'online' },
    // Monday
    { id: 'e7', day: 2, startHour: 9,  duration: 1.5,  patientId: 'p8', therapistId: 't1', mode: 'in-person' },
    { id: 'e8', day: 2, startHour: 12, duration: 1,    patientId: 'p1', therapistId: 't1', mode: 'online' },
    { id: 'e9', day: 2, startHour: 15, duration: 1,    patientId: 'p4', therapistId: 't1', mode: 'in-person' },
    // Tuesday
    { id: 'e10', day: 3, startHour: 10, duration: 1,    patientId: 'p3', therapistId: 't1', mode: 'online' },
    { id: 'e11', day: 3, startHour: 14, duration: 1,    patientId: 'p5', therapistId: 't1', mode: 'in-person' },
    // Wednesday
    { id: 'e12', day: 4, startHour: 9,  duration: 1,    patientId: 'p2', therapistId: 't1', mode: 'in-person' },
    { id: 'e13', day: 4, startHour: 11, duration: 1.5,  patientId: 'p7', therapistId: 't1', mode: 'online' },
    { id: 'e14', day: 4, startHour: 15, duration: 1,    patientId: 'p8', therapistId: 't1', mode: 'in-person' },
    // Thursday
    { id: 'e15', day: 5, startHour: 10, duration: 1,    patientId: 'p1', therapistId: 't1', mode: 'online' },
    { id: 'e16', day: 5, startHour: 13, duration: 1,    patientId: 'p4', therapistId: 't1', mode: 'in-person' },
  ],

  // Sample session timeline for patient profile
  sessionHistory: [
    { id: 'sh1', date: '۱۴۰۵/۰۲/۱۰', time: '۰۹:۰۰', therapistId: 't1', summary: 'کاهش اضطراب در محیط کار. تمرین تنفس داده شد.', tags: ['اضطراب', 'پیشرفت'] },
    { id: 'sh2', date: '۱۴۰۵/۰۲/۰۳', time: '۰۹:۰۰', therapistId: 't1', summary: 'بحث درباره روابط خانوادگی و الگوهای ارتباطی.', tags: ['خانواده'] },
    { id: 'sh3', date: '۱۴۰۵/۰۱/۲۷', time: '۱۰:۰۰', therapistId: 't1', summary: 'شروع تکنیک‌های CBT برای مدیریت افکار منفی.', tags: ['CBT', 'اضطراب'] },
    { id: 'sh4', date: '۱۴۰۵/۰۱/۲۰', time: '۰۹:۰۰', therapistId: 't1', summary: 'ارزیابی اولیه و تعیین هدف درمانی.', tags: ['ارزیابی'] },
  ],

  notifications: [
    { id: 'n1', type: 'reminder',  time: '۲ دقیقه پیش', title: 'یادآوری جلسه', body: 'جلسه با مریم احمدی در ساعت ۰۹:۰۰', read: false },
    { id: 'n2', type: 'booking',   time: '۱ ساعت پیش',  title: 'جلسه آنلاین',     body: 'علی رضوی — درخواست جلسه آنلاین', read: false },
    { id: 'n3', type: 'booking',   time: '۳ ساعت پیش',  title: 'رزرو جدید',      body: 'جلسه جدید برای فردا ساعت ۱۴:۰۰',  read: false },
    { id: 'n5', type: 'reminder',  time: 'دیروز',       title: 'یادآوری جلسه', body: 'نیلوفر شایان — فردا ساعت ۱۵:۰۰', read: true },
    { id: 'n6', type: 'booking',   time: '۲ روز پیش',   title: 'لغو جلسه',       body: 'حسین نوری جلسه دوشنبه را لغو کرد', read: true },
  ],

  weekDays: ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'],
  get todayDayIndex() { return window.JALALI_TODAY.dow; },
};

// === Availability engine ===
// Suggest open appointment slots for the public booking form by reading the
// live calendar events. Today is Mon 14 Ordibehesht 1405 (dow=2). Working
// hours 09–17, Friday (dow 6) closed, lunch 12–13 skipped. Returns one open
// slot per upcoming day so suggestions spread across the coming days.
window.computeSlots = function (events, blocked, settings) {
  const ws = (settings && settings.workStart != null) ? settings.workStart : 9;
  const we = (settings && settings.workEnd   != null) ? settings.workEnd   : 18;
  const buf = (settings && settings.sessionBuffer) ? Math.ceil(settings.sessionBuffer / 60) : 0;
  const dayLabels = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'];
  const persianMonths = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
  const monthLengths = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29];
  const toFa = (n) => String(n).replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
  const isBlocked = (dateKey, dow, hour) => (blocked || []).some(b => (b.dateKey ? b.dateKey === dateKey : b.dow === dow) && b.hour === hour);
  const workHours = Array.from({ length: we - ws }, (_, i) => ws + i).filter(h => h !== 12);
  // Rolling 2-week booking window. "Today" (offset 0) and the remainder of the
  // current week are tagged 'this'; everything from next Saturday on is 'next'.
  const todayDow = window.JALALI_TODAY.dow;        // 0 = Saturday
  const daysLeftThisWeek = 6 - todayDow;           // offsets up to here stay in this week
  const nowHour = new Date().getHours();           // live: hide times already passed today
  const out = [];
  for (let off = 0; off <= 14 && out.length < 30; off++) {
    const j = window.jalaliFromOffset(off);
    const dow = j.dow;
    if (dow === 6) continue; // Friday: clinic closed
    const isToday = off === 0;
    const day = j.day, mIdx = j.monthIdx;
    const dateKey = window.jKey(j.year, j.monthIdx, j.day);
    const taken = (events || []).filter(e => e.day === dow).map(e => e.startHour);
    let freeHours = workHours.filter(h => !taken.includes(h) && !isBlocked(dateKey, dow, h));
    // Honor the configured between-session buffer: a slot needs the buffer gap
    // clear of the preceding session too (hourly grid → buf rounds to whole hours).
    if (buf > 0) freeHours = freeHours.filter(h => !taken.includes(h - buf) && !isBlocked(dateKey, dow, h - buf));
    if (isToday) freeHours = freeHours.filter(h => h > nowHour); // only times still ahead today
    if (!freeHours.length) continue;
    // Today: offer the next few open times. Other days: one slot each, to spread.
    const picks = isToday ? freeHours.slice(0, 3) : [freeHours[0]];
    for (const freeHour of picks) {
      const canDouble = !taken.includes(freeHour + 1) && !isBlocked(dateKey, dow, freeHour + 1) && (freeHour + 1) !== 12 && (freeHour + 1) < we;
      out.push({
        id: `slot-${off}-${freeHour}`,
        off, dow, hour: freeHour, day, monthName: persianMonths[mIdx],
        isToday,
        week: off <= daysLeftThisWeek ? 'this' : 'next',
        dayLabel: dayLabels[dow],
        timeLabel: `${toFa(freeHour)}:۰۰`,
        dateLabel: isToday ? `امروز — ${toFa(day)} ${persianMonths[mIdx]}` : `${dayLabels[dow]}، ${toFa(day)} ${persianMonths[mIdx]}`,
        canDouble,
      });
    }
  }
  return out;
};
