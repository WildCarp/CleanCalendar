// ============================================================
// CleanCalendar — UI 状态 Store
// ============================================================

import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  detailPanelOpen: boolean;
  selectedTaskId: string | null;
  settingsOpen: boolean;
  createTaskOpen: boolean;

  toggleSidebar: () => void;
  openDetail: (taskId: string) => void;
  closeDetail: () => void;
  toggleSettings: () => void;
  toggleCreateTask: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  detailPanelOpen: false,
  selectedTaskId: null,
  settingsOpen: false,
  createTaskOpen: false,

  toggleSidebar: () => set(s => ({ sidebarOpen: !s.sidebarOpen })),
  openDetail: (taskId) => set({ detailPanelOpen: true, selectedTaskId: taskId }),
  closeDetail: () => set({ detailPanelOpen: false, selectedTaskId: null }),
  toggleSettings: () => set(s => ({ settingsOpen: !s.settingsOpen })),
  toggleCreateTask: () => set(s => ({ createTaskOpen: !s.createTaskOpen })),
}));
