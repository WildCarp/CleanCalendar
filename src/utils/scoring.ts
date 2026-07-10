import type { Task, Settings } from '../types';
import { parseDate } from './time';

/**
 * 计算任务优先级评分
 *
 * Score(task) = W_urgency × UrgencyFactor(task) + W_importance × ImportanceFactor(task)
 *
 * UrgencyFactor = urgency × TimeDecayMultiplier
 * ImportanceFactor = importance
 *
 * TimeDecayMultiplier = 1 + 2 × progress²
 *   progress = clamp(1 - remainingHours / totalHours, 0, 1)
 */
export function calculateScore(task: Task, settings: Settings): number {
  const wUrgency = 1 - settings.urgencyImportanceRatio;
  const wImportance = settings.urgencyImportanceRatio;

  const urgencyFactor = task.urgency * calculateTimeDecay(task);
  const importanceFactor = task.importance;

  const rawScore = wUrgency * urgencyFactor + wImportance * importanceFactor;

  // 归一化到 0-100
  const maxPossibleScore = Math.max(wUrgency, wImportance) * 5 * 3;
  if (maxPossibleScore === 0) return 0;

  return (rawScore / maxPossibleScore) * 100;
}

/**
 * 计算时间衰减乘数
 * 离截止日期越近，紧急因子放大
 */
function calculateTimeDecay(task: Task): number {
  const now = new Date();
  const effectiveNow = new Date(Math.max(now.getTime(), parseDate(task.startTime).getTime()));
  const taskEnd = parseDate(task.endTime);
  const taskStart = parseDate(task.startTime);

  const remainingMs = taskEnd.getTime() - effectiveNow.getTime();
  const totalMs = taskEnd.getTime() - taskStart.getTime();

  if (totalMs <= 0) return 1.0;

  const progress = Math.max(0, Math.min(1, 1 - remainingMs / totalMs));
  return 1 + 2 * progress * progress;
}

/**
 * 按评分降序排列任务
 */
export function rankTasks(tasks: Task[], settings: Settings): Task[] {
  return [...tasks].sort((a, b) => calculateScore(b, settings) - calculateScore(a, settings));
}
