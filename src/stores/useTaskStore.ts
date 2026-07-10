import { create } from 'zustand';
import { db } from '../utils/db';
import { generateId } from '../utils/id';
import { formatDateTime } from '../utils/time';
import type { Task, TaskSegment, TaskStatus } from '../types';

interface TaskStore {
  tasks: Task[];
  selectedTaskId: string | null;
  loading: boolean;

  load: () => Promise<void>;
  create: (data: Partial<Task> & { name: string }) => Promise<Task>;
  update: (id: string, data: Partial<Task>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  select: (id: string | null) => void;
  updateStatus: (id: string, status: TaskStatus) => Promise<void>;
  addSegment: (taskId: string, startTime: string, endTime: string, index: number, total: number) => Promise<TaskSegment>;
  updateSegment: (segId: string, data: Partial<TaskSegment>) => Promise<void>;
  completeSegment: (segId: string) => Promise<void>;
  uncompleteSegment: (segId: string) => Promise<void>;
  removeSegment: (segId: string) => Promise<void>;
  removeAllSegments: (taskId: string) => Promise<void>;
  getTasksByStatus: (status: TaskStatus) => Task[];
  getTasksByTagGroup: (tagGroupId: string) => Task[];
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  selectedTaskId: null,
  loading: true,

  load: async () => {
    const rawTasks = await db.tasks.toArray();
    // 为每个 task 加载其 segments
    const tasks: Task[] = [];
    for (const t of rawTasks) {
      const segments = await db.segments.where('taskId').equals(t.id).toArray();
      tasks.push({ ...t, segments });
    }
    set({ tasks, loading: false });
  },

  create: async (data) => {
    const now = Date.now();
    const newTask: Task = {
      id: generateId(),
      tagGroupId: data.tagGroupId || '',
      name: data.name,
      startTime: data.startTime || formatDateTime(new Date()),
      endTime: data.endTime || formatDateTime(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
      importance: data.importance ?? 3,
      urgency: data.urgency ?? 3,
      duration: data.duration ?? 60,
      canFragment: data.canFragment ?? true,
      canAffectOthers: data.canAffectOthers ?? true,
      status: data.status || 'unscheduled',
      segments: [],
      createdAt: now,
    };
    await db.tasks.put(newTask);
    set({ tasks: [...get().tasks, newTask] });
    return newTask;
  },

  update: async (id, data) => {
    const tasks = get().tasks.map(t => {
      if (t.id === id) {
        const updated = { ...t, ...data };
        db.tasks.put(updated);
        return updated;
      }
      return t;
    });
    set({ tasks });
  },

  remove: async (id) => {
    await db.segments.where('taskId').equals(id).delete();
    await db.tasks.delete(id);
    set({
      tasks: get().tasks.filter(t => t.id !== id),
      selectedTaskId: get().selectedTaskId === id ? null : get().selectedTaskId,
    });
  },

  select: (id) => set({ selectedTaskId: id }),

  updateStatus: async (id, status) => {
    const task = get().tasks.find(t => t.id === id);
    if (!task) return;
    const updated = { ...task, status };
    await db.tasks.put(updated);
    set({
      tasks: get().tasks.map(t => (t.id === id ? updated : t)),
    });
  },

  addSegment: async (taskId, startTime, endTime, index, total) => {
    const seg: TaskSegment = {
      id: generateId(),
      taskId,
      startTime,
      endTime,
      index,
      totalSegments: total,
      isCompleted: false,
      isManuallyPlaced: false,
    };
    await db.segments.put(seg);

    const tasks = get().tasks.map(t => {
      if (t.id === taskId) {
        const updated = { ...t, segments: [...t.segments, seg] };
        return updated;
      }
      return t;
    });
    set({ tasks });
    return seg;
  },

  updateSegment: async (segId, data) => {
    const tasks = get().tasks.map(t => {
      const updatedSegs = t.segments.map(s =>
        s.id === segId ? { ...s, ...data } : s,
      );
      return { ...t, segments: updatedSegs };
    });

    const seg = tasks.flatMap(t => t.segments).find(s => s.id === segId);
    if (seg) {
      await db.segments.put(seg);
    }
    set({ tasks });
  },

  completeSegment: async (segId) => {
    const tasks = get().tasks.map(t => {
      const updatedSegs = t.segments.map(s =>
        s.id === segId ? { ...s, isCompleted: true } : s,
      );
      return { ...t, segments: updatedSegs };
    });
    const seg = tasks.flatMap(t => t.segments).find(s => s.id === segId);
    if (seg) {
      await db.segments.put(seg);
    }

    // 如果所有段都完成，更新任务状态
    for (const task of tasks) {
      const allCompleted = task.segments.length > 0 && task.segments.every(s => s.isCompleted);
      if (allCompleted && task.status !== 'completed') {
        task.status = 'completed';
        await db.tasks.put(task);
      }
    }

    set({ tasks });
  },

  uncompleteSegment: async (segId) => {
    const tasks = get().tasks.map(t => {
      const updatedSegs = t.segments.map(s =>
        s.id === segId ? { ...s, isCompleted: false } : s,
      );
      const wasCompleted = t.status === 'completed';
      const updated = { ...t, segments: updatedSegs, status: wasCompleted ? 'scheduled' as TaskStatus : t.status };
      return updated;
    });
    const seg = tasks.flatMap(t => t.segments).find(s => s.id === segId);
    if (seg) {
      await db.segments.put(seg);
    }

    // 恢复任务状态
    for (const task of tasks) {
      if (task.status === 'scheduled' && get().tasks.find(t => t.id === task.id)?.status === 'completed') {
        await db.tasks.put(task);
      }
    }

    set({ tasks });
  },

  removeSegment: async (segId) => {
    await db.segments.delete(segId);
    set({
      tasks: get().tasks.map(t => ({
        ...t,
        segments: t.segments.filter(s => s.id !== segId),
      })),
    });
  },

  removeAllSegments: async (taskId) => {
    await db.segments.where('taskId').equals(taskId).delete();
    set({
      tasks: get().tasks.map(t =>
        t.id === taskId ? { ...t, segments: [], status: 'unscheduled' as TaskStatus } : t,
      ),
    });
  },

  getTasksByStatus: (status) => get().tasks.filter(t => t.status === status),

  getTasksByTagGroup: (tagGroupId) => get().tasks.filter(t => t.tagGroupId === tagGroupId),
}));
