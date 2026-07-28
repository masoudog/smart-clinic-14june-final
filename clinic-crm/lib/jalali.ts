// Phase 5.0 — Jalali (Hijri-Shamsi) calendar math for the Existing Patient
// date/time picker. Adapted from the equivalent inline logic already in
// components/BookingWizard.tsx (untouched — frozen per the migration plan
// until the whole new booking flow is verified end-to-end). Duplicated here
// rather than imported from it; reconciling the duplication is Phase 6 scope
// ("retire the duplicate Jalali math").

import { toFa } from './utils';

export const MONTHS = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند',
];
const MONTH_LEN = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29];
export const DAY_INITIALS = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];
export const DAY_LABELS = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'];
const FRIDAY_DOW = 6;
const WORK_HOURS = [13, 14, 15, 16, 17];

export interface JalaliDate {
  year: number;
  monthIdx: number;
  day: number;
  dow: number; // 0 = Saturday .. 6 = Friday
}

export function getJalaliToday(): JalaliDate {
  const now = new Date();
  const jd = Math.floor(now.getTime() / 86400000) + 2440588;
  let l = jd + 68569;
  const n = Math.floor((4 * l) / 146097);
  l = l - Math.floor((146097 * n + 3) / 4);
  const i = Math.floor((4000 * (l + 1)) / 1461001);
  l = l - Math.floor((1461 * i) / 4) + 31;
  const j = Math.floor((80 * l) / 2447);
  const gDay = l - Math.floor((2447 * j) / 80);
  l = Math.floor(j / 11);
  const gMonth = j + 2 - 12 * l;
  const gYear = 100 * (n - 49) + i + l;

  const gy = gYear - 1600;
  const gm = gMonth - 1;
  const gd = gDay - 1;
  let gDayNo = 365 * gy + Math.floor((gy + 3) / 4) - Math.floor((gy + 99) / 100) + Math.floor((gy + 399) / 400);
  const gm2 = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  gDayNo += gm2[gm] + gd;
  if (gm > 1 && ((gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0)) gDayNo++;

  let jDayNo = gDayNo - 79;
  const jNp = Math.floor(jDayNo / 12053);
  jDayNo %= 12053;
  let jy = 979 + 33 * jNp + 4 * Math.floor(jDayNo / 1461);
  jDayNo %= 1461;
  if (jDayNo >= 366) {
    jy += Math.floor((jDayNo - 1) / 365);
    jDayNo = (jDayNo - 1) % 365;
  }
  let jm = 0;
  for (let idx = 0; idx < 11; idx++) {
    if (jDayNo >= MONTH_LEN[idx]) {
      jDayNo -= MONTH_LEN[idx];
      jm++;
    } else break;
  }
  const dow = (now.getDay() + 1) % 7; // 0 = Saturday
  return { year: jy, monthIdx: jm, day: jDayNo + 1, dow };
}

export function monthGrid(year: number, monthIdx: number, today: JalaliDate): (number | null)[][] {
  let day1Dow: number;
  if (year === today.year && monthIdx === today.monthIdx) {
    day1Dow = (((today.dow - (today.day - 1)) % 7) + 7) % 7;
  } else {
    let dow = (((today.dow - (today.day - 1)) % 7) + 7) % 7;
    let y = today.year;
    let m = today.monthIdx;
    while (!(y === year && m === monthIdx)) {
      dow = (dow + MONTH_LEN[m]) % 7;
      m++;
      if (m > 11) {
        m = 0;
        y++;
      }
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

export function dayOfWeekFor(year: number, monthIdx: number, day: number, today: JalaliDate): number {
  const weeks = monthGrid(year, monthIdx, today);
  for (const week of weeks) {
    const idx = week.indexOf(day);
    if (idx !== -1) return idx;
  }
  return 0;
}

// A day is bookable if it's strictly in the future (today itself is not
// bookable) and isn't a Friday (clinic's weekly closed day) — a simple,
// deterministic mock rule; real availability isn't sourced from anywhere
// (per §5, mock data only).
export function isDayAvailable(year: number, monthIdx: number, day: number, today: JalaliDate): boolean {
  const dow = dayOfWeekFor(year, monthIdx, day, today);
  if (dow === FRIDAY_DOW) return false;
  if (year !== today.year) return year > today.year;
  if (monthIdx !== today.monthIdx) return monthIdx > today.monthIdx;
  return day > today.day;
}

export function availableHoursFor(): number[] {
  return WORK_HOURS;
}

export function dateKeyFor(year: number, monthIdx: number, day: number): string {
  return `${year}-${monthIdx}-${day}`;
}

// Inverse of dateKeyFor — shared by every place that needs to read a stored
// date key back apart (previously duplicated inline in several call sites).
export function parseDateKey(key: string): [year: number, monthIdx: number, day: number] {
  const [year, monthIdx, day] = key.split('-').map(Number);
  return [year, monthIdx, day];
}

export function shortDateLabel(year: number, monthIdx: number, day: number, today: JalaliDate): string {
  const dow = dayOfWeekFor(year, monthIdx, day, today);
  return `${DAY_LABELS[dow]} ${toFa(day)} ${MONTHS[monthIdx]}`;
}

// Phase 5.1 — Jalali → Gregorian conversion for the Abroad flow's dual
// calendar display. Rather than implementing a full Jalali leap-year
// algorithm (this file's existing MONTH_LEN already simplifies Esfand to a
// constant 29 days, ignoring Jalali leap years — a pre-existing
// approximation, not something introduced here), this counts the number of
// this-app's-own Jalali days between the target date and today, then
// applies that exact day delta to the real `Date` object for today. Since a
// day is the same physical unit in both calendars, this lands on an
// accurate real Gregorian date for whatever day this app is internally
// calling "Jalali day N" — real Gregorian leap years are handled correctly
// because the arithmetic is delegated to the native `Date`, not
// hand-rolled.
function jalaliDayIndex(year: number, monthIdx: number, day: number): number {
  let index = year * 365;
  for (let m = 0; m < monthIdx; m++) index += MONTH_LEN[m];
  return index + day;
}

export interface GregorianDate {
  year: number;
  month: number; // 1-12
  day: number;
}

export function toGregorian(year: number, monthIdx: number, day: number, today: JalaliDate): GregorianDate {
  const deltaDays = jalaliDayIndex(year, monthIdx, day) - jalaliDayIndex(today.year, today.monthIdx, today.day);
  const g = new Date();
  g.setDate(g.getDate() + deltaDays);
  return { year: g.getFullYear(), month: g.getMonth() + 1, day: g.getDate() };
}

// English-numeral "M/D", matching the reference screenshot's day-cell
// sub-label exactly (no leading zeros, no year).
export function gregorianShortLabel(g: GregorianDate): string {
  return `${g.month}/${g.day}`;
}

// Full Jalali label with the Gregorian equivalent appended — used by the
// Abroad checkout/terminal screens, which show both calendars; the Iran
// flow's `shortDateLabel` above is intentionally left untouched.
export function fullDateLabelWithGregorian(
  year: number,
  monthIdx: number,
  day: number,
  today: JalaliDate,
): string {
  const dow = dayOfWeekFor(year, monthIdx, day, today);
  const g = toGregorian(year, monthIdx, day, today);
  return `${DAY_LABELS[dow]} ${toFa(day)} ${MONTHS[monthIdx]} ${toFa(year)} - ${g.month}/${g.day}/${g.year}`;
}
