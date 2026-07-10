import Dexie, { type Table } from 'dexie';
import type { TagGroup, Task, TaskSegment, HolidayCache } from '../types';

class CleanCalendarDB extends Dexie {
  tagGroups!: Table<TagGroup, string>;
  tasks!: Table<Task, string>;
  segments!: Table<TaskSegment, string>;
  settings!: Table<{ key: string; value: unknown }, string>;
  holidays!: Table<HolidayCache, number>;

  constructor() {
    super('CleanCalendar');
    this.version(1).stores({
      tagGroups: 'id, sortOrder, isDefault',
      tasks: 'id, tagGroupId, status, startTime, endTime',
      segments: 'id, taskId, startTime, endTime',
      settings: 'key',
      holidays: 'year',
    });
  }
}

export const db = new CleanCalendarDB();

// ---- 标签组 CRUD ----
export async function getAllTagGroups(): Promise<TagGroup[]> {
  return db.tagGroups.orderBy('sortOrder').toArray();
}

export async function saveTagGroup(group: TagGroup): Promise<void> {
  await db.tagGroups.put(group);
}

export async function deleteTagGroup(id: string): Promise<void> {
  await db.tagGroups.delete(id);
}

// ---- 任务 CRUD ----
export async function getAllTasks(): Promise<Task[]> {
  return db.tasks.toArray();
}

export async function getTasksByStatus(status: string): Promise<Task[]> {
  return db.tasks.where('status').equals(status).toArray();
}

export async function saveTask(task: Task): Promise<void> {
  await db.tasks.put(task);
}

export async function deleteTask(id: string): Promise<void> {
  await db.tasks.delete(id);
  // 级联删除关联段
  await db.segments.where('taskId').equals(id).delete();
}

// ---- 段 CRUD ----
export async function getSegmentsByTask(taskId: string): Promise<TaskSegment[]> {
  return db.segments.where('taskId').equals(taskId).toArray();
}

export async function saveSegment(seg: TaskSegment): Promise<void> {
  await db.segments.put(seg);
}

export async function deleteSegment(id: string): Promise<void> {
  await db.segments.delete(id);
}

// ---- 设置 ----
export async function getSettings(): Promise<Record<string, unknown>> {
  const all = await db.settings.toArray();
  const result: Record<string, unknown> = {};
  for (const item of all) {
    result[item.key] = item.value;
  }
  return result;
}

export async function saveSetting(key: string, value: unknown): Promise<void> {
  await db.settings.put({ key, value });
}

export async function saveSettingsBatch(settings: Record<string, unknown>): Promise<void> {
  const entries = Object.entries(settings).map(([key, value]) => ({ key, value }));
  await db.settings.bulkPut(entries);
}

// ---- 节假日 ----
export async function getHolidayCache(year: number): Promise<HolidayCache | undefined> {
  return db.holidays.get(year);
}

export async function saveHolidayCache(cache: HolidayCache): Promise<void> {
  await db.holidays.put(cache);
}
