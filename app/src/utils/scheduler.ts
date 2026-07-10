// ============================================================
// CleanCalendar — 核心排程算法
// 从原 Rust 版移植到 TypeScript
// 参考规划书 §3
// ============================================================

import dayjs from 'dayjs';
import type { Task, TagGroup, Settings, HolidayData, ScheduleResult, ScheduleInput, TaskSegment } from '../types';
import { generateId } from './id';
import { formatDatetime, parseDatetime, timeToMinutes, dateRange } from './time';

// ============================================================
// 1. 优先级评分
// ============================================================

/**
 * Score(task) = W_urgency × UrgencyFactor(task) + W_importance × ImportanceFactor(task)
 */
export function scoreTask(
  task: Task,
  urgencyWeight: number,
  importanceWeight: number,
  referenceTime?: string
): number {
  const timeDecay = computeTimeDecay(task, referenceTime);
  const urgencyFactor = task.urgency * timeDecay;
  const importanceFactor = task.importance;

  return urgencyWeight * urgencyFactor + importanceWeight * importanceFactor;
}

/**
 * NormalizedScore = Score(task) / MaxPossibleScore × 100
 */
export function normalizedScore(
  task: Task,
  urgencyWeight: number,
  importanceWeight: number,
  referenceTime?: string
): number {
  const raw = scoreTask(task, urgencyWeight, importanceWeight, referenceTime);
  const maxWeight = Math.max(urgencyWeight, importanceWeight);
  const maxPossible = maxWeight * 5 * 3; // max urgency * 5 * max decay 3
  return (raw / maxPossible) * 100;
}

/**
 * 时间衰减乘数
 * TimeDecayMultiplier = 1 + 2 × progress²
 */
function computeTimeDecay(task: Task, referenceTime?: string): number {
  const now = referenceTime ? parseDatetime(referenceTime) : dayjs();
  const taskStart = parseDatetime(task.startTime);
  const taskEnd = parseDatetime(task.endTime);

  const effectiveNow = now.isAfter(taskStart) ? now : taskStart;
  const remainingHours = taskEnd.diff(effectiveNow, 'hour', true);
  const totalHours = taskEnd.diff(taskStart, 'hour', true);

  if (totalHours <= 0) return 1.0;

  let progress = 1 - remainingHours / totalHours;
  progress = Math.max(0, Math.min(1, progress));

  return 1 + 2 * progress * progress;
}

// ============================================================
// 2. 时间可用性规则
// ============================================================

interface TimeAvailabilityInput {
  task: Task;
  tagGroup: TagGroup;
  settings: Settings;
  holidays: HolidayData | null;
  dateStr: string; // "YYYY-MM-DD"
}

/**
 * 检查某个时间段是否可用于指定任务
 */
export function isTimeAvailable(input: TimeAvailabilityInput): boolean {
  const { task, tagGroup, settings, holidays, dateStr } = input;
  const startMinutes = timeToMinutes(task.startTime.substring(11, 16));
  const endMinutes = timeToMinutes(task.endTime.substring(11, 16));

  // 1. 检查是否为工作日
  const isWorkday = checkIsWorkday(dateStr, holidays);

  // 2. 工作标签组仅在工作和日中可用 工作日的工作时间
  if (tagGroup.isWork) {
    if (!isWorkday) return false;

    const workStart = timeToMinutes(settings.workStartTime);
    const workEnd = timeToMinutes(settings.workEndTime);
    const lunchStart = timeToMinutes(settings.lunchStart);
    const lunchEnd = timeToMinutes(settings.lunchEnd);
    const dinnerStart = timeToMinutes(settings.dinnerStart);
    const dinnerEnd = timeToMinutes(settings.dinnerEnd);

    // 整体时间必须在上班时间内
    if (startMinutes < workStart || endMinutes > workEnd) return false;

    // 检查与午休/晚饭重叠
    if (overlaps(startMinutes, endMinutes, lunchStart, lunchEnd)) return false;
    if (overlaps(startMinutes, endMinutes, dinnerStart, dinnerEnd)) return false;
  }

  // 3. 所有标签组受休息时间限制
  const restStart = timeToMinutes(settings.restStart);
  const restEnd = timeToMinutes(settings.restEnd);

  if (restStart >= restEnd) {
    // 跨午夜：如 23:00-08:00
    if (startMinutes >= restStart || endMinutes <= restEnd) return false;
  } else {
    // 同一天内
    if (overlaps(startMinutes, endMinutes, restStart, restEnd)) return false;
  }

  return true;
}

function overlaps(a1: number, a2: number, b1: number, b2: number): boolean {
  return a1 < b2 && a2 > b1;
}

