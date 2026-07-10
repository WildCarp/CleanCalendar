import React from 'react';
import { Button } from '../ui/Button';
import { useUIStore } from '../../stores/useUIStore';
import { useCalendarStore } from '../../stores/useCalendarStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useSchedule } from '../../hooks/useSchedule';

export const TopBar: React.FC = () => {
  const toggleSidebar = useUIStore(s => s.toggleSidebar);
  const openSettings = useUIStore(s => s.openSettings);
  const goToToday = useCalendarStore(s => s.goToToday);
  const goBackward = useCalendarStore(s => s.goBackward);
  const goForward = useCalendarStore(s => s.goForward);
  const toggleDarkMode = useSettingsStore(s => s.toggleDarkMode);
  const darkMode = useSettingsStore(s => s.settings.darkMode);
  const { scheduleAll } = useSchedule();
  const showToast = useUIStore(s => s.showToast);

  const handleScheduleAll = async () => {
    showToast('🔄 正在智能排程...', 'info');
    await scheduleAll();
  };

  return (
    <div className="h-topbar bg-cc-panel border-b border-cc-border-subtle flex items-center px-4 gap-3 z-[90] relative flex-shrink-0">
      <Button variant="icon" onClick={toggleSidebar} title="切换侧栏">
        ☰
      </Button>
      <span className="text-h3 text-cc-text-primary">CleanCalendar</span>
      <div className="flex-1" />
      <Button variant="icon" onClick={() => goBackward()} title="上一个周期">
        ◂
      </Button>
      <Button variant="ghost" onClick={goToToday}>
        📅 今天
      </Button>
      <Button variant="icon" onClick={() => goForward()} title="下一个周期">
        ▸
      </Button>
      <div className="w-[1px] h-[18px] bg-cc-border-default mx-1" />
      <Button variant="success" onClick={handleScheduleAll}>
        🧠 智能排程
      </Button>
      <Button variant="icon" onClick={toggleDarkMode} title="切换主题">
        {darkMode ? '☀' : '◐'}
      </Button>
      <Button variant="icon" onClick={openSettings} title="设置">
        ⚙
      </Button>
    </div>
  );
};
