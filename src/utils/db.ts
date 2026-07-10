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
