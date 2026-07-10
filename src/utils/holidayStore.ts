import type { HolidayCache } from '../types';
import { getHolidays } from './holidays';

/**
 * 全局节假日内存缓存
 * 应用启动时加载，供调度器快速访问
 */
let _holidayCache: Record<number, HolidayCache> = {};

export async function initHolidayCache(): Promise<HolidayCache | null> {
  const year = new Date().getFullYear();
  const data = await getHolidays(year);
  if (data) {
    _holidayCache[year] = data;
  }
  // 尝试加载明年
  await getHolidays(year + 1).then(d => {
    if (d) _holidayCache[year + 1] = d;
  });
  return data;
}

export function getHolidayCache(year: number): HolidayCache | null {
  return _holidayCache[year] || null;
}

export function getCurrentHolidayCache(): HolidayCache | null {
  const year = new Date().getFullYear();
  return _holidayCache[year] || null;
}
