// ============================================================
// CleanCalendar — 日历视图 Store
// ============================================================

import { create } from 'zustand';
import dayjs from 'dayjs';
import { formatDate } from '../utils/time';

interface CalendarState {
  currentDate: string;          // "YYYY-MM-DD" — 当前视图中心日期
  viewStart: string;
  viewEnd: string;

  setCurrentDate: (date: string) => void;
  goToday: () => void;
  goNext: () => void;
  goPrev: () => void;
  updateViewRange: (displayDays: number) => void;
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
  currentDate: formatDate(dayjs()),
  viewStart: formatDate(dayjs()),
  viewEnd: formatDate(dayjs().add(6, 'day')),

  setCurrentDate: (date) => {
    set({ currentDate: date });
    get().updateViewRange(7);
  },

  goToday: () => {
    const today = formatDate(dayjs());
    set({ currentDate: today });
    get().updateViewRange(7);
  },

  goNext: () => {
    const next = dayjs(get().currentDate).add(7, 'day');
    set({ currentDate: formatDate(next) });
    get().updateViewRange(7);
  },

  goPrev: () => {
    const prev = dayjs(get().currentDate).subtract(7, 'day');
    set({ currentDate: formatDate(prev) });
    get().updateViewRange(7);
  },

  updateViewRange: (displayDays) => {
    const start = dayjs(get().currentDate);
    set({
      viewStart: formatDate(start),
      viewEnd: formatDate(start.add(displayDays - 1, 'day')),
    });
  },
}));
