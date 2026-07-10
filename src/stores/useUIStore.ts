import { create } from 'zustand';
import { generateId } from '../utils/id';
import type { Toast, ToastType } from '../types';

interface UIStore {
  // 侧栏
  sidebarOpen: boolean;
  // 详情面板
  detailPanelOpen: boolean;
  // 创建任务弹窗
  createTaskModalOpen: boolean;
  // 设置弹窗
  settingsModalOpen: boolean;
  // Toast 通知列表
  toasts: Toast[];

  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleDetailPanel: () => void;
  setDetailPanelOpen: (open: boolean) => void;
  openCreateTask: () => void;
  closeCreateTask: () => void;
  openSettings: () => void;
  closeSettings: () => void;
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
}

export const useUIStore = create<UIStore>((set, get) => ({
  sidebarOpen: true,
  detailPanelOpen: true,
  createTaskModalOpen: false,
  settingsModalOpen: false,
  toasts: [],

  toggleSidebar: () => set({ sidebarOpen: !get().sidebarOpen }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleDetailPanel: () => set({ detailPanelOpen: !get().detailPanelOpen }),
  setDetailPanelOpen: (open) => set({ detailPanelOpen: open }),

  openCreateTask: () => set({ createTaskModalOpen: true }),
  closeCreateTask: () => set({ createTaskModalOpen: false }),

  openSettings: () => set({ settingsModalOpen: true }),
  closeSettings: () => set({ settingsModalOpen: false }),

  showToast: (message, type = 'info', duration = 3000) => {
    const toast: Toast = {
      id: generateId(),
      message,
      type,
      duration,
    };
    set({ toasts: [...get().toasts, toast] });

    // 自动移除
    setTimeout(() => {
      get().removeToast(toast.id);
    }, duration);
  },

  removeToast: (id) => {
    set({ toasts: get().toasts.filter(t => t.id !== id) });
  },
}));
