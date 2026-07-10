import { useCallback } from 'react';
import { useTaskStore } from '../stores/useTaskStore';
import { useTagGroupStore } from '../stores/useTagGroupStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useCalendarStore } from '../stores/useCalendarStore';
import { useUIStore } from '../stores/useUIStore';
import { getCurrentHolidayCache } from '../utils/holidayStore';
import { scheduleTasks, rescheduleTask } from '../utils/scheduler';
import { parseDate } from '../utils/time';
import type { Task, TaskSegment, ScheduleResult } from '../types';

/**
 * 智能排程 Hook
 * 提供单任务重排和全量排程两种操作
 */
export function useSchedule() {
  const store = useTaskStore;
  const tagGroupStore = useTagGroupStore;

  /** 从标签组构建 isWork 映射 */
  const buildTagGroupIsWorkMap = (): Map<string, boolean> => {
    const map = new Map<string, boolean>();
    for (const g of tagGroupStore.getState().tagGroups) {
      map.set(g.id, g.isWork);
    }
    // 无标签组的任务视为非工作
    map.set('', false);
    return map;
  };

  /**
   * 重排单个任务
   */
  const rescheduleOne = useCallback(async (taskId: string): Promise<ScheduleResult> => {
    const tasks = store.getState().tasks;
    const task = tasks.find(t => t.id === taskId);
    if (!task) {
      return { taskId, success: false, segments: [], displacedTaskIds: [], message: '任务不存在' };
    }

    const settings = useSettingsStore.getState().settings;
    const calendarStore = useCalendarStore.getState();
    const holidayCache = getCurrentHolidayCache();
    const isWorkMap = buildTagGroupIsWorkMap();

    const windowStart = parseDate(calendarStore.getViewStartDate());
    const windowEnd = parseDate(calendarStore.getViewEndDate());
    // 扩展窗口到任务的时间范围
    const taskStart = parseDate(task.startTime);
    const taskEnd = parseDate(task.endTime);
    const effectiveStart = new Date(Math.min(windowStart.getTime(), taskStart.getTime()));
    const effectiveEnd = new Date(Math.max(windowEnd.getTime(), taskEnd.getTime()));

    const { newSegments, displacedTasks } = rescheduleTask(
      task, settings, effectiveStart, effectiveEnd, tasks, holidayCache, isWorkMap,
    );

    if (newSegments.length === 0) {
      const uiStore = useUIStore.getState();
      uiStore.showToast(`❌ ${task.name} 当前无法安排`, 'warning');
      return {
        taskId,
        success: false,
        segments: [],
        displacedTaskIds: displacedTasks.map(t => t.id),
        message: `${task.name} 当前无法安排`,
      };
    }

    // 清除旧段
    await store.getState().removeAllSegments(taskId);

    // 添加新段
    for (let i = 0; i < newSegments.length; i++) {
      const seg = newSegments[i];
      await store.getState().addSegment(
        taskId, seg.startTime, seg.endTime, i + 1, newSegments.length,
      );
    }

    // 更新任务状态
    await store.getState().update(taskId, { status: 'scheduled' });

    // 对被挤走任务的处理：清除它们的段
    for (const dt of displacedTasks) {
      if (dt.canAffectOthers) {
        await store.getState().removeAllSegments(dt.id);
      }
    }

    const uiStore = useUIStore.getState();
    uiStore.showToast(`✅ ${task.name} 已重新安排`, 'success');

    return {
      taskId,
      success: true,
      segments: newSegments,
      displacedTaskIds: displacedTasks.map(t => t.id),
      message: `${task.name} 已安排`,
    };
  }, []);

  /**
   * 一键排程所有未安排任务
   */
  const scheduleAll = useCallback(async (): Promise<ScheduleResult[]> => {
    const tasks = store.getState().tasks;
    const unscheduled = tasks.filter(t => t.status === 'unscheduled');
    if (unscheduled.length === 0) {
      const uiStore = useUIStore.getState();
      uiStore.showToast('✅ 所有任务已安排', 'info');
      return [];
    }

    const settings = useSettingsStore.getState().settings;
    const calendarStore = useCalendarStore.getState();
    const holidayCache = getCurrentHolidayCache();
    const isWorkMap = buildTagGroupIsWorkMap();

    const windowStart = parseDate(calendarStore.getViewStartDate());
    const windowEnd = parseDate(calendarStore.getViewEndDate());

    const results = scheduleTasks(
      unscheduled, settings, windowStart, windowEnd, tasks, holidayCache, isWorkMap,
    );

    let scheduledCount = 0;
    let failedCount = 0;

    for (const result of results) {
      if (result.success && result.segments.length > 0) {
        // 清除旧段（如果有）
        await store.getState().removeAllSegments(result.taskId);

        // 添加新段
        for (let i = 0; i < result.segments.length; i++) {
          const seg = result.segments[i];
          await store.getState().addSegment(
            result.taskId, seg.startTime, seg.endTime, i + 1, result.segments.length,
          );
        }

        // 更新任务状态
        await store.getState().update(result.taskId, { status: 'scheduled' });
        scheduledCount++;
      } else {
        failedCount++;
      }
    }

    const uiStore = useUIStore.getState();
    if (scheduledCount > 0) {
      uiStore.showToast(
        `✅ 已安排 ${scheduledCount} 个任务${failedCount > 0 ? `，${failedCount} 个无法安排` : ''}`,
        'success',
      );
    } else {
      uiStore.showToast('❌ 所有任务均无法在当前窗口内安排', 'warning');
    }

    return results;
  }, []);

  return { rescheduleOne, scheduleAll };
}
