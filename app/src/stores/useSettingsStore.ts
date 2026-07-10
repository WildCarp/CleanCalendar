// ============================================================
// CleanCalendar — 设置 Store
// ============================================================

import { create } from 'zustand';
import type { Settings } from '../types';
import { DEFAULT_SETTINGS } from '../types';
import { getSettings, saveSetting } from '../utils/db';

interface SettingsState {
  settings: Settings;
  loaded: boolean;

  load: () => Promise<void>;
  update: <K extends keyof Settings>(key: K, value: Settings[K]) => Promise<void>;
  updateBatch: (partial: Partial<Settings>) => Promise<void>;
  reset: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: { ...DEFAULT_SETTINGS },
  loaded: false,

  load: async () => {
    try {
      const stored = await getSettings();
      if (Object.keys(stored).length > 0) {
        set({
          settings: { ...DEFAULT_SETTINGS, ...(stored as Partial<Settings>) },
          loaded: true,
        });
      } else {
        set({ loaded: true });
      }
    } catch {
      set({ loaded: true });
    }
  },

  update: async (key, value) => {
    set(state => ({
      settings: { ...state.settings, [key]: value },
    }));
    await saveSetting(key, value);
  },

  updateBatch: async (partial) => {
    set(state => ({
      settings: { ...state.settings, ...partial },
    }));
    for (const [key, value] of Object.entries(partial)) {
      await saveSetting(key, value);
    }
  },

  reset: async () => {
    set({ settings: { ...DEFAULT_SETTINGS } });
  },
}));