function checkIsWorkday(dateStr: string, holidays: HolidayData | null): boolean {
  if (!holidays) {
    // 无数据时默认周一至周五为工作日
    const day = dayjs(dateStr).day();
    return day >= 1 && day <= 5;
  }

  // 调休工作日优先
  if (holidays.workdays.includes(dateStr)) return true;

  // 节假日 = 非工作日
  if (holidays.holidays.includes(dateStr)) return false;

  // 否则周一至周五默认工作日
  const day = dayjs(dateStr).day();
  return day >= 1 && day <= 5;
}

// ============================================================
// 3. 碎片化支持
// ============================================================

export function shouldAllowFragment(
  task: Task,
  currentFragmentCount: number,
  isRealSplit: boolean
): boolean {
  // 只有真实的任务打断才算拆分（午休/晚饭/跨天不算）
  if (!isRealSplit) return true;

  if (task.canFragment) return true;

  // 不可碎片化：最多 2 次真正拆分 = 最多 3 个段
  return currentFragmentCount < 2;
}

// ============================================================
// 4. 时间窗口构建
// ============================================================

interface TimeChunk {
  start: string; // ISO
  end: string;
  date: string;  // "YYYY-MM-DD"
}

/**
 * 为指定任务构建可用的时间窗口列表
 */
