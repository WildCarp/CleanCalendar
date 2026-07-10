// ============================================================
// CleanCalendar — 节假日数据管理
// ============================================================

import type { HolidayData, HolidayCache } from '../types';
import { getHolidayCache, saveHolidayCache } from './db';

const HOLIDAY_API = 'https://holiday.ailcc.com/api/holiday/year';

/**
 * 获取指定年份的节假日数据
 * 优先级：IndexedDB 缓存 > 静态 JSON > API 请求 > 默认规则
 */
export async function fetchHolidays(year: number): Promise<HolidayData | null> {
  // 1. 尝试 IndexedDB 缓存
  try {
    const cached = await getHolidayCache(year);
    if (cached) {
      const age = Date.now() - cached.updatedAt;
      if (age < 30 * 24 * 60 * 60 * 1000) {
        return cached.data;
      }
    }
  } catch {
    // Dexie 未就绪
  }

  // 2. 尝试静态 JSON（预置于 public/holidays/）
  try {
    const staticData = await fetchStaticHolidayData(year);
    if (staticData) return staticData;
  } catch {
    // 静态文件不存在
  }

  // 3. 尝试 API 请求
  try {
    const apiData = await fetchApiHolidayData(year);
    if (apiData) {
      // 更新缓存
      try {
        const cache: HolidayCache = {
          year,
          data: apiData,
          updatedAt: Date.now(),
        };
        await saveHolidayCache(cache);
      } catch {
        // 缓存失败不影响使用
      }
      return apiData;
    }
  } catch {
    // API 不可达
  }

  // 4. fallback：尝试过期的 IndexedDB 缓存
  try {
    const stale = await getHolidayCache(year);
    if (stale) return stale.data;
  } catch {
    // 无数据
  }

  return null;
}

async function fetchStaticHolidayData(year: number): Promise<HolidayData | null> {
  try {
    const res = await fetch(`/CleanCalendar/holidays/${year}.json`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function fetchApiHolidayData(year: number): Promise<HolidayData | null> {
  // 开发环境走 Vite proxy
  const url = import.meta.env.DEV
    ? `/api/holiday/year/${year}`
    : `${HOLIDAY_API}/${year}`;

  const res = await fetch(url);
  if (!res.ok) return null;
  return await res.json();
}
