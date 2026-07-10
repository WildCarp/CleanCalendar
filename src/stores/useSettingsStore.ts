import { create } from 'zustand';
import { db } from '../utils/db';
import { DEFAULT_SETTINGS, type Settings } from '../types';

interface SettingsStore {
  settings: Settings;
  loading: boolean;

  load: () => Promise<void>;
  update: (data: Partial<Settings>) => Promise<void>;
  reset: () => Promise<void>;
  toggleDarkMode: () => Promise<void>;
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: { ...DEFAULT_SETTINGS },
  loading: true,

  load: async () => {
    try {
      const entries = await db.settings.toArray();
      const stored: Partial<Settings> = {};
      for (const entry of entries) {
        (stored as Record<string, unknown>)[entry.key] = entry.value;
      }

      // 合并默认值和存储值
      const merged = { ...DEFAULT_SETTINGS, ...stored };
      set({ settings: merged, loading: false });

      // 应用暗色模式
      if (merged.darkMode) {
        document.documentElement.classList.add('dark');
      }
    } catch {
      set({ settings: { ...DEFAULT_SETTINGS }, loading: false });
    }
  },

  update: async (data) => {
    const current = get().settings;
    const updated = { ...current, ...data };
    set({ settings: updated });

    // 持久化每个变更的 key
    for (const [key, value] of Object.entries(data)) {
      await db.settings.put({ key, value });
    }

    // 处理暗色模式切换
    if ('darkMode' in data) {
      if (data.darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  },

  reset: async () => {
    await db.settings.clear();
    set({ settings: { ...DEFAULT_SETTINGS } });
    document.documentElement.classList.remove('dark');
  },

  toggleDarkMode: async () => {
    const current = get().settings.darkMode;
    await get().update({ darkMode: !current });
  },
}));
