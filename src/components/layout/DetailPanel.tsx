import React from 'react';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { DatePicker } from '../ui/DatePicker';
import { DotRating } from '../ui/DotRating';
import { Toggle } from '../ui/Toggle';
import { useTaskStore } from '../../stores/useTaskStore';
import { useTagGroupStore } from '../../stores/useTagGroupStore';
import { useUIStore } from '../../stores/useUIStore';
import { useSchedule } from '../../hooks/useSchedule';

export const DetailPanel: React.FC = () => {
  const tasks = useTaskStore(s => s.tasks);
  const selectedTaskId = useTaskStore(s => s.selectedTaskId);
  const selectTask = useTaskStore(s => s.select);
  const updateTask = useTaskStore(s => s.update);
  const removeTask = useTaskStore(s => s.remove);
  const tagGroups = useTagGroupStore(s => s.tagGroups);
  const detailPanelOpen = useUIStore(s => s.detailPanelOpen);
  const showToast = useUIStore(s => s.showToast);
  const { rescheduleOne } = useSchedule();

  const task = tasks.find(t => t.id === selectedTaskId);
  const tagGroup = tagGroups.find(g => g.id === task?.tagGroupId);

  if (!task) {
    return (
      <div
        className={`w-detail min-w-detail bg-cc-panel border-l border-cc-border-default flex flex-col flex-shrink-0
          transition-all duration-[220ms] ${detailPanelOpen ? '' : 'mr-[-280px] opacity-0 pointer-events-none'}`}
      >
        <div className="flex items-center justify-center h-full text-cc-text-tertiary text-body">
          选择任务查看详情
        </div>
      </div>
    );
  }

  const handleDelete = async () => {
    await removeTask(task.id);
    showToast(`🗑️ 已删除「${task.name}」`, 'info');
  };

  const handleReschedule = async () => {
    showToast('🔄 正在重新安排...', 'info');
    await rescheduleOne(task.id);
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes} 分钟`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}.${Math.round(m / 60 * 10)} 小时` : `${h} 小时`;
  };

  const tagGroupOptions = [
    { value: '', label: '无标签组' },
    ...tagGroups.map(g => ({ value: g.id, label: `${g.emoji} ${g.name}`, color: g.color })),
  ];

  const activeSegments = task.segments.filter(s => !s.isCompleted);
  const completedSegments = task.segments.filter(s => s.isCompleted);

  return (
    <div
      className={`w-detail min-w-detail bg-cc-panel border-l border-cc-border-default flex flex-col overflow-y-auto flex-shrink-0
        transition-all duration-[220ms] ${detailPanelOpen ? '' : 'mr-[-280px] opacity-0 pointer-events-none'}`}
    >
      {/* Header */}
      <div className="px-4 py-4 border-b border-cc-border-subtle">
        <h2 className="text-h2 text-cc-text-primary mb-1">{task.name}</h2>
        <p className="text-caption text-cc-text-tertiary">
          {tagGroup ? `${tagGroup.emoji} ${tagGroup.name}` : '无标签组'} · {formatDuration(task.duration)}
        </p>
      </div>

      {/* Body */}
      <div className="px-4 py-4 flex flex-col gap-4">
        {/* 标签组选择 */}
        <div>
          <label className="text-caption-em text-cc-text-tertiary tracking-[0.02em] mb-[6px] block">标签组</label>
          <Select
            options={tagGroupOptions}
            value={task.tagGroupId}
            onChange={v => updateTask(task.id, { tagGroupId: v })}
            showColorDot
          />
        </div>

        {/* 名称 */}
        <div>
          <label className="text-caption-em text-cc-text-tertiary tracking-[0.02em] mb-[6px] block">名称</label>
          <input
            className="w-full px-[10px] py-[6px] text-body bg-cc-surface text-cc-text-primary border border-cc-border-default rounded-cc-lg outline-none transition-colors duration-120 focus:border-cc-border-accent focus:shadow-[0_0_0_3px_var(--accent-subtle)]"
            value={task.name}
            onChange={e => updateTask(task.id, { name: e.target.value })}
          />
        </div>

        {/* 时间范围 */}
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-caption-em text-cc-text-tertiary tracking-[0.02em] mb-[6px] block">开始时间</label>
            <DatePicker
              value={task.startTime}
              onChange={v => updateTask(task.id, { startTime: v })}
            />
          </div>
          <div className="flex-1">
            <label className="text-caption-em text-cc-text-tertiary tracking-[0.02em] mb-[6px] block">结束时间</label>
            <DatePicker
              value={task.endTime}
              onChange={v => updateTask(task.id, { endTime: v })}
            />
          </div>
        </div>

        {/* 重要/紧急程度 */}
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-caption-em text-cc-text-tertiary tracking-[0.02em] mb-[6px] block">重要程度</label>
            <DotRating
              value={task.importance}
              onChange={v => updateTask(task.id, { importance: v })}
            />
          </div>
          <div className="flex-1">
            <label className="text-caption-em text-cc-text-tertiary tracking-[0.02em] mb-[6px] block">紧急程度</label>
            <DotRating
              value={task.urgency}
              onChange={v => updateTask(task.id, { urgency: v })}
            />
          </div>
        </div>

        {/* 所需时长 */}
        <div>
          <label className="text-caption-em text-cc-text-tertiary tracking-[0.02em] mb-[6px] block">所需时长（分钟）</label>
          <input
            type="number"
            className="w-full px-[10px] py-[6px] text-body bg-cc-surface text-cc-text-primary border border-cc-border-default rounded-cc-lg outline-none transition-colors duration-120 focus:border-cc-border-accent focus:shadow-[0_0_0_3px_var(--accent-subtle)]"
            value={task.duration}
            onChange={e => updateTask(task.id, { duration: Math.max(1, parseInt(e.target.value) || 0) })}
            min={1}
            step={15}
          />
        </div>

        {/* 开关选项 */}
        <div className="flex items-center justify-between py-1">
          <span className="text-caption text-cc-text-tertiary">可碎片化处理</span>
          <Toggle
            checked={task.canFragment}
            onChange={v => updateTask(task.id, { canFragment: v })}
          />
        </div>
        <div className="flex items-center justify-between py-1">
          <span className="text-caption text-cc-text-tertiary">可影响其他任务</span>
          <Toggle
            checked={task.canAffectOthers}
            onChange={v => updateTask(task.id, { canAffectOthers: v })}
          />
        </div>

        {/* 当前安排 */}
        {task.segments.length > 0 && (
          <div>
            <label className="text-caption-em text-cc-text-tertiary tracking-[0.02em] mb-[6px] block">当前安排</label>
            <div className="flex flex-col gap-1">
              {activeSegments.map(seg => (
                <div
                  key={seg.id}
                  className="px-2 py-[5px] text-caption text-cc-text-secondary bg-cc-surface rounded-cc-sm border-l-[3px] border-cc-accent"
                >
                  {seg.startTime.replace('T', ' ')} – {seg.endTime.split('T')[1]}
                  {' '}({Math.round((new Date(seg.endTime).getTime() - new Date(seg.startTime).getTime()) / 60000)}分钟)
                  {seg.totalSegments > 1 && ` (${seg.index}/${seg.totalSegments})`}
                </div>
              ))}
              {completedSegments.map(seg => (
                <div
                  key={seg.id}
                  className="px-2 py-[5px] text-caption text-cc-text-disabled bg-cc-surface rounded-cc-sm border-l-[3px] border-cc-success opacity-60 line-through"
                >
                  {seg.startTime.replace('T', ' ')} – {seg.endTime.split('T')[1]} ✓
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-cc-border-subtle flex gap-2">
        <Button variant="success" className="flex-1" onClick={handleReschedule}>
          重新安排
        </Button>
        <Button variant="danger" className="flex-1" onClick={handleDelete}>
          删除
        </Button>
      </div>
    </div>
  );
};
