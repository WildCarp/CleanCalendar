// ── 时间处理工具 ──

/**
 * 将 "HH:mm" 格式转换为分钟数
 */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/**
 * 将分钟数转换为 "HH:mm" 格式
 */
export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * 解析 ISO 8601 日期字符串为 Date 对象
 */
export function parseDate(dateStr: string): Date {
  return new Date(dateStr);
}

/**
 * 格式化 Date 为 YYYY-MM-DD
 */
export function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * 格式化 Date 为 YYYY-MM-DDTHH:mm
 */
export function formatDateTime(d: Date): string {
  const date = formatDate(d);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${date}T${h}:${m}`;
}

/**
 * 获取 Date 的分钟表示（从当天 00:00 开始）
 */
export function getDayMinutes(d: Date): number {
  return d.getHours() * 60 + d.getMinutes();
}

/**
 * 获取某天是周几（0=周日, 1=周一,...,6=周六）
 */
export function getDayOfWeek(d: Date): number {
  return d.getDay();
}

/**
 * 获取某天的日期字符串 YYYY-MM-DD
 */
export function dateKey(d: Date): string {
  return formatDate(d);
}

/**
 * 在当前日期上加减天数
 */
export function addDays(d: Date, days: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + days);
  return r;
}

/**
 * 在当前日期上加减分钟
 */
export function addMinutes(d: Date, minutes: number): Date {
  const r = new Date(d);
  r.setMinutes(r.getMinutes() + minutes);
  return r;
}

/**
 * 设置 Date 的时间部分（时、分）
 */
export function setTime(d: Date, hours: number, minutes: number): Date {
  const r = new Date(d);
  r.setHours(hours, minutes, 0, 0);
  return r;
}

/**
 * 获取当前日期（不带时间）
 */
export function today(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * 判断两个日期是否是同一天
 */
export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

/**
 * 获取两个日期之间的分钟差
 */
export function diffMinutes(a: Date, b: Date): number {
  return (b.getTime() - a.getTime()) / 60000;
}

/**
 * 获取 ISO 8601 起始时间对应的日期部分 (YYYY-MM-DD)
 */
export function extractDate(isoStr: string): string {
  return isoStr.split('T')[0];
}

/**
 * 生成日期范围内的所有日期 YYYY-MM-DD
 */
export function getDateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  const current = new Date(start);
  while (current <= end) {
    dates.push(formatDate(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

/**
 * 月份名称
 */
export const MONTH_NAMES = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

/**
 * 星期名称（短）
 */
export const WEEKDAY_NAMES = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
