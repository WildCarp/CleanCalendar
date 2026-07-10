import type { Task, TaskSegment, Settings, HolidayCache, ScheduleResult } from '../types';
import { rankTasks } from './scoring';
import { generateId } from './id';
import { parseDate, formatDateTime, timeToMinutes, setTime, addDays, addMinutes, getDayMinutes, diffMinutes, dateKey, today, isSameDay } from './time';
import { isWorkday } from './holidays';

/**
 * 核心排程算法
 * 为指定任务列表安排到时间窗口内的空闲时间段
 *
 * @param tasks - 待安排的任务列表
 * @param settings - 用户设置
 * @param windowStart - 时间窗口起始日期
 * @param windowEnd - 时间窗口结束日期
 * @param existingTasks - 已占用的任务列表（含段）
 * @param holidayCache - 节假日缓存
 * @returns 调度结果列表
 */
export function scheduleTasks(
  tasks: Task[],
  settings: Settings,
  windowStart: Date,
  windowEnd: Date,
  existingTasks: Task[],
  holidayCache: HolidayCache | null,
  tagGroupIsWorkMap: Map<string, boolean>,
): ScheduleResult[] {
  const results: ScheduleResult[] = [];

  // 按评分排序
  const ranked = rankTasks(tasks, settings);

  // 收集所有已占用的时间段
  const occupied = collectOccupiedSlots(existingTasks);

  // 逐一安排任务
  for (const task of ranked) {
    const result = scheduleOneTask(task, settings, windowStart, windowEnd, occupied, holidayCache, tagGroupIsWorkMap);
    results.push(result);

    // 将新安排的段加入占用列表
    if (result.success) {
      for (const seg of result.segments) {
        addOccupiedSlot(occupied, seg.startTime, seg.endTime);
      }
    }
  }

  return results;
}

/**
 * 单个任务的重排
 */
export function rescheduleTask(
  task: Task,
  settings: Settings,
  windowStart: Date,
  windowEnd: Date,
  existingTasks: Task[],
  holidayCache: HolidayCache | null,
  tagGroupIsWorkMap: Map<string, boolean>,
): { newSegments: TaskSegment[]; displacedTasks: Task[] } {
  // 移除当前任务的段
  const others = existingTasks.filter(t => t.id !== task.id);
  const occupied = collectOccupiedSlots(others);

  const result = scheduleOneTask(task, settings, windowStart, windowEnd, occupied, holidayCache, tagGroupIsWorkMap);

  if (!result.success) {
    return { newSegments: [], displacedTasks: [] };
  }

  // 检查新安排是否与已有任务冲突，找出被挤走的任务
  const displacedTasks: Task[] = [];
  for (const seg of result.segments) {
    for (const t of others) {
      for (const s of t.segments) {
        if (s.isCompleted) continue;
        if (isOverlapping(seg.startTime, seg.endTime, s.startTime, s.endTime)) {
          if (!displacedTasks.find(dt => dt.id === t.id)) {
            displacedTasks.push(t);
          }
        }
      }
    }
  }

  return { newSegments: result.segments, displacedTasks };
}

/**
 * 安排单个任务
 */
function scheduleOneTask(
  task: Task,
  settings: Settings,
  windowStart: Date,
  windowEnd: Date,
  occupiedSlots: OccupiedSlot[],
  holidayCache: HolidayCache | null,
  tagGroupIsWorkMap: Map<string, boolean>,
): ScheduleResult {
  const totalDuration = task.duration;
  const granularity = settings.timeGranularity;
  // canFragment=false 时只能安排为一个完整段
  const maxSegments = task.canFragment ? Infinity : 1;

  // 获取窗口内所有可用时间段
  const availableBlocks = findAvailableBlocks(
    task, settings, windowStart, windowEnd, occupiedSlots, holidayCache, granularity, tagGroupIsWorkMap,
  );

  if (availableBlocks.length === 0) {
    return {
      taskId: task.id,
      success: false,
      segments: [],
      displacedTaskIds: [],
      message: `${task.name} 当前已安排不下`,
    };
  }

  // 尝试将任务放入可用时间段
  const segments = allocateSegments(task, availableBlocks, totalDuration, granularity, maxSegments);

  if (segments.length === 0 || !segments.every(s => s.endTime > s.startTime)) {
    return {
      taskId: task.id,
      success: false,
      segments: [],
      displacedTaskIds: [],
      message: `${task.name} 当前已安排不下`,
    };
  }

  // 计算被挤走的任务（仅当 canAffectOthers 为 true 的任务可以被挤走）
  const displacedTaskIds: string[] = [];

  return {
    taskId: task.id,
    success: true,
    segments,
    displacedTaskIds,
    message: `${task.name} 已安排`,
  };
}

