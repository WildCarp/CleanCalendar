import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { DatePicker } from '../ui/DatePicker';
import { DotRating } from '../ui/DotRating';
import { Toggle } from '../ui/Toggle';
import { useTaskStore } from '../../stores/useTaskStore';
import { useTagGroupStore } from '../../stores/useTagGroupStore';
import { useUIStore } from '../../stores/useUIStore';
import { useSchedule } from '../../hooks/useSchedule';
import { formatDateTime, addDays } from '../../utils/time';

export const CreateTaskForm: React.FC = () => {
  const open = useUIStore(s => s.createTaskModalOpen);
  const closeCreateTask = useUIStore(s => s.closeCreateTask);
  const createTask = useTaskStore(s => s.create);
  const tagGroups = useTagGroupStore(s => s.tagGroups);
  const showToast = useUIStore(s => s.showToast);
  const { rescheduleOne } = useSchedule();

  const [name, setName] = useState('');
  const [tagGroupId, setTagGroupId] = useState('');
  const [startTime, setStartTime] = useState(formatDateTime(new Date()));
  const [endTime, setEndTime] = useState(formatDateTime(addDays(new Date(), 7)));
  const [importance, setImportance] = useState(3);
  const [urgency, setUrgency] = useState(3);
  const [duration, setDuration] = useState(60);
  const [canFragment, setCanFragment] = useState(true);
  const [canAffectOthers, setCanAffectOthers] = useState(true);

  const tagGroupOptions = [
    { value: '', label: '无标签组' },
    ...tagGroups.map(g => ({ value: g.id, label: `${g.emoji} ${g.name}`, color: g.color })),
  ];

  const handleCreate = async (andSchedule: boolean) => {
    if (!name.trim()) {
      showToast('请输入任务名称', 'warning');
      return;
    }

    const task = await createTask({
      name: name.trim(),
      tagGroupId,
      startTime,
      endTime,
      importance,
      urgency,
      duration,
      canFragment,
      canAffectOthers,
      status: 'unscheduled',
    });

    showToast(`✅ 已创建任务「${task.name}」`, 'success');
    closeCreateTask();

    // 重置表单
    setName('');
    setTagGroupId('');
    setImportance(3);
    setUrgency(3);
    setDuration(60);
    setCanFragment(true);
    setCanAffectOthers(true);

    if (andSchedule) {
      try {
        await rescheduleOne(task.id);
      } catch {
        showToast('⚠️ 任务已创建但排程失败，可手动安排', 'warning');
      }
    }
  };

  if (!open) return null;

  return (
    <Modal open={open} onClose={closeCreateTask} title="新建任务">
      <div className="flex flex-col gap-4">
        {/* 名称 */}
        <div>
          <label className="text-caption-em text-cc-text-tertiary tracking-[0.02em] mb-[6px] block">任务名称 *</label>
          <input
            className="w-full px-[10px] py-[6px] text-body bg-cc-surface text-cc-text-primary border border-cc-border-default rounded-cc-lg outline-none transition-colors duration-120 focus:border-cc-border-accent focus:shadow-[0_0_0_3px_var(--accent-subtle)]"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="输入任务名称..."
            autoFocus
          />
        </div>

        {/* 标签组 */}
        <div>
          <label className="text-caption-em text-cc-text-tertiary tracking-[0.02em] mb-[6px] block">标签组</label>
          <Select
            options={tagGroupOptions}
            value={tagGroupId}
            onChange={setTagGroupId}
            showColorDot
          />
        </div>

        {/* 时间范围 */}
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-caption-em text-cc-text-tertiary tracking-[0.02em] mb-[6px] block">开始时间</label>
            <DatePicker value={startTime} onChange={setStartTime} />
          </div>
          <div className="flex-1">
            <label className="text-caption-em text-cc-text-tertiary tracking-[0.02em] mb-[6px] block">结束时间</label>
            <DatePicker value={endTime} onChange={setEndTime} />
          </div>
        </div>

        {/* 重要/紧急程度 */}
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-caption-em text-cc-text-tertiary tracking-[0.02em] mb-[6px] block">重要程度</label>
            <DotRating value={importance} onChange={setImportance} />
          </div>
          <div className="flex-1">
            <label className="text-caption-em text-cc-text-tertiary tracking-[0.02em] mb-[6px] block">紧急程度</label>
            <DotRating value={urgency} onChange={setUrgency} />
          </div>
        </div>

        {/* 所需时长 */}
        <div>
          <label className="text-caption-em text-cc-text-tertiary tracking-[0.02em] mb-[6px] block">所需时长（分钟）</label>
          <input
            type="number"
            className="w-full px-[10px] py-[6px] text-body bg-cc-surface text-cc-text-primary border border-cc-border-default rounded-cc-lg outline-none transition-colors duration-120 focus:border-cc-border-accent focus:shadow-[0_0_0_3px_var(--accent-subtle)]"
            value={duration}
            onChange={e => setDuration(Math.max(1, parseInt(e.target.value) || 0))}
            min={1}
            step={15}
          />
        </div>

        {/* 开关选项 */}
        <div className="flex items-center justify-between py-1">
          <span className="text-caption text-cc-text-tertiary">可碎片化处理</span>
          <Toggle checked={canFragment} onChange={setCanFragment} />
        </div>
        <div className="flex items-center justify-between py-1">
          <span className="text-caption text-cc-text-tertiary">可影响其他任务</span>
          <Toggle checked={canAffectOthers} onChange={setCanAffectOthers} />
        </div>

        {/* 按钮 */}
        <div className="flex gap-2 pt-2">
          <Button variant="ghost" className="flex-1" onClick={() => handleCreate(false)}>
            仅创建
          </Button>
          <Button variant="success" className="flex-1" onClick={() => handleCreate(true)}>
            创建并安排
          </Button>
        </div>
      </div>
    </Modal>
  );
};
