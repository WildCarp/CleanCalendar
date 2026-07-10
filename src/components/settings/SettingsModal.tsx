import React, { useRef } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Toggle } from '../ui/Toggle';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useUIStore } from '../../stores/useUIStore';
import { exportData, importData } from '../../utils/export';

export const SettingsModal: React.FC = () => {
  const open = useUIStore(s => s.settingsModalOpen);
  const closeSettings = useUIStore(s => s.closeSettings);
  const settings = useSettingsStore(s => s.settings);
  const updateSettings = useSettingsStore(s => s.update);
  const resetSettings = useSettingsStore(s => s.reset);
  const showToast = useUIStore(s => s.showToast);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    try {
      await exportData();
      showToast('✅ 数据已导出为 JSON 文件', 'success');
    } catch {
      showToast('❌ 导出失败', 'error');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { tagGroupCount, taskCount } = await importData(file);
      showToast(`✅ 已导入 ${tagGroupCount} 个标签组，${taskCount} 个任务`, 'success');
      // 刷新数据
      window.location.reload();
    } catch {
      showToast('❌ 无效的备份文件格式', 'error');
    }

    // 重置 input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleReset = async () => {
    if (confirm('确定要重置所有设置吗？这将恢复默认值。')) {
      await resetSettings();
      showToast('✅ 设置已重置', 'info');
    }
  };

  if (!open) return null;

  return (
    <Modal open={open} onClose={closeSettings} title="设置" width="520px">
      <div className="flex flex-col gap-5 max-h-[70vh] overflow-y-auto">
        {/* 工作时间 */}
        <div>
          <h3 className="text-h3 text-cc-text-primary mb-3">工作时间</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-caption text-cc-text-tertiary mb-1 block">上班时间</label>
              <input
                type="time"
                className="w-full px-[10px] py-[6px] text-body bg-cc-surface text-cc-text-primary border border-cc-border-default rounded-cc-lg outline-none focus:border-cc-border-accent"
                value={settings.workStartTime}
                onChange={e => updateSettings({ workStartTime: e.target.value })}
              />
            </div>
            <div>
              <label className="text-caption text-cc-text-tertiary mb-1 block">下班时间</label>
              <input
                type="time"
                className="w-full px-[10px] py-[6px] text-body bg-cc-surface text-cc-text-primary border border-cc-border-default rounded-cc-lg outline-none focus:border-cc-border-accent"
                value={settings.workEndTime}
                onChange={e => updateSettings({ workEndTime: e.target.value })}
              />
            </div>
            <div>
              <label className="text-caption text-cc-text-tertiary mb-1 block">午休开始</label>
              <input
                type="time"
                className="w-full px-[10px] py-[6px] text-body bg-cc-surface text-cc-text-primary border border-cc-border-default rounded-cc-lg outline-none focus:border-cc-border-accent"
                value={settings.lunchStart}
                onChange={e => updateSettings({ lunchStart: e.target.value })}
              />
            </div>
            <div>
              <label className="text-caption text-cc-text-tertiary mb-1 block">午休结束</label>
              <input
                type="time"
                className="w-full px-[10px] py-[6px] text-body bg-cc-surface text-cc-text-primary border border-cc-border-default rounded-cc-lg outline-none focus:border-cc-border-accent"
                value={settings.lunchEnd}
                onChange={e => updateSettings({ lunchEnd: e.target.value })}
              />
            </div>
            <div>
              <label className="text-caption text-cc-text-tertiary mb-1 block">晚饭开始</label>
              <input
                type="time"
                className="w-full px-[10px] py-[6px] text-body bg-cc-surface text-cc-text-primary border border-cc-border-default rounded-cc-lg outline-none focus:border-cc-border-accent"
                value={settings.dinnerStart}
                onChange={e => updateSettings({ dinnerStart: e.target.value })}
              />
            </div>
            <div>
              <label className="text-caption text-cc-text-tertiary mb-1 block">晚饭结束</label>
              <input
                type="time"
                className="w-full px-[10px] py-[6px] text-body bg-cc-surface text-cc-text-primary border border-cc-border-default rounded-cc-lg outline-none focus:border-cc-border-accent"
                value={settings.dinnerEnd}
                onChange={e => updateSettings({ dinnerEnd: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="h-[1px] bg-cc-border-subtle" />

        {/* 休息时间 */}
        <div>
          <h3 className="text-h3 text-cc-text-primary mb-3">休息时间</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-caption text-cc-text-tertiary mb-1 block">休息开始</label>
              <input
                type="time"
                className="w-full px-[10px] py-[6px] text-body bg-cc-surface text-cc-text-primary border border-cc-border-default rounded-cc-lg outline-none focus:border-cc-border-accent"
                value={settings.restStart}
                onChange={e => updateSettings({ restStart: e.target.value })}
              />
            </div>
            <div>
              <label className="text-caption text-cc-text-tertiary mb-1 block">休息结束</label>
              <input
                type="time"
                className="w-full px-[10px] py-[6px] text-body bg-cc-surface text-cc-text-primary border border-cc-border-default rounded-cc-lg outline-none focus:border-cc-border-accent"
                value={settings.restEnd}
                onChange={e => updateSettings({ restEnd: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="h-[1px] bg-cc-border-subtle" />

        {/* 显示选项 */}
        <div>
          <h3 className="text-h3 text-cc-text-primary mb-3">显示选项</h3>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-caption text-cc-text-tertiary">暗色模式</span>
              <Toggle
                checked={settings.darkMode}
                onChange={v => updateSettings({ darkMode: v })}
              />
            </div>
          </div>
        </div>

        <div className="h-[1px] bg-cc-border-subtle" />

        {/* 算法参数 */}
        <div>
          <h3 className="text-h3 text-cc-text-primary mb-3">排程算法</h3>
          <div>
            <label className="text-caption text-cc-text-tertiary mb-1 block">
              紧急/重要权重比：{settings.urgencyImportanceRatio.toFixed(2)}
              <span className="ml-1 text-cc-text-disabled">
                ({(1 - settings.urgencyImportanceRatio).toFixed(2)} : {settings.urgencyImportanceRatio.toFixed(2)})
              </span>
            </label>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              className="w-full"
              value={settings.urgencyImportanceRatio}
              onChange={e => updateSettings({ urgencyImportanceRatio: parseFloat(e.target.value) })}
            />
          </div>
        </div>

        <div className="h-[1px] bg-cc-border-subtle" />

        {/* 数据管理 */}
        <div>
          <h3 className="text-h3 text-cc-text-primary mb-3">数据管理</h3>
          <div className="flex gap-2">
            <Button variant="success" onClick={handleExport}>
              📥 导出数据
            </Button>
            <Button variant="ghost" onClick={() => fileInputRef.current?.click()}>
              📤 导入数据
            </Button>
            <Button variant="danger" onClick={handleReset}>
              🔄 重置设置
            </Button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImport}
          />
        </div>
      </div>
    </Modal>
  );
};
