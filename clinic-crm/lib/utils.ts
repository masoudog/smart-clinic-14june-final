// Utility functions

export const toFa = (num: number | string): string => {
  if (typeof num === 'number') {
    num = num.toString();
  }
  const faNumbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return num.replace(/\d/g, (d) => faNumbers[parseInt(d)]);
};

export const toEn = (faNum: string): string => {
  const faNumbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  let result = faNum;
  faNumbers.forEach((fa, i) => {
    result = result.replace(new RegExp(fa, 'g'), i.toString());
  });
  return result;
};

export const dayNames = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'];
export const monthNames = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
];

export const getJalaliDate = (date: Date = new Date()): { year: number; month: number; day: number } => {
  const jd = Math.floor(date.getTime() / 86400000) + 2400001;
  let l = jd + 68569;
  const n = Math.floor(4 * l / 146097);
  l = l - Math.floor(146097 * n / 4);
  const i = Math.floor(4000 * (l + 1) / 1461001);
  l = l - Math.floor(1461 * i / 4) + 31;
  const j = Math.floor(80 * l / 2447);
  const day = l - Math.floor(2447 * j / 80);
  l = Math.floor(j / 11);
  const month = j + 2 - 12 * l;
  const year = 100 * (n - 49) + i + l;
  return { year, month, day };
};

export const formatJalaliDate = (date: Date = new Date()): string => {
  const { year, month, day } = getJalaliDate(date);
  return `${toFa(year)}/${toFa(String(month).padStart(2, '0'))}/${toFa(String(day).padStart(2, '0'))}`;
};

export const getWeekDayLabel = (dayOfWeek: number): string => {
  return dayNames[dayOfWeek];
};

export const getDateFromDayOfWeek = (dow: number, week: number = 0): Date => {
  const today = new Date();
  const current = today.getDay();
  const offset = (dow - current + 7) % 7 + week * 7;
  const date = new Date(today);
  date.setDate(date.getDate() + offset);
  return date;
};

export const computeSlots = (
  events: any[],
  blockedSlots: any[] = [],
  settings: any = {},
  week: number = 0
): any[] => {
  const slots: any[] = [];
  const workingDays = settings.workingDays || [1, 2, 3, 4, 5]; // Sunday-Thursday
  const startHour = settings.workingHours?.start || 9;
  const endHour = settings.workingHours?.end || 18;

  for (const dow of workingDays) {
    const date = getDateFromDayOfWeek(dow, week);
    const dateKey = formatJalaliDate(date);

    for (let hour = startHour; hour < endHour; hour++) {
      const isBlocked = blockedSlots.some(
        (bs: any) => bs.dateKey === dateKey && bs.startHour <= hour && hour < bs.endHour
      );

      const hasEvent = events.some(
        (e: any) => e.day === dow && e.startHour === hour
      );

      if (!isBlocked && !hasEvent) {
        slots.push({
          dow,
          hour,
          dateLabel: dateKey,
          timeLabel: `${toFa(hour)}:۰۰`,
        });
      }
    }
  }

  return slots;
};

export const generatePatientColor = (): 'sky' | 'sage' | 'beige' | 'lavender' | 'rose' => {
  const colors = ['sky', 'sage', 'beige', 'lavender', 'rose'] as const;
  return colors[Math.floor(Math.random() * colors.length)];
};

export const getPascalCase = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const cn = (...classes: (string | boolean | undefined)[]): string => {
  return classes.filter(Boolean).join(' ');
};
