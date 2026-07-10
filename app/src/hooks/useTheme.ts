import { useEffect } from 'react';
import { useSettingsStore } from '../stores/useSettingsStore';

/** 管理暗色/亮色主题切换 */
export function useTheme() {
  const darkMode = useSettingsStore(s => s.settings.darkMode);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [darkMode]);

  return { darkMode, toggle: () => useSettingsStore.getState().update('darkMode', !darkMode) };
}
