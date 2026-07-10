import { create } from 'zustand';
import { formatDate, addDays } from '../utils/time';

interface CalendarStore {
  viewCenterDate: Date;
  displayDays: number;
  scrollTop: number;
  scrollLeft: number;

  setViewCenterDate: (date: Date) => void;
  setDisplayDays: (days: number) => void;
  setScrollPosition: (top: number, left: number) => void;
  goToToday: () => void;
  goForward: (days?: number) => void;
  goBackward: (days?: number) => void;
  panByDelta: (deltaDays: number) => void;

  getViewStartDate: () => string;
  getViewEndDate: () => string;
  getVisibleDates: () => string[];
}

export const useCalendarStore = create<CalendarStore>((set, get) => ({
  viewCenterDate: new Date(),
  displayDays: 7,
  scrollTop: 0,
  scrollLeft: 0,

  setViewCenterDate: (date) => set({ viewCenterDate: date }),
  setDisplayDays: (days) => set({ displayDays: days }),
  setScrollPosition: (top, left) => set({ scrollTop: top, scrollLeft: left }),

  goToToday: () => set({ viewCenterDate: new Date() }),

  goForward: (days) => {
    const d = days || get().displayDays;
    set({ viewCenterDate: addDays(get().viewCenterDate, d) });
  },

  goBackward: (days) => {
    const d = days || get().displayDays;
    set({ viewCenterDate: addDays(get().viewCenterDate, -d) });
  },

  panByDelta: (deltaDays) => {
    set({ viewCenterDate: addDays(get().viewCenterDate, -deltaDays) });
  },

  getViewStartDate: () => {
    const { viewCenterDate, displayDays } = get();
    const halfDays = Math.floor(displayDays / 2);
    return formatDate(addDays(viewCenterDate, -halfDays));
  },

  getViewEndDate: () => {
    const { viewCenterDate, displayDays } = get();
    const halfDays = Math.floor(displayDays / 2);
    return formatDate(addDays(viewCenterDate, displayDays - halfDays - 1));
  },

  getVisibleDates: () => {
    const { viewCenterDate, displayDays } = get();
    const halfDays = Math.floor(displayDays / 2);
    const start = addDays(viewCenterDate, -halfDays);
    const dates: string[] = [];
    for (let i = 0; i < displayDays; i++) {
      dates.push(formatDate(addDays(start, i)));
    }
    return dates;
  },
}));
