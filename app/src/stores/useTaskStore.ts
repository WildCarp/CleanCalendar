// ============================================================
// CleanCalendar — 任务 Store
// ============================================================

import { create } from 'zustand';
import type { Task, TaskSegment, ScheduleResult } from '../types';
import { getAllTasks, saveTask, deleteTask, saveSegment, deleteSegment, getSegmentsByTask } from '../utils/db';
import { generateId, now } from '../utils/id';
import { scheduleTask, batchSchedule, rescheduleTask } from '../utils/scheduler';
import { useSettingsStore } from './useSettingsStore';
import { useTagGroupStore } from './useTagGroupStore';

interface TaskState {
  tasks: Task[];
  loaded: boolean;

  load: () => Promise<void>;
  create: (data: Partial<Task>) => Promise<Task>;
  update: (id: string, data: Partial<Task>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  schedule: (taskId: string) => Promise<ScheduleResult>;
  scheduleAll: () => Promise<ScheduleResult[]>;
  reschedule: (taskId: string) => Promise<ScheduleResult>;
  completeSegment: (segId: string) => Promise<void>;
  uncompleteSegment: (segId: string) => Promise<void>;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  loaded: false,

  load: async () => {
    const tasks = await getAllTasks();
    // 加载每个任务的段
    for (const task of tasks) {
      task.segments = await getSegmentsByTask(task.id);
    }
    set({ tasks, loaded: true });
  },

  create: async (data) => {
    const task: Task = {
      id: generateId(),
      tagGroupId: data.tagGroupId || '',
      name: data.name || '新任务',
      startTime: data.startTime || '',
      endTime: data.endTime || '',
      importance: data.importance ?? 3,
      urgency: data.urgency ?? 3,
      duration: data.duration ?? 60,
      canFragment: data.canFragment ?? false,
      canAffectOthers: data.canAffectOthers ?? false,
      status: data.status || 'unscheduled',
      segments: [],
      createdAt: now(),
    };
    await saveTask(task);
    set(state => ({ tasks: [...state.tasks, task] }));
    return task;
  },

  update: async (id, data) => {
    await saveTask(data as Task); // 先存
    const tasks = get().tasks.map(t =>
      t.id === id ? { ...t, ...data } : t
    );
    set({ tasks });
  },

  remove: async (id) => {
    await deleteTask(id);
    set(state => ({ tasks: state.tasks.filter(t => t.id !== id) }));
  },

  schedule: async (taskId) => {
    const task = get().tasks.find(t => t.id === taskId);
    if (!task) return { taskId, segments: [], conflicts: [], success: false, message: '任务不存在' };

    const settings = useSettingsStore.getState().settings;
    const tagGroups = useTagGroupStore.getState().groups;

    const result = scheduleTask(
      {
        tasks: get().tasks,
        tagGroups,
        settings,
        holidays: null,
        windowStart: task.startTime,
        windowEnd: task.endTime,
      },
      task
    );

    if (result.success) {
      // 保存段到 IndexedDB
      for (const seg of result.segments) {
        await saveSegment(seg);
      }
      const updatedTask = { ...task, segments: result.segments, status: 'scheduled' as const };
      await saveTask(updatedTask);
      set(state => ({
        tasks: state.tasks.map(t => t.id === taskId ? updatedTask : t),
      }));
    }

    return result;
  },

  scheduleAll: async () => {
    const settings = useSettingsStore.getState().settings;
    const tagGroups = useTagGroupStore.getState().groups;

    const results = batchSchedule({
      tasks: get().tasks,
      tagGroups,
      settings,
      holidays: null,
      windowStart: get().tasks[0]?.startTime || '',
      windowEnd: get().tasks[0]?.endTime || '',
    });

    // 批量保存
    const updatedTasks = new Map<string, Task>();
    for (const result of results) {
      if (result.success) {
        for (const seg of result.segments) {
          await saveSegment(seg);
        }
        const task = get().tasks.find(t => t.id === result.taskId);
        if (task) {
          updatedTasks.set(result.taskId, {
            ...task,
            segments: result.segments,
            status: 'scheduled' as const,
          });
        }
      }
    }

    for (const [, task] of updatedTasks) {
      await saveTask(task);
    }

    set(state => ({
      tasks: state.tasks.map(t => updatedTasks.get(t.id) || t),
    }));

    return results;
  },

  reschedule: async (taskId) => {
    // 简单包装 scheduleTask 为 reschedule
    return get().schedule(taskId);
  },

  completeSegment: async (segId) => {
    const task = get().tasks.find(t => t.segments.some(s => s.id === segId));
    if (!task) return;

    const updatedSegs = task.segments.map(s =>
      s.id === segId ? { ...s, isCompleted: true } : s
    );
    const seg = updatedSegs.find(s => s.id === segId);
    if (seg) await saveSegment(seg);

    const allDone = updatedSegs.every(s => s.isCompleted);
    const updatedTask: Task = {
      ...task,
      segments: updatedSegs,
      status: allDone ? 'completed' : 'scheduled',
    };
    await saveTask(updatedTask);

    set(state => ({
      tasks: state.tasks.map(t => t.id === task.id ? updatedTask : t),
    }));
  },

  uncompleteSegment: async (segId) => {
    const task = get().tasks.find(t => t.segments.some(s => s.id === segId));
    if (!task) return;

    const updatedSegs = task.segments.map(s =>
      s.id === segId ? { ...s, isCompleted: false } : s
    );
    const seg = updatedSegs.find(s => s.id === segId);
    if (seg) await saveSegment(seg);

    const updatedTask: Task = { ...task, segments: updatedSegs, status: 'scheduled' };
    await saveTask(updatedTask);

    set(state => ({
      tasks: state.tasks.map(t => t.id === task.id ? updatedTask : t),
    }));
  },
}));
