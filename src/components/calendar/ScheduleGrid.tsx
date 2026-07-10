import React, { useMemo, useCallback, useState, useRef, useEffect } from 'react';
import { DndContext, DragOverlay, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core';
import { TaskBlock } from './TaskBlock';
import { DroppableCell } from './DroppableCell';
import { useCalendarStore } from '../../stores/useCalendarStore';
import { useTaskStore } from '../../stores/useTaskStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useTagGroupStore } from '../../stores/useTagGroupStore';
import { useUIStore } from '../../stores/useUIStore';
import { formatDate, WEEKDAY_NAMES, MONTH_NAMES } from '../../utils/time';
import type { Task } from '../../types';

/* ======= 轴布局：横轴=时间，纵轴=日期 ======= */

const SLOT_WIDTH = 48; // 每格像素宽

export const ScheduleGrid: React.FC = () => {
  const getVisibleDates = useCalendarStore(s => s.getVisibleDates);
  const tasks = useTaskStore(s => s.tasks);
  const settings = useSettingsStore(s => s.settings);
  const updateSegment = useTaskStore(s => s.updateSegment);
  const updateSettings = useSettingsStore(s => s.update);
  const showToast = useUIStore(s => s.showToast);
  const panByDelta = useCalendarStore(s => s.panByDelta);
  const displayDays = settings.displayDays;

  const dates = getVisibleDates();
  const today = new Date();
  const todayStr = formatDate(today);
  // only highlight today when view is within ~3 days of today
  const viewCenter = useCalendarStore(s => s.viewCenterDate);
  const daysFromToday = Math.abs((viewCenter.getTime() - today.getTime()) / 86400000);
  const showTodayHighlight = daysFromToday < displayDays / 2 + 2;

  // 拖拽 & 平移状态
  const [activeDrag, setActiveDrag] = useState<{ task: Task; segmentIndex: number; width: number; height: number } | null>(null);
  const panning = useRef(false);
  const panStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const panAccum = useRef(0);
  const gridRef = useRef<HTMLDivElement>(null);

  // 时间相关
  const dayStartHour = settings.dayStartHour || 0;
  const dayEndHour = 24;
  const granularity = settings.timeGranularity || 30;
  const numSlots = Math.ceil((dayEndHour - dayStartHour) * 60 / granularity);

  // 收集展开的任务段
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

  const rowHeight = 64; // 每行日期高度

  // 任务位置计算（横轴=时间）
  const getTaskStyle = (startMinutes: number, endMinutes: number, dateIdx: number): React.CSSProperties => {
    const startOffset = ((startMinutes - dayStartHour * 60) / granularity) * SLOT_WIDTH;
    const durationSlots = (endMinutes - startMinutes) / granularity;
    const width = durationSlots * SLOT_WIDTH - 2;

    return {
      left: `${startOffset + 1}px`,
      width: `${Math.max(width, 20)}px`,
      top: `${dateIdx * rowHeight + 2}px`,
      height: `${rowHeight - 4}px`,
    };
  };

  // ===== 拖拽事件 =====
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const data = event.active.data.current;
    if (data && data.type === 'task-block') {
      const d = data as { task: Task; segmentIndex: number; segWidth: number; segHeight: number };
      setActiveDrag({ task: d.task, segmentIndex: d.segmentIndex, width: d.segWidth || 100, height: d.segHeight || 24 });
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

  // ===== 右键拖拽平移 =====
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 2) {
      e.preventDefault();
      panning.current = true;
      panStart.current = { x: e.clientX, y: e.clientY };
      panAccum.current = 0;
    }
  }, []);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!panning.current) return;
      const dx = e.clientX - panStart.current.x;
      panStart.current = { x: e.clientX, y: e.clientY };
      panAccum.current += dx;
      // 累积 60px 平移一天
      while (panAccum.current >= 60) { panAccum.current -= 60; panByDelta(1); }
      while (panAccum.current <= -60) { panAccum.current += 60; panByDelta(-1); }
    };
    const onMouseUp = () => { panning.current = false; panAccum.current = 0; };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [panByDelta]);

  // 阻止右键菜单
  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const handler = (e: Event) => e.preventDefault();
    el.addEventListener('contextmenu', handler);
    return () => el.removeEventListener('contextmenu', handler);
  }, []);

  // ===== 滚轮缩放 =====
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const direction = e.deltaY > 0 ? -1 : 1;

    // 判断鼠标在日期列还是网格区域
    const target = e.target as HTMLElement;
    const inDateArea = target.closest('[data-date-col]');

    if (inDateArea) {
      // 缩放日期轴：调整 displayDays
      const steps = [1, 3, 7, 14, 28];
      const idx = steps.indexOf(displayDays);
      const newIdx = Math.max(0, Math.min(steps.length - 1, idx + direction));
      if (steps[newIdx] !== displayDays) {
        updateSettings({ displayDays: steps[newIdx] });
      }
    } else {
      // 缩放时间轴：调整 timeGranularity + day start/end
      const gSteps = [10, 15, 20, 30, 60];
      const gIdx = gSteps.indexOf(granularity);
      const newGIdx = Math.max(0, Math.min(gSteps.length - 1, gIdx + direction));
      if (gSteps[newGIdx] !== granularity) {
        updateSettings({ timeGranularity: gSteps[newGIdx] });
      }
    }
  }, [displayDays, granularity, updateSettings]);

  const totalWidth = numSlots * SLOT_WIDTH;

  return (
    <div
      ref={gridRef}
      className="flex-1 overflow-auto relative bg-cc-canvas select-none"
      onMouseDown={handleMouseDown}
      onWheel={handleWheel}
      style={{ cursor: panning.current ? 'grabbing' : 'default' }}
    >
      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        {/* 时间表头 */}
        <div
          className="sticky top-0 z-10 flex bg-cc-grid-header border-b border-cc-border-subtle h-[36px]"
          style={{ minWidth: totalWidth + 64 }}
        >
          <div className="flex-shrink-0 w-[64px] border-r border-cc-border-subtle" />
          {Array.from({ length: numSlots }).map((_, slotIdx) => {
            const totalMinutes = dayStartHour * 60 + slotIdx * granularity;
            const isHour = totalMinutes % 60 === 0;
            const h = Math.floor(totalMinutes / 60);
            const m = totalMinutes % 60;
            return (
              <div
                key={`th-${slotIdx}`}
                className={`flex-shrink-0 flex items-center justify-center border-r border-cc-border-subtle text-[10px] font-tabular
                  ${isHour ? 'text-cc-text-tertiary font-[510]' : 'text-cc-text-disabled'}`}
                style={{ width: SLOT_WIDTH }}
              >
                {isHour ? `${h}:00` : (granularity >= 60 ? '' : '')}
              </div>
            );
          })}
        </div>

        {/* 日期行 */}
        <div style={{ minWidth: totalWidth + 64 }}>
          {dates.map((dateStr, dateIdx) => {
            const d = new Date(dateStr + 'T00:00:00');
            const isToday = showTodayHighlight && dateStr === todayStr;
            const isFirstOfMonth = d.getDate() === 1;

            return (
              <div
                key={dateStr}
                className="flex border-b border-cc-border-subtle relative"
                style={{ height: rowHeight, minWidth: totalWidth + 64 }}
              >
                {/* 日期标签列 */}
                <div
                  data-date-col
                  className={`flex-shrink-0 w-[64px] flex flex-col items-center justify-center border-r border-cc-border-subtle text-label text-cc-text-tertiary
                    ${isToday ? 'bg-cc-grid-today !text-cc-accent' : ''}`}
                >
                  {isFirstOfMonth && <span className="text-[10px]">{MONTH_NAMES[d.getMonth()]}</span>}
                  <span className={`text-[18px] font-[590] leading-none ${isToday ? 'text-cc-accent' : 'text-cc-text-primary'}`}>
                    {d.getDate()}
                  </span>
                  <span className="text-[10px]">{WEEKDAY_NAMES[d.getDay()]}</span>
                </div>

                {/* 时间槽位 */}
                {Array.from({ length: numSlots }).map((_, slotIdx) => {
                  const totalMinutes = dayStartHour * 60 + slotIdx * granularity;
                  const isHour = totalMinutes % 60 === 0;
                  return (
                    <DroppableCell
                      key={`${dateStr}-${slotIdx}`}
                      date={dateStr}
                      slotMinutes={totalMinutes}
                      isToday={isToday}
                      isHour={isHour}
                      style={{ width: SLOT_WIDTH }}
                    />
                  );
                })}

                {/* 该日期的任务块 */}
                {segmentedTasks
                  .filter(st => st.date === dateStr)
                  .map(st => {
                    const task = tasks.find(t => t.id === st.taskId);
                    if (!task) return null;
                    const style = {
                      ...getTaskStyle(st.startMinutes, st.endMinutes, 0),
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
            );
          })}
        </div>

        {/* 拖拽预览 */}
        <DragOverlay dropAnimation={{ duration: 120 }}>
          {activeDrag ? (
            <div
              className="rounded-cc-md border flex items-start gap-1 px-[6px] py-[3px] shadow-drag opacity-90"
              style={{
                backgroundColor: (() => {
                  const g = useTagGroupStore.getState().tagGroups.find(gg => gg.id === activeDrag.task.tagGroupId);
                  return (g?.color || '#6c7aef') + '18';
                })(),
                color: (() => {
                  const g = useTagGroupStore.getState().tagGroups.find(gg => gg.id === activeDrag.task.tagGroupId);
                  return g?.color || '#6c7aef';
                })(),
                width: activeDrag.width,
                height: activeDrag.height,
              }}
            >
              <span className="flex-shrink-0 leading-[1.4] text-[12px]">
                {(() => {
                  const g = useTagGroupStore.getState().tagGroups.find(gg => gg.id === activeDrag.task.tagGroupId);
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
