import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(isoWeek);
dayjs.extend(customParseFormat);

/** Parse "HH:mm" to minutes from midnight */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/** Convert minutes from midnight to "HH:mm" */
export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Format date to "YYYY-MM-DD" */
export function formatDate(d: dayjs.Dayjs): string {
  return d.format('YYYY-MM-DD');
}

/** Format datetime to ISO "YYYY-MM-DDTHH:mm" */
export function formatDatetime(d: dayjs.Dayjs): string {
  return d.format('YYYY-MM-DDTHH:mm');
}

/** Parse "YYYY-MM-DDTHH:mm" to dayjs */
export function parseDatetime(s: string): dayjs.Dayjs {
  return dayjs(s, 'YYYY-MM-DDTHH:mm');
}

/** Get the start of a given week (Monday) as dayjs */
export function weekStart(d: dayjs.Dayjs): dayjs.Dayjs {
  return d.startOf('isoWeek');
}

/** Check if a date string is today */
export function isToday(dateStr: string): boolean {
  return dayjs().format('YYYY-MM-DD') === dateStr.substring(0, 10);
}

/** Generate a range of dates [start, end) */
export function dateRange(start: string, end: string): string[] {
  const result: string[] = [];
  let current = dayjs(start);
  const endDate = dayjs(end);
  while (current.isBefore(endDate)) {
    result.push(current.format('YYYY-MM-DD'));
    current = current.add(1, 'day');
  }
  return result;
}

/** Get the ISO week number */
export function weekNumber(d: dayjs.Dayjs): number {
  return d.isoWeek();
}

/** Format for display: "7月10日 周四" */
export function formatDisplayDate(dateStr: string): string {
  const d = dayjs(dateStr);
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return `${d.month() + 1}月${d.date()}日 ${weekdays[d.day()]}`;
}
