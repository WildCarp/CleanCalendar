import React, { useMemo, useCallback, useState } from 'react';
import { DndContext, DragOverlay, type DragEndEvent, type DragStartEvent, type DragOverEvent } from '@dnd-kit/core';
import { GridHeader } from './GridHeader';
import { TaskBlock } from './TaskBlock';
import { DroppableCell } from './DroppableCell';
import { useCalendarStore } from '../../stores/useCalendarStore';
import { useTaskStore } from '../../stores/useTaskStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useTagGroupStore } from '../../stores/useTagGroupStore';
import { useUIStore } from '../../stores/useUIStore';
import { formatDate } from '../../utils/time';
import type { Task } from '../../types';

export const ScheduleGrid: React.FC = () => {
  const getVisibleDates = useCalendarStore(s => s.getVisibleDates);
  const tasks = useTaskStore(s => s.tasks);
  const settings = useSettingsStore(s => s.settings);
  const updateSegment = useTaskStore(s => s.updateSegment);
  const showToast = useUIStore(s => s.showToast);

  const dates = getVisibleDates();
  const today = new Date();
  const todayStr = formatDate(today);

  // 拖拽状态
  const [activeDrag, setActiveDrag] = useState<{ task: Task; segmentIndex: number } | null>(null);

  const dayStartHour = settings.dayStartHour || 0;
  const dayEndHour = 24;
  const granularity = settings.timeGranularity || 30;
  const numSlots = Math.ceil((dayEndHour - dayStartHour) * 60 / granularity);

  const timeLabels = useMemo(() => {
    const labels: { label: string; isHour: boolean }[] = [];
    for (let i = 0; i < numSlots; i++) {
      const totalMinutes = dayStartHour * 60 + i * granularity;
      const h = Math.floor(totalMinutes / 60);
      const m = totalMinutes % 60;
      labels.push({
        label: m === 0 ? `${h}:00` : '',
        isHour: m === 0,
      });
    }
    return labels;
  }, [numSlots, dayStartHour, granularity]);

  const segmentedTasks = useMemo(() => {
    const result: Array<{
      taskId: string;
      segmentIndex: number;
      segmentId: string;
      date: string;
      startMinutes: number;
      endMinutes: number;
    }> = [];

    for (const task of tasks) {
      if (task.status === 'unscheduled') continue;
      for (let si = 0; si < task.segments.length; si++) {
        const seg = task.segments[si];
        const segDate = seg.startTime.split('T')[0];
        if (!dates.includes(segDate)) continue;

        const startH = parseInt(seg.startTime.split('T')[1].split(':')[0]);
        const startM = parseInt(seg.startTime.split('T')[1].split(':')[1]);
        const endH = parseInt(seg.endTime.split('T')[1].split(':')[0]);
        const endM = parseInt(seg.endTime.split('T')[1].split(':')[1]);

        result.push({
          taskId: task.id,
          segmentIndex: si,
          segmentId: seg.id,
          date: segDate,
          startMinutes: startH * 60 + startM,
          endMinutes: endH * 60 + endM,
        });
      }
    }
    return result;
  }, [tasks, dates]);

  const slotHeight = granularity >= 30 ? 48 : 24;

  const getTaskStyle = (startMinutes: number, endMinutes: number): React.CSSProperties => {
    const startOffset = ((startMinutes - dayStartHour * 60) / granularity) * slotHeight;
    const durationSlots = (endMinutes - startMinutes) / granularity;
    const height = durationSlots * slotHeight - 2;
    return {
      top: `${startOffset + 1}px`,
      height: `${Math.max(height, 20)}px`,
    };
  };

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const data = event.active.data.current;
    if (data && data.type === 'task-block') {
      const taskData = data as { task: Task; segmentIndex: number };
      setActiveDrag({ task: taskData.task, segmentIndex: taskData.segmentIndex });
    }
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveDrag(null);
      const { active, over } = event;
      if (!over || !active.data.current) return;

      const activeData = active.data.current as {
        task: { id: string; duration: number };
        segmentIndex: number;
        segmentId: string;
        type: string;
      };

      if (activeData.type !== 'task-block') return;

      const targetDate = over.data.current?.date as string;
      const targetSlotMinutes = over.data.current?.slotMinutes as number;

      if (!targetDate || targetSlotMinutes === undefined) return;

      const newStartMinutes = targetSlotMinutes;
      const newEndMinutes = newStartMinutes + activeData.task.duration;
      const maxMinutes = dayEndHour * 60;

      const clampedEndMinutes = Math.min(newEndMinutes, maxMinutes);
      if (clampedEndMinutes - newStartMinutes < granularity) return;

      const startH = Math.floor(newStartMinutes / 60);
      const startM = newStartMinutes % 60;
      const endH = Math.floor(clampedEndMinutes / 60);
      const endM = clampedEndMinutes % 60;

      const newStartTime = `${targetDate}T${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}`;
      const newEndTime = `${targetDate}T${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

      updateSegment(activeData.segmentId, {
        startTime: newStartTime,
        endTime: newEndTime,
        isManuallyPlaced: true,
      });

      showToast('✅ 任务已移动', 'success');
    },
    [dayEndHour, granularity, updateSegment, showToast],
  );

  const cellWidth = `calc((100% - 0px) / ${dates.length})`;

  return (
    <div className="flex-1 overflow-auto relative bg-cc-canvas">
      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div
          className="grid"
          style={{
            display: 'grid',
            gridTemplateColumns: `52px repeat(${dates.length}, 1fr)`,
            gridTemplateRows: `40px repeat(${numSlots}, ${slotHeight}px)`,
            minWidth: `${dates.length * 100 + 52}px`,
          }}
        >
          {/* 表头 */}
          <GridHeader />

          {/* 时间行 */}
          {timeLabels.map((tl, rowIdx) => {
            const totalMinutes = dayStartHour * 60 + rowIdx * granularity;
            const isHour = totalMinutes % 60 === 0;

            return (
              <React.Fragment key={rowIdx}>
                {/* 时间标签 */}
                <div
                  className={`flex items-start justify-end px-2 pt-[2px] text-label text-cc-text-tertiary border-r border-cc-border-subtle font-tabular
                    ${isHour ? 'border-b border-cc-border-default' : 'border-b border-cc-border-subtle'}`}
                  style={!isHour ? { fontSize: '10px', fontWeight: '400' } : {}}
                >
                  {tl.label}
                </div>

                {/* 每日格子（可释放） */}
                {dates.map((dateStr) => {
                  const isToday = dateStr === todayStr;
                  return (
                    <DroppableCell
                      key={`${dateStr}-${rowIdx}`}
                      date={dateStr}
                      slotMinutes={totalMinutes}
                      isToday={isToday}
                      isHour={isHour}
                    />
                  );
                })}
              </React.Fragment>
            );
          })}

          {/* 任务块覆盖层 */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              top: '40px',
              left: '52px',
              width: `calc(100% - 52px)`,
            }}
          >
            {segmentedTasks.map(st => {
              const task = tasks.find(t => t.id === st.taskId);
              if (!task) return null;
              const colIdx = dates.indexOf(st.date);
              if (colIdx === -1) return null;

              const style = {
                ...getTaskStyle(st.startMinutes, st.endMinutes),
                left: `calc(${colIdx} * ${cellWidth} + 2px)`,
                width: `calc(${cellWidth} - 4px)`,
                pointerEvents: 'auto' as const,
              };

              return (
                <TaskBlock
                  key={`${st.taskId}-${st.segmentIndex}`}
                  task={task}
                  segmentIndex={st.segmentIndex}
                  segmentId={st.segmentId}
                  style={style}
                  dateStr={st.date}
                  startMinutes={st.startMinutes}
                />
              );
            })}
          </div>
        </div>

        {/* 拖拽跟随预览 */}
        <DragOverlay dropAnimation={null}>
          {activeDrag ? (
            <div
              className="rounded-cc-md border overflow-hidden flex items-start gap-1 px-[6px] py-[3px] shadow-drag opacity-90"
              style={{
                backgroundColor: (() => {
                  const groups = useTagGroupStore.getState().tagGroups;
                  const g = groups.find(gg => gg.id === activeDrag.task.tagGroupId);
                  return (g?.color || '#6c7aef') + '18';
                })(),
                color: (() => {
                  const groups = useTagGroupStore.getState().tagGroups;
                  const g = groups.find(gg => gg.id === activeDrag.task.tagGroupId);
                  return g?.color || '#6c7aef';
                })(),
                width: '120px',
                minHeight: '24px',
              }}
            >
              <span className="flex-shrink-0 leading-[1.4] text-[12px]">
                {(() => {
                  const groups = useTagGroupStore.getState().tagGroups;
                  const g = groups.find(gg => gg.id === activeDrag.task.tagGroupId);
                  return g?.emoji || '📋';
                })()}
              </span>
              <span className="flex-1 whitespace-nowrap overflow-hidden text-ellipsis leading-[1.4] text-[12px]">
                {activeDrag.task.name}
              </span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};
