import { db } from './db';
import type { ExportData, TagGroup, Task, TaskSegment } from '../types';

const CURRENT_VERSION = 1;

/**
 * 导出全部数据为 JSON 文件
 */
export async function exportData(): Promise<void> {
  const tagGroups = await db.tagGroups.toArray();
  const rawTasks = await db.tasks.toArray();
  const segments = await db.segments.toArray();
  const settingsArr = await db.settings.toArray();
  const settings: Record<string, unknown> = {};
  for (const s of settingsArr) {
    settings[s.key] = s.value;
  }

  // 清理 tasks 中的 segments 字段（segments 将单独存储）
  const tasks = rawTasks.map(t => ({
    ...t,
    segments: [],
  }));

  const data: ExportData = {
    version: CURRENT_VERSION,
    exportedAt: new Date().toISOString(),
    tagGroups,
    tasks,
    segments,
    settings,
  };

  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  const dateStr = new Date().toISOString().split('T')[0];
  a.href = url;
  a.download = `CleanCalendar_backup_${dateStr}.json`;
  a.click();

  URL.revokeObjectURL(url);
}

/**
 * 从 JSON 文件导入数据（清空覆盖）
 */
export async function importData(file: File): Promise<{
  tagGroupCount: number;
  taskCount: number;
  segmentCount: number;
}> {
  const text = await file.text();
  const data: ExportData = JSON.parse(text);

  // 校验基本格式
  if (!data.version || !Array.isArray(data.tagGroups) || !Array.isArray(data.tasks)) {
    throw new Error('无效的备份文件格式');
  }

  // 清空现有数据
  await db.transaction('rw', db.tagGroups, db.tasks, db.segments, db.settings, async () => {
    await db.tagGroups.clear();
    await db.tasks.clear();
    await db.segments.clear();
    await db.settings.clear();

    // 导入标签组
    for (const tg of data.tagGroups) {
      await db.tagGroups.put(tg as TagGroup);
    }

    // 导入段
    for (const seg of data.segments) {
      await db.segments.put(seg as TaskSegment);
    }

    // 导入任务（attach segments）
    for (const task of data.tasks) {
      const taskSegments = data.segments.filter(s => (s as TaskSegment).taskId === task.id);
      await db.tasks.put({
        ...task,
        segments: taskSegments,
      } as Task);
    }

    // 导入设置
    if (data.settings) {
      for (const [key, value] of Object.entries(data.settings)) {
        await db.settings.where('key').equals(key).delete();
        await db.settings.put({ key, value });
      }
    }
  });

  return {
    tagGroupCount: data.tagGroups.length,
    taskCount: data.tasks.length,
    segmentCount: data.segments.length,
  };
}

/**
 * 移除 undefined 值（IndexedDB 序列化兼容）
 */
function stripUndefined<T extends Record<string, unknown>>(obj: T): T {
  const result = { ...obj };
  for (const key of Object.keys(result)) {
    if (result[key] === undefined) {
      delete result[key];
    }
  }
  return result;
}
