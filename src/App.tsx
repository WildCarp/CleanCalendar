import React, { useEffect } from 'react';
import { TopBar } from './components/layout/TopBar';
import { Sidebar } from './components/layout/Sidebar';
import { DetailPanel } from './components/layout/DetailPanel';
import { ScheduleGrid } from './components/calendar/ScheduleGrid';
import { CreateTaskForm } from './components/task/CreateTaskForm';
import { SettingsModal } from './components/settings/SettingsModal';
import { ToastContainer } from './components/ui/Toast';
import { useTagGroupStore } from './stores/useTagGroupStore';
import { useTaskStore } from './stores/useTaskStore';
import { useSettingsStore } from './stores/useSettingsStore';
import { useCalendarStore } from './stores/useCalendarStore';
import { useUIStore } from './stores/useUIStore';
import { initHolidayCache } from './utils/holidayStore';
import { useSchedule } from './hooks/useSchedule';

const App: React.FC = () => {
  const loadTagGroups = useTagGroupStore(s => s.load);
  const loadTasks = useTaskStore(s => s.load);
  const loadSettings = useSettingsStore(s => s.load);
  const loadingSettings = useSettingsStore(s => s.loading);
  const loadingTasks = useTaskStore(s => s.loading);
  const setDisplayDays = useCalendarStore(s => s.setDisplayDays);
  const settings = useSettingsStore(s => s.settings);
  const showToast = useUIStore(s => s.showToast);
  const { scheduleAll } = useSchedule();

  const isInitializing = loadingSettings || loadingTasks;

  // 初始化：加载所有数据
  useEffect(() => {
    const init = async () => {
      try {
        await loadSettings();
        await loadTagGroups();
        await loadTasks();
        setDisplayDays(settings.displayDays);

        // 预加载当年和明年的节假日到内存缓存
        const data = await initHolidayCache();
        if (data) {
          showToast('✅ 节假日数据已更新', 'success');
        } else {
          showToast('⚠️ 使用本地节假日缓存', 'warning');
        }
      } catch (err) {
        console.error('[App] 初始化失败:', err);
        showToast('⚠️ 数据加载出错，请刷新页面重试', 'error');
      }
    };
    init();
  }, []);

  // 同步 displayDays
  useEffect(() => {
    setDisplayDays(settings.displayDays);
  }, [settings.displayDays, setDisplayDays]);

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+N 新建任务
      if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        useUIStore.getState().openCreateTask();
      }
      // Ctrl+[ 切换侧栏
      if (e.ctrlKey && e.key === '[') {
        e.preventDefault();
        useUIStore.getState().toggleSidebar();
      }
      // Ctrl+] 切换详情面板
      if (e.ctrlKey && e.key === ']') {
        e.preventDefault();
        useUIStore.getState().toggleDetailPanel();
      }
      // Ctrl+Enter 智能排程
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        scheduleAll();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [scheduleAll]);

  return (
    <div className="h-full flex flex-col">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <ScheduleGrid />
        <DetailPanel />
      </div>

      {/* 弹窗 */}
      <CreateTaskForm />
      <SettingsModal />

      {/* Toast 通知 */}
      <ToastContainer />

      {/* 初始化加载状态 */}
      {isInitializing && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-cc-canvas/80">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-cc-accent border-t-transparent rounded-full animate-spin" />
            <span className="text-body text-cc-text-secondary">正在加载数据...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
