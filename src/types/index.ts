// ── 标签组 ──
export interface TagGroup {
  id: string;
  name: string;
  color: string;
  emoji: string;
  isWork: boolean;
  isDefault: boolean;
  createdAt: number;
  sortOrder: number;
}

// ── 任务状态 ──
export type TaskStatus = 'unscheduled' | 'scheduled' | 'completed';

// ── 任务段 ──
export interface TaskSegment {
  id: string;
  taskId: string;
  startTime: string;
  endTime: string;
  index: number;
  totalSegments: number;
  isCompleted: boolean;
  isManuallyPlaced: boolean;
}

// ── 任务 ──
export interface Task {
  id: string;
  tagGroupId: string;
  name: string;
  startTime: string;
  endTime: string;
  importance: number;
  urgency: number;
  duration: number;
  canFragment: boolean;
  canAffectOthers: boolean;
  status: TaskStatus;
  segments: TaskSegment[];
  createdAt: number;
}

// ── 设置 ──
export interface Settings {
  workStartTime: string;
  workEndTime: string;
  lunchStart: string;
  lunchEnd: string;
  dinnerStart: string;
  dinnerEnd: string;
  restStart: string;
  restEnd: string;
  urgencyImportanceRatio: number;
  dayStartHour: number;
  axisSwapped: boolean;
  darkMode: boolean;
  taskOpacity: number;
  timeGranularity: number;
  displayDays: number;
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

// ── 节假日缓存 ──
export interface HolidayCache {
  year: number;
  holidays: Holiday[];
  updatedAt: number;
}

export interface Holiday {
  date: string; // YYYY-MM-DD
  name: string;
  isOffDay: boolean;
}

// ── 日历视图状态 ──
export interface CalendarViewState {
  viewStartDate: string;
  viewEndDate: string;
  scrollTop: number;
  scrollLeft: number;
}

// ── 导出数据格式 ──
export interface ExportData {
  version: number;
  exportedAt: string;
  tagGroups: TagGroup[];
  tasks: Task[];
  segments: TaskSegment[];
  settings: Record<string, unknown>;
}

// ── Toast 通知 ──
export type ToastType = 'success' | 'warning' | 'info' | 'error';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

// ── 调度结果 ──
export interface ScheduleResult {
  taskId: string;
  success: boolean;
  segments: TaskSegment[];
  displacedTaskIds: string[];
  message: string;
}
