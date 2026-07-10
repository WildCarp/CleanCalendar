import React, { useMemo, useCallback, useState, useRef, useEffect } from 'react';
import { DndContext, DragOverlay, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core';
import { TaskBlock } from './TaskBlock';
import { DroppableCell } from './DroppableCell';
import { useCalendarStore } from '../../stores/useCalendarStore';
import { useTaskStore } from '../../stores/useTaskStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useTagGroupStore } from '../../stores/useTagGroupStore';
import { useUIStore } from '../../stores/useUIStore';
import { formatDate, WEEKDAY_NAMES, MONTH_NAMES, addDays } from '../../utils/time';
import type { Task } from '../../types';

/* ======= 横轴=时间  纵轴=日期  平滑平移+连续缩放 ======= */

const BASE_SLOT_WIDTH = 48;
const BASE_ROW_HEIGHT = 64;
const MIN_ZOOM = 0.3;
const MAX_ZOOM = 3.5;
const ZOOM_SPEED = 1.08; // 每格滚轮乘法因子

export const ScheduleGrid: React.FC = () => {
  const tasks = useTaskStore(s => s.tasks);
  const settings = useSettingsStore(s => s.settings);
  const updateSegment = useTaskStore(s => s.updateSegment);
  const showToast = useUIStore(s => s.showToast);
  const viewCenterDate = useCalendarStore(s => s.viewCenterDate);

  // ── 缩放状态（连续值）──
  const [zoomLevel, setZoomLevel] = useState(1.0);

  // 由 zoom 推导的几何参数
  const slotWidth = Math.round(BASE_SLOT_WIDTH * zoomLevel);
  const rowHeight = Math.round(BASE_ROW_HEIGHT * zoomLevel);
  const effectiveDisplayDays = Math.max(1, Math.min(31, Math.round(7 / zoomLevel)));

  // 由 zoom 推导的可见日期列表
  const dates = useMemo(() => {
    const halfDays = Math.floor(effectiveDisplayDays / 2);
    const start = addDays(viewCenterDate, -halfDays);
    const result: string[] = [];
    for (let i = 0; i < effectiveDisplayDays; i++) {
      result.push(formatDate(addDays(start, i)));
    }
    return result;
  }, [viewCenterDate, effectiveDisplayDays]);

  const today = new Date();
  const todayStr = formatDate(today);
  const daysFromToday = Math.abs((viewCenterDate.getTime() - today.getTime()) / 86_400_000);
  const showTodayHighlight = daysFromToday < effectiveDisplayDays / 2 + 2;

  // ── 拖拽 ──
  const [activeDrag, setActiveDrag] = useState<{ task: Task; segmentIndex: number; width: number; height: number } | null>(null);

  // 时间槽参数（调度用，不随 zoom 变）
  const dayStartHour = settings.dayStartHour || 0;
  const dayEndHour = 24;
  const granularity = settings.timeGranularity || 30;
  const numSlots = Math.ceil((dayEndHour - dayStartHour) * 60 / granularity);

  const totalWidth = numSlots * slotWidth;

  // ── 展开的任务段 ──
  const segmentedTasks = useMemo(() => {
    const result: Array<{
      taskId: string; segmentIndex: number; segmentId: string;
      date: string; startMinutes: number; endMinutes: number;
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
          taskId: task.id, segmentIndex: si, segmentId: seg.id, date: segDate,
          startMinutes: startH * 60 + startM, endMinutes: endH * 60 + endM,
        });
      }
    }
    return result;
  }, [tasks, dates]);

  const getTaskStyle = (startMinutes: number, endMinutes: number): React.CSSProperties => {
    const startOffset = ((startMinutes - dayStartHour * 60) / granularity) * slotWidth;
    const durationSlots = (endMinutes - startMinutes) / granularity;
    const w = durationSlots * slotWidth - 2;
    return { left: `${startOffset + 1}px`, width: `${Math.max(w, 20)}px` };
  };

  // ===== 拖拽（任务块移动）=====
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
      const ad = active.data.current as {
        task: { id: string; duration: number }; segmentId: string; type: string;
      };
      if (ad.type !== 'task-block') return;
      const targetDate = over.data.current?.date as string;
      const targetSlotMinutes = over.data.current?.slotMinutes as number;
      if (!targetDate || targetSlotMinutes === undefined) return;

      const newStart = targetSlotMinutes;
      const newEnd = Math.min(newStart + ad.task.duration, dayEndHour * 60);
      if (newEnd - newStart < granularity) return;

      const sh = Math.floor(newStart / 60), sm = newStart % 60;
      const eh = Math.floor(newEnd / 60), em = newEnd % 60;
      const newStartTime = `${targetDate}T${String(sh).padStart(2, '0')}:${String(sm).padStart(2, '0')}`;
      const newEndTime = `${targetDate}T${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`;

      updateSegment(ad.segmentId, { startTime: newStartTime, endTime: newEndTime, isManuallyPlaced: true });
      showToast('✅ 任务已移动', 'success');
    },
    [dayEndHour, granularity, updateSegment, showToast],
  );

  // ===== 右键拖拽平滑平移（原生 scrollLeft / scrollTop）=====
  const panning = useRef(false);
  const panAnchor = useRef({ x: 0, y: 0, sl: 0, st: 0 });
  const gridRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 2) return;
    e.preventDefault();
    panning.current = true;
    const el = gridRef.current!;
    panAnchor.current = { x: e.clientX, y: e.clientY, sl: el.scrollLeft, st: el.scrollTop };
  }, []);

  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (!panning.current) return;
      const el = gridRef.current;
      if (!el) return;
      el.scrollLeft = panAnchor.current.sl - (e.clientX - panAnchor.current.x);
      el.scrollTop  = panAnchor.current.st - (e.clientY - panAnchor.current.y);
    };
    const up = () => { panning.current = false; };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
  }, []);

  // 阻止右键菜单
  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const h = (e: Event) => e.preventDefault();
    el.addEventListener('contextmenu', h);
    return () => el.removeEventListener('contextmenu', h);
  }, []);

  // ===== 滚轮缩放（连续）=====
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? ZOOM_SPEED : 1 / ZOOM_SPEED;
    setZoomLevel(z => {
      const next = z * factor;
      return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, next));
    });
  }, []);

  // ── 渲染 ──
  return (
    <div
      ref={gridRef}
      className="flex-1 overflow-auto relative bg-cc-canvas select-none"
      onMouseDown={handleMouseDown}
      onWheel={handleWheel}
      style={{ cursor: panning.current ? 'grabbing' : undefined }}
    >
      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        {/* 时间表头 */}
        <div className="sticky top-0 z-10 flex bg-cc-grid-header border-b border-cc-border-subtle h-[36px]"
          style={{ minWidth: totalWidth + 64 }}>
          <div className="flex-shrink-0 w-[64px] border-r border-cc-border-subtle" />
          {Array.from({ length: numSlots }).map((_, i) => {
            const mins = dayStartHour * 60 + i * granularity;
            const h = Math.floor(mins / 60);
            const isHour = mins % 60 === 0;
            // 根据可视宽度决定是否显示标签
            const showLabel = isHour && slotWidth > 20;
            return (
              <div key={i}
                className={`flex-shrink-0 flex items-center justify-center border-r border-cc-border-subtle text-[10px] font-tabular
                  ${isHour ? 'text-cc-text-tertiary' : 'text-cc-text-disabled'}`}
                style={{ width: slotWidth }}>
                {showLabel ? `${h}:00` : ''}
              </div>
            );
          })}
        </div>

        {/* 日期行 */}
        <div style={{ minWidth: totalWidth + 64 }}>
          {dates.map((dateStr) => {
            const d = new Date(dateStr + 'T00:00:00');
            const isToday = showTodayHighlight && dateStr === todayStr;
            const isFirstOfMonth = d.getDate() === 1;

            return (
              <div key={dateStr} className="flex border-b border-cc-border-subtle relative"
                style={{ height: rowHeight, minWidth: totalWidth + 64 }}>
                {/* 日期标签 */}
                <div data-date-col
                  className={`flex-shrink-0 w-[64px] flex flex-col items-center justify-center border-r border-cc-border-subtle text-label
                    ${isToday ? 'bg-cc-grid-today text-cc-accent' : 'text-cc-text-tertiary'}`}>
                  {isFirstOfMonth && <span className="text-[10px]">{MONTH_NAMES[d.getMonth()]}</span>}
                  <span className={`text-[18px] font-[590] leading-none ${isToday ? 'text-cc-accent' : 'text-cc-text-primary'}`}>
                    {d.getDate()}
                  </span>
                  <span className="text-[10px]">{WEEKDAY_NAMES[d.getDay()]}</span>
                </div>

                {/* 时间槽 */}
                {Array.from({ length: numSlots }).map((_, i) => {
                  const mins = dayStartHour * 60 + i * granularity;
                  return (
                    <DroppableCell
                      key={`${dateStr}-${i}`}
                      date={dateStr} slotMinutes={mins}
                      isToday={isToday}
                      isHour={mins % 60 === 0}
                      style={{ width: slotWidth }}
                    />
                  );
                })}

                {/* 任务块 */}
                {segmentedTasks.filter(st => st.date === dateStr).map(st => {
                  const task = tasks.find(t => t.id === st.taskId);
                  if (!task) return null;
                  return (
                    <TaskBlock
                      key={`${st.taskId}-${st.segmentIndex}`}
                      task={task} segmentIndex={st.segmentIndex} segmentId={st.segmentId}
                      style={{ ...getTaskStyle(st.startMinutes, st.endMinutes), pointerEvents: 'auto' }}
                      dateStr={st.date} startMinutes={st.startMinutes}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* 拖拽浮层 */}
        <DragOverlay dropAnimation={{ duration: 120 }}>
          {activeDrag ? (
            <div className="rounded-cc-md border flex items-start gap-1 px-[6px] py-[3px] shadow-drag opacity-90"
              style={{
                backgroundColor: (() => { const g = useTagGroupStore.getState().tagGroups.find(gg => gg.id === activeDrag.task.tagGroupId); return (g?.color || '#6c7aef') + '18'; })(),
                color:        (() => { const g = useTagGroupStore.getState().tagGroups.find(gg => gg.id === activeDrag.task.tagGroupId); return g?.color || '#6c7aef'; })(),
                width: activeDrag.width, height: activeDrag.height,
              }}>
              <span className="flex-shrink-0 leading-[1.4] text-[12px]">
                {(() => { const g = useTagGroupStore.getState().tagGroups.find(gg => gg.id === activeDrag.task.tagGroupId); return g?.emoji || '📋'; })()}
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
