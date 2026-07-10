import { db } from './db';
import type { HolidayCache, Holiday } from '../types';

const CACHE_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 天

/**
 * 获取指定年份的节假日数据
 * 优先从 IndexedDB 缓存读取，缓存过期则尝试联网更新
 */
export async function getHolidays(year: number): Promise<HolidayCache | null> {
  // 先从缓存读取
  const cached = await db.holidays.get(year);
  if (cached) {
    const age = Date.now() - cached.updatedAt;
    if (age < CACHE_DURATION) {
      return cached;
    }
  }

  // 尝试联网更新
  const fetched = await fetchHolidaysFromAPI(year);
  if (fetched) {
    const data: HolidayCache = {
      year,
      holidays: fetched,
      updatedAt: Date.now(),
    };
    await db.holidays.put(data);
    return data;
  }

  // 回退到缓存（即使过期）
  if (cached) {
    return cached;
  }

  // 尝试从本地预置文件加载
  const local = await fetchLocalHolidays(year);
  if (local) {
    const data: HolidayCache = {
      year,
      holidays: local,
      updatedAt: Date.now(),
    };
    await db.holidays.put(data);
    return data;
  }

  return null;
}

/**
 * 从远程 API 获取节假日数据
 */
async function fetchHolidaysFromAPI(year: number): Promise<Holiday[] | null> {
  try {
    // 首选 API
    const resp = await fetch(`https://holiday.ailcc.com/api/holiday/year/${year}`, {
      signal: AbortSignal.timeout(5000),
    });
    if (resp.ok) {
      const data = await resp.json();
      return parseHolidayResponse(data, year);
    }
  } catch {
    // 尝试备选 API
  }

  try {
    const resp = await fetch(`https://publicapi.xiaoai.me/holiday/year?date=${year}`, {
      signal: AbortSignal.timeout(5000),
    });
    if (resp.ok) {
      const data = await resp.json();
      return parseHolidayResponse(data, year);
    }
  } catch {
    // 都失败了
  }

  return null;
}

/**
 * 从本地预置文件加载节假日数据
 */
async function fetchLocalHolidays(year: number): Promise<Holiday[] | null> {
  try {
    const resp = await fetch(`/CleanCalendar/holidays/${year}.json`);
    if (resp.ok) {
      const data = await resp.json();
      return parseHolidayResponse(data, year);
    }
  } catch {
    // 无本地文件
  }
  return null;
}

/**
 * 解析节假日 API 响应
 * 适配不同 API 的数据格式
 */
function parseHolidayResponse(data: unknown, year: number): Holiday[] {
  if (!data || typeof data !== 'object') return [];

  const obj = data as Record<string, unknown>;
  const holidays: Holiday[] = [];

  // holiday.ailcc.com 格式：{ "YYYY-MM-DD": { "name": "...", "isOffDay": true } }
  // xiaoai.me 格式：可能不同
  for (const [key, val] of Object.entries(obj)) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(key)) {
      const v = val as Record<string, unknown>;
      if (v && typeof v.isOffDay === 'boolean') {
        holidays.push({
          date: key,
          name: String(v.name || ''),
          isOffDay: v.isOffDay,
        });
      }
    }
  }

  // 如果解析结果为空，可能是数组格式
  if (holidays.length === 0 && Array.isArray(data)) {
    for (const item of data as Array<Record<string, unknown>>) {
      if (item.date && typeof item.isOffDay === 'boolean') {
        holidays.push({
          date: String(item.date),
          name: String(item.name || ''),
          isOffDay: item.isOffDay,
        });
      }
    }
  }

  return holidays;
}

/**
 * 判断指定日期是否为工作日
 */
export function isWorkday(date: string, holidayCache: HolidayCache | null): boolean {
  if (!holidayCache) {
    // 无数据时：周一至周五为工作日
    const d = new Date(date);
    const dow = d.getDay();
    return dow !== 0 && dow !== 6;
  }

  const holiday = holidayCache.holidays.find(h => h.date === date);
  if (holiday) {
    return !holiday.isOffDay; // isOffDay=true 表示休息日
  }

  const d = new Date(date);
  const dow = d.getDay();
  return dow !== 0 && dow !== 6;
}

/**
 * 预加载节假日数据
 */
export async function preloadHolidays(year: number): Promise<HolidayCache | null> {
  return getHolidays(year);
}