/**
 * 碎片化分配任务到可用时间段
 * 每个段的最小长度 = timeGranularity
 */
function allocateSegments(
  task: Task,
  blocks: TimeBlock[],
  totalDuration: number,
  granularity: number,
  maxSegments: number,
): TaskSegment[] {
  const segments: TaskSegment[] = [];
  let remaining = totalDuration;
  let segIndex = 0;

  for (const block of blocks) {
    if (remaining <= 0) break;
    if (segments.length >= maxSegments) break;

    const blockDuration = Math.round(diffMinutes(parseDate(block.start), parseDate(block.end)));
    const allocDuration = Math.min(remaining, blockDuration);

    // 对齐到粒度
    const alignedDuration = Math.floor(allocDuration / granularity) * granularity;
    if (alignedDuration < granularity) continue;

    segIndex++;
    const segStart = parseDate(block.start);
    const segEnd = addMinutes(segStart, alignedDuration);

    segments.push({
      id: generateId(),
      taskId: task.id,
      startTime: formatDateTime(segStart),
      endTime: formatDateTime(segEnd),
      index: segIndex,
      totalSegments: 0, // 后面统一设置
      isCompleted: false,
      isManuallyPlaced: false,
    });

    remaining -= alignedDuration;
  }

  // 更新 totalSegments
  const total = segments.length;
  for (const seg of segments) {
    seg.totalSegments = total;
  }

  return segments;
}

/**
 * 查找可用的时间段
 */
function findAvailableBlocks(
  task: Task,
  settings: Settings,
  windowStart: Date,
  windowEnd: Date,
  occupiedSlots: OccupiedSlot[],
  holidayCache: HolidayCache | null,
  granularity: number,
  tagGroupIsWorkMap: Map<string, boolean>,
): TimeBlock[] {
  const blocks: TimeBlock[] = [];
  const current = new Date(windowStart);

  // 确定此任务的 isWork 标记
  const isWorkTag = tagGroupIsWorkMap.get(task.tagGroupId) ?? false;

  while (current < windowEnd) {
    const dateStr = dateKey(current);

    // 使用精确的时间段（含工作时间/午休/晚饭配置）
    const availablePeriods = getAvailablePeriodsEx(isWorkTag, settings, dateStr, holidayCache);

    for (const period of availablePeriods) {
      const periodStart = setTime(current, ...hoursMinutes(period.start));
      const periodEnd = setTime(current, ...hoursMinutes(period.end));

      const freeBlocks = splitByOccupied(
        formatDateTime(periodStart),
        formatDateTime(periodEnd),
        occupiedSlots,
        granularity,
      );
      blocks.push(...freeBlocks);
    }

    current.setDate(current.getDate() + 1);
  }

  return blocks;
}

/**
 * 获取某天可供任务使用的时间段
 */
function getAvailablePeriods(
  task: Task,
  settings: Settings,
  dateStr: string,
  holidayCache: HolidayCache | null,
): { start: number; end: number }[] {
  const periods: { start: number; end: number }[] = [];

  if (task.tagGroupId === '') {
    // 无标签组：全天可用（排除休息时间）
    periods.push({ start: timeToMinutes('00:00'), end: timeToMinutes(settings.restStart) });
    periods.push({ start: timeToMinutes(settings.restEnd), end: timeToMinutes('24:00') });
    return periods;
  }

  // 工作标签组：仅工作日的工作时间
  // 非工作标签组：全天但排除休息时间

  // 此处简化：检查是否是工作日 + 工作时间
  const isWD = isWorkday(dateStr, holidayCache);

  if (task.tagGroupId && isWD) {
    // 假设从 tagGroup 的 isWork 属性判断
    // 由于在此函数中无法获取 tagGroup，我们使用一个标记
    // 实际使用中由调用者传入
    periods.push({
      start: timeToMinutes('00:00'),
      end: timeToMinutes(settings.restStart),
    });
    periods.push({
      start: timeToMinutes(settings.restEnd),
      end: timeToMinutes('24:00'),
    });
  } else if (!isWD) {
    // 非工作日：只有非工作时间（即全天减去休息）
    periods.push({
      start: timeToMinutes('00:00'),
      end: timeToMinutes(settings.restStart),
    });
    periods.push({
      start: timeToMinutes(settings.restEnd),
      end: timeToMinutes('24:00'),
    });
  }

  return periods;
}

