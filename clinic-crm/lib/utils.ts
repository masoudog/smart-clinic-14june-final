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

export const getWeekDayLabel = (dayOfWeek: number): string => {
  return dayNames[dayOfWeek];
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