export function buildAvailableSlots(
  task: Task,
  tagGroup: TagGroup,
  settings: Settings,
  holidays: HolidayData | null,
  windowStart: string,
  windowEnd: string
): TimeChunk[] {
  const slots: TimeChunk[] = [];
  const granularity = settings.timeGranularity;
  const dates = dateRange(windowStart.substring(0, 10), windowEnd.substring(0, 10));

  for (const dateStr of dates) {
    const dayStart = settings.dayStartHour * 60;
    const dayEnd = 24 * 60;

    for (let t = dayStart; t < dayEnd; t += granularity) {
      const startTime = `${dateStr}T${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
      const endTimeVal = t + granularity;
      const endTimeDate = endTimeVal >= dayEnd ? dateStr : dateStr;
      const endTimeStr = `${endTimeDate}T${String(Math.floor((endTimeVal % (24 * 60)) / 60)).padStart(2, '0')}:${String((endTimeVal % (24 * 60)) % 60).padStart(2, '0')}`;

      const testTask = { ...task, startTime, endTime: endTimeStr };

      if (isTimeAvailable({ task: testTask, tagGroup, settings, holidays, dateStr })) {
        slots.push({ start: startTime, end: endTimeStr, date: dateStr });
      }
    }
  }

  return slots;
}

// ============================================================
// 5. 排程主函数
// ============================================================

export function scheduleTask(
  input: ScheduleInput,
  task: Task
): ScheduleResult {
  const urgencyWeight = 1 - input.settings.urgencyImportanceRatio;
  const importanceWeight = input.settings.urgencyImportanceRatio;

  const tagGroup = input.tagGroups.find(g => g.id === task.tagGroupId);
  if (!tagGroup) {
    return { taskId: task.id, segments: [], conflicts: [], success: false, message: '标签组不存在' };
  }

  const timeGranularity = input.settings.timeGranularity;
  const slotsNeeded = Math.ceil(task.duration / timeGranularity);

  // 1. 构建可用槽位
  const availableSlots = buildAvailableSlots(
    task,
    tagGroup,
    input.settings,
    input.holidays,
    input.windowStart,
    input.windowEnd
  );

  if (availableSlots.length < slotsNeeded) {
    return {
      taskId: task.id,
      segments: [],
      conflicts: [],
      success: false,
      message: `${task.name} 当前窗口内空间不足（需要 ${slotsNeeded} 个槽位，仅剩 ${availableSlots.length} 个）`,
    };
  }

  // 2. 过滤已被其他任务占用的槽位
  const occupiedSlots = new Set<string>();
  for (const t of input.tasks) {
    if (t.id === task.id) continue;
    for (const seg of t.segments) {
      occupiedSlots.add(seg.startTime);
    }
  }
  const freeSlots = availableSlots.filter(s => !occupiedSlots.has(s.start));

  // 3. 选择连续的 slotsNeeded 个槽位
  const selectedSegments: TaskSegment[] = [];
  let consecutiveStart = 0;

  for (let i = 0; i < freeSlots.length && selectedSegments.length < slotsNeeded; i++) {
    if (consecutiveStart === i - selectedSegments.length) {
      // 可以接在已选区段后面
      selectedSegments.push({
        id: generateId(),
        taskId: task.id,
        startTime: freeSlots[i].start,
        endTime: freeSlots[i].end,
        index: selectedSegments.length + 1,
        totalSegments: slotsNeeded,
        isCompleted: false,
        isManuallyPlaced: false,
      });
    } else {
      // 断开了，需要重新开始
      // 不可碎片化检查
      if (!task.canFragment && selectedSegments.length > 0) {
        // 已有段但需要新拆分，对于不可碎片化任务直接失败
        break;
      }
      consecutiveStart = i;
      selectedSegments.length = 0;
      selectedSegments.push({
        id: generateId(),
        taskId: task.id,
        startTime: freeSlots[i].start,
        endTime: freeSlots[i].end,
        index: 1,
        totalSegments: slotsNeeded,
        isCompleted: false,
        isManuallyPlaced: false,
      });
    }
  }

  // 更新 segment 序号和总数
  const actualTotal = selectedSegments.length;
  for (let i = 0; i < selectedSegments.length; i++) {
    selectedSegments[i].index = i + 1;
    selectedSegments[i].totalSegments = actualTotal;
  }

  if (selectedSegments.length < slotsNeeded) {
    return {
      taskId: task.id,
      segments: selectedSegments,
      conflicts: [],
      success: false,
      message: `${task.name} 只能安排 ${selectedSegments.length}/${slotsNeeded} 个槽位`,
    };
  }

  return {
    taskId: task.id,
    segments: selectedSegments,
    conflicts: [],
    success: true,
    message: `${task.name} 已安排`,
  };
}

// ============================================================
// 6. 批量排程
// ============================================================

export function batchSchedule(input: ScheduleInput): ScheduleResult[] {
  const results: ScheduleResult[] = [];
  const urgencyWeight = 1 - input.settings.urgencyImportanceRatio;
  const importanceWeight = input.settings.urgencyImportanceRatio;

  // 按归一化评分降序排列
  const scored = input.tasks
    .filter(t => t.status === 'unscheduled' || t.status === 'scheduled')
    .map(t => ({
      task: t,
      score: normalizedScore(t, urgencyWeight, importanceWeight),
    }))
    .sort((a, b) => b.score - a.score);

  // 依次安排每个任务
  const scheduledInThisRun = new Map<string, TaskSegment[]>();
  const modifiedInput = { ...input, tasks: input.tasks.map(t => ({ ...t })) };

  for (const { task } of scored) {
    const result = scheduleTask(modifiedInput, task);
    results.push(result);

    if (result.success && result.segments.length > 0) {
      scheduledInThisRun.set(task.id, result.segments);
      // 更新 modifiedInput 中的任务（影响后续排程）
      const idx = modifiedInput.tasks.findIndex(t => t.id === task.id);
      if (idx >= 0) {
        modifiedInput.tasks[idx] = { ...modifiedInput.tasks[idx], segments: result.segments };
      }
    }
  }

  // 检查冲突：重排是否挤走了低优先级任务
  for (const result of results) {
    if (!result.success && result.segments.length > 0) continue;
  }

  return results;
}

// ============================================================
// 7. 重新安排（单一任务在窗口中重新找位置）
// ============================================================

export function rescheduleTask(
  input: ScheduleInput,
  taskId: string
): ScheduleResult {
  const task = input.tasks.find(t => t.id === taskId);
  if (!task) {
    return { taskId, segments: [], conflicts: [], success: false, message: '任务不存在' };
  }

  // 尝试紧凑安排（不挤走其他任务）
  const result = scheduleTask(input, task);
  if (result.success) return result;

  // 如果可以影响其他任务，尝试挤走低分任务
  if (task.canAffectOthers) {
    const urgencyWeight = 1 - input.settings.urgencyImportanceRatio;
    const importanceWeight = input.settings.urgencyImportanceRatio;
    const taskScore = normalizedScore(task, urgencyWeight, importanceWeight);

    // 找出所有可以被挤走的低分任务
    const displaceable = input.tasks
      .filter(t => t.id !== taskId && t.status === 'scheduled' &&
        normalizedScore(t, urgencyWeight, importanceWeight) < taskScore)
      .sort((a, b) =>
        normalizedScore(a, urgencyWeight, importanceWeight) -
        normalizedScore(b, urgencyWeight, importanceWeight)
      );

    const displaced: string[] = [];

    // 逐步清除低分任务的已安排段，直到目标任务能排下
    const clearedInput = { ...input, tasks: input.tasks.map(t => ({ ...t })) };
    for (const dt of displaceable) {
      const idx = clearedInput.tasks.findIndex(t => t.id === dt.id);
      if (idx >= 0) {
        clearedInput.tasks[idx] = { ...clearedInput.tasks[idx], segments: [], status: 'unscheduled' as const };
        displaced.push(dt.id);
      }
      const retry = scheduleTask(clearedInput, task);
      if (retry.success) {
        retry.conflicts = displaced;
        return retry;
      }
    }

    return {
      taskId,
      segments: result.segments,
      conflicts: displaced,
      success: false,
      message: `${task.name} 即使挤走低分任务也无法安排`,
    };
  }

  return result;
}
