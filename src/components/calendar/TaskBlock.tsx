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

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!seg) return;
    if (seg.isCompleted) {
      uncompleteSegment(seg.id);
      showToast('↩️ 已标记为未完成', 'info');
    } else {
      completeSegment(seg.id);
      showToast('✅ 已完成', 'success');
    }
  };

  // Draggable 配置
  const dragId = segmentId || `${task.id}-${segmentIndex}`;
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: dragId,
    data: {
      task,
      segmentIndex,
      segmentId,
      dateStr,
      startMinutes,
      type: 'task-block',
    },
    disabled: isCompleted,
  });

  const bgAlpha = '18';
  const borderAlpha = '1A';

  const dragStyle: React.CSSProperties = transform
    ? {
        transform: `translate(${transform.x}px, ${transform.y}px)`,
        zIndex: 20,
        opacity: isDragging ? 0.85 : 1,
        boxShadow: isDragging ? '0 4px 16px rgba(0,0,0,0.3)' : undefined,
      }
    : {};

  return (
    <div
      ref={setNodeRef}
      className={`task-block absolute left-[2px] right-[2px] rounded-cc-md border overflow-hidden flex items-start gap-1 px-[6px] py-[3px] z-[2]
        transition-all duration-120 hover:shadow-[0_0_0_2px_var(--border-accent)] hover:z-[5]
        cursor-grab active:cursor-grabbing select-none
        ${isDragging ? 'z-[20]' : ''}
        ${isCompleted ? 'opacity-50' : ''}`}
      style={{
        backgroundColor: tagColor + bgAlpha,
        color: tagColor,
        borderColor: tagColor + borderAlpha,
        minHeight: '20px',
        ...style,
        ...dragStyle,
      }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      {...attributes}
      {...listeners}
    >
      <span className="flex-shrink-0 leading-[1.4] text-[12px]">{emoji}</span>
      <span className={`flex-1 whitespace-nowrap overflow-hidden text-ellipsis leading-[1.4] text-[12px] ${isCompleted ? 'line-through' : ''}`}>
        {task.name}
      </span>
      {seg && seg.totalSegments > 1 && (
        <span className="text-[10px] opacity-60 flex-shrink-0 leading-[1.4]">
          ({seg.index}/{seg.totalSegments})
        </span>
      )}
      {/* 拖拽手柄指示器 */}
      {!isCompleted && (
        <span className="flex-shrink-0 text-[10px] opacity-50 leading-[1.4] ml-auto">⠿</span>
      )}
    </div>
  );
};