/**
 * 更精确的可用时间段查询（需要 tagGroup 的 isWork 信息）
 */
export function getAvailablePeriodsEx(
  isWorkTag: boolean,
  settings: Settings,
  dateStr: string,
  holidayCache: HolidayCache | null,
): { start: number; end: number }[] {
  const periods: { start: number; end: number }[] = [];
  const isWD = isWorkday(dateStr, holidayCache);

  if (isWorkTag) {
    // 工作标签组：仅工作日的工作时间
    if (!isWD) return []; // 非工作日不可用

    // 工作时间（含午休、晚饭的排除）
    const workStart = timeToMinutes(settings.workStartTime);
    const workEnd = timeToMinutes(settings.workEndTime);
    const lunchStart = timeToMinutes(settings.lunchStart);
    const lunchEnd = timeToMinutes(settings.lunchEnd);
    const dinnerStart = timeToMinutes(settings.dinnerStart);
    const dinnerEnd = timeToMinutes(settings.dinnerEnd);

    periods.push({ start: workStart, end: lunchStart });
    periods.push({ start: lunchEnd, end: dinnerStart });
    periods.push({ start: dinnerEnd, end: workEnd });
  } else {
    // 非工作标签组：全天但排除休息时间
    const restStart = timeToMinutes(settings.restStart);
    const restEnd = timeToMinutes(settings.restEnd);

    periods.push({ start: 0, end: restStart });
    periods.push({ start: restEnd, end: 24 * 60 });
  }

  return periods;
}

// ── 辅助函数 ──

interface OccupiedSlot {
  start: Date;
  end: Date;
}

interface TimeBlock {
  start: string;
  end: string;
}

function collectOccupiedSlots(tasks: Task[]): OccupiedSlot[] {
  const slots: OccupiedSlot[] = [];
  for (const task of tasks) {
    if (task.status === 'completed') continue;
    for (const seg of task.segments) {
      if (seg.isCompleted) continue;
      slots.push({
        start: parseDate(seg.startTime),
        end: parseDate(seg.endTime),
      });
    }
  }
  return slots;
}

function addOccupiedSlot(slots: OccupiedSlot[], startTime: string, endTime: string): void {
  slots.push({
    start: parseDate(startTime),
    end: parseDate(endTime),
  });
}

function splitByOccupied(
  startTime: string,
  endTime: string,
  occupied: OccupiedSlot[],
  minDuration: number,
): TimeBlock[] {
  const blocks: TimeBlock[] = [];
  let current = parseDate(startTime);
  const end = parseDate(endTime);

  // 按开始时间排序占用的时间段
  const sorted = occupied
    .filter(s => s.start < end && s.end > current)
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  for (const slot of sorted) {
    if (slot.start > current) {
      const freeEnd = new Date(Math.min(slot.start.getTime(), end.getTime()));
      const freeStart = new Date(current);
      const dur = diffMinutes(freeStart, freeEnd);
      if (dur >= minDuration) {
        blocks.push({
          start: formatDateTime(freeStart),
          end: formatDateTime(freeEnd),
        });
      }
    }
    if (slot.end > current) {
      current = new Date(Math.max(current.getTime(), slot.end.getTime()));
    }
  }

  // 最后一个空闲块
  if (current < end) {
    const dur = diffMinutes(current, end);
    if (dur >= minDuration) {
      blocks.push({
        start: formatDateTime(current),
        end: formatDateTime(end),
      });
    }
  }

  return blocks;
}

function isOverlapping(s1: string, e1: string, s2: string, e2: string): boolean {
  return s1 < e2 && s2 < e1;
}

function hoursMinutes(minutes: number): [number, number] {
  return [Math.floor(minutes / 60), minutes % 60];
}
