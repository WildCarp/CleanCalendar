import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import type { Task } from '../../types';
import { useTaskStore } from '../../stores/useTaskStore';
import { useTagGroupStore } from '../../stores/useTagGroupStore';
import { useUIStore } from '../../stores/useUIStore';

interface TaskBlockProps {
  task: Task;
  segmentIndex?: number;
  segmentId?: string;
  style?: React.CSSProperties;
  dateStr?: string;
  startMinutes?: number;
}

export const TaskBlock: React.FC<TaskBlockProps> = ({
  task,
  segmentIndex,
  segmentId,
  style,
  dateStr,
  startMinutes,
}) => {
  const selectTask = useTaskStore(s => s.select);
  const completeSegment = useTaskStore(s => s.completeSegment);
  const uncompleteSegment = useTaskStore(s => s.uncompleteSegment);
  const tagGroups = useTagGroupStore(s => s.tagGroups);
  const setDetailPanelOpen = useUIStore(s => s.setDetailPanelOpen);
  const showToast = useUIStore(s => s.showToast);

  const group = tagGroups.find(g => g.id === task.tagGroupId);
  const tagColor = group?.color || '#6c7aef';
  const emoji = group?.emoji || '📋';

  const seg = segmentIndex !== undefined ? task.segments[segmentIndex] : null;
  const isCompleted = seg?.isCompleted ?? false;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    selectTask(task.id);
    setDetailPanelOpen(true);
  };

  const handleCheck = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!seg) return;
    if (seg.isCompleted) {
      uncompleteSegment(seg.id);
      showToast('↩️ 已标记为未完成', 'info');
    } else {
      completeSegment(seg.id);
      showToast('✅ 已完成', 'success');
    }
  };

  const dragId = segmentId || `${task.id}-${segmentIndex}`;
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: dragId,
    data: { task, segmentIndex, segmentId, dateStr, startMinutes, type: 'task-block' },
    disabled: isCompleted,
  });

  const dragStyle: React.CSSProperties = transform
    ? {
        transform: `translate(${transform.x}px, ${transform.y}px)`,
        zIndex: isDragging ? 25 : 20,
        opacity: isDragging ? 0.3 : 1,
        boxShadow: isDragging ? 'none' : undefined,
      }
    : {};

  const blockH = style?.height ? parseFloat(String(style.height)) : 24;
  const tiny = blockH < 28;
  const micro = blockH < 20;

  return (
    <div
      ref={setNodeRef}
      className={`task-block absolute rounded-cc-md border overflow-hidden flex items-center gap-1 z-[2]
        transition-all duration-120 hover:shadow-[0_0_0_2px_var(--border-accent)] hover:z-[5]
        cursor-grab active:cursor-grabbing select-none
        ${isDragging ? 'z-[25]' : ''}
        ${isCompleted ? 'opacity-50' : ''}`}
      style={{
        backgroundColor: tagColor + '18',
        color: tagColor,
        borderColor: tagColor + '1A',
        minHeight: '16px',
        ...style,
        ...dragStyle,
        paddingLeft: tiny ? 2 : 5,
        paddingRight: tiny ? 2 : 5,
      }}
      {...attributes}
      {...listeners}
      onClick={handleClick}
    >
      {/* 完成勾选框 */}
      {seg && !tiny && (
        <span
          className={`flex-shrink-0 flex items-center justify-center rounded-cc-sm
            ${isCompleted
              ? 'bg-cc-success text-white'
              : 'border border-current opacity-30 hover:opacity-70'}`}
          style={{ width: 14, height: 14, fontSize: 10, lineHeight: '14px' }}
          onClick={handleCheck}
          title={isCompleted ? '取消完成' : '标记完成'}
        >
          {isCompleted ? '✓' : ''}
        </span>
      )}

      {/* emoji + 名称 */}
      {!micro && (
        <span className={`flex-shrink-0 leading-[1.3] ${tiny ? 'text-[10px]' : 'text-[12px]'}`}>
          {emoji}
        </span>
      )}
      <span
        className={`flex-1 overflow-hidden text-ellipsis leading-[1.3]
          ${tiny ? 'text-[9px]' : 'text-[12px]'}
          ${micro ? 'text-[8px]' : ''}
          ${isCompleted ? 'line-through' : ''}`}
        style={{ whiteSpace: 'nowrap' }}
      >
        {task.name}
      </span>

      {/* 分段信息 */}
      {seg && seg.totalSegments > 1 && !tiny && (
        <span className="text-[10px] opacity-60 flex-shrink-0 leading-[1.3]">
          ({seg.index}/{seg.totalSegments})
        </span>
      )}

      {/* 拖拽提示标 */}
      {!isCompleted && !tiny && (
        <span className="flex-shrink-0 text-[10px] opacity-30 leading-[1.3] ml-auto pointer-events-none">
          ⠿
        </span>
      )}
    </div>
  );
};
