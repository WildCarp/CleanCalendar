// ============================================================
// CleanCalendar — 核心类型定义
// 与规划书 §2 完全对应
// ============================================================

// ---- 标签组 ----
export interface TagGroup {
  id: string;              // UUID
  name: string;
  color: string;           // HEX
  emoji: string;
  isWork: boolean;
  isDefault: boolean;
  createdAt: number;       // timestamp
  sortOrder: number;
}

// ---- 任务 ----
export type TaskStatus = 'unscheduled' | 'scheduled' | 'completed';

export interface TaskSegment {
  id: string;
  taskId: string;
  startTime: string;       // ISO 8601 "YYYY-MM-DDTHH:mm"
  endTime: string;
  index: number;
  totalSegments: number;
  isCompleted: boolean;
  isManuallyPlaced: boolean;
}

export interface Task {
  id: string;
  tagGroupId: string;
  name: string;
  startTime: string;
  endTime: string;
  importance: number;      // 1-5
  urgency: number;         // 1-5
  duration: number;        // 分钟
  canFragment: boolean;
  canAffectOthers: boolean;
  status: TaskStatus;
  segments: TaskSegment[];
  createdAt: number;
}

// ---- 设置 ----
export interface Settings {
  workStartTime: string;        // "10:30"
  workEndTime: string;          // "20:30"
  lunchStart: string;           // "12:00"
  lunchEnd: string;             // "14:00"
  dinnerStart: string;          // "18:00"
  dinnerEnd: string;            // "19:00"
  restStart: string;            // "23:00"
  restEnd: string;              // "08:00"
  urgencyImportanceRatio: number; // 0-1, default 0.5

  dayStartHour: number;         // 0
  axisSwapped: boolean;         // false (横轴时间/竖轴日期)
  darkMode: boolean;            // false (默认亮色)
  taskOpacity: number;          // 0.8
  timeGranularity: number;      // 15
  displayDays: number;          // 7
}

export const DEFAULT_SETTINGS: Settings = {
  workStartTime: '10:30',
  workEndTime: '20:30',
  lunchStart: '12:00',
  lunchEnd: '14:00',
  dinnerStart: '18:00',
  dinnerEnd: '19:00',
  restStart: '23:00',
  restEnd: '08:00',
  urgencyImportanceRatio: 0.5,
  dayStartHour: 0,
  axisSwapped: false,
  darkMode: false,
  taskOpacity: 0.8,
  timeGranularity: 15,
  displayDays: 7,
};

// ---- 节假日缓存 ----
export interface HolidayCache {
  year: number;
  data: HolidayData;
  updatedAt: number;
}

export interface HolidayData {
  holidays: string[];           // "YYYY-MM-DD" format
  workdays: string[];           // 调休工作日
}

// ---- 导入/导出 ----
export interface ExportData {
  version: number;
  exportedAt: string;
  tagGroups: TagGroup[];
  tasks: Task[];
  segments: TaskSegment[];
  settings: Record<string, unknown>;
}

// ---- 排程结果 ----
export interface ScheduleResult {
  taskId: string;
  segments: TaskSegment[];
  conflicts: string[];          // 被挤走任务的 ID
  success: boolean;
  message: string;
}

// ---- 排程输入 ----
export interface ScheduleInput {
  tasks: Task[];
  tagGroups: TagGroup[];
  settings: Settings;
  holidays: HolidayData | null;
  windowStart: string;          // ISO 8601
  windowEnd: string;
}

// ---- 时间槽 ----
export interface TimeSlot {
  start: string;                // ISO 8601
  end: string;
  isAvailable: boolean;
}

// ---- 响应式断点 ----
export type Breakpoint = 'desktop' | 'tablet' | 'mobile';
