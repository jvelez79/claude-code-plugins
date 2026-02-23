import { CronExpressionParser } from 'cron-parser';
import fs from 'fs';
import path from 'path';
import {
  GROUPS_DIR,
  SCHEDULER_POLL_INTERVAL,
  ACTION_KEYWORDS,
  HEARTBEAT_INTERVAL_DEFAULT,
  HEARTBEAT_INTERVAL_QUIET,
  HEARTBEAT_INTERVAL_POST_ACTION,
  HEARTBEAT_INTERVAL_HIGH_ACTIVITY,
  loadConfig,
} from './config.js';
import { getDueTasks, updateTaskAfterRun, logActivity, getGroup } from './db.js';
import { executePrompt } from './executor.js';
import { runPrefilter, isQuietHours, isHighActivity } from './prefilter.js';
import { sendMessage } from './whatsapp.js';
import { logger } from './logger.js';
import { ScheduledTask } from './types.js';

let schedulerTimer: ReturnType<typeof setInterval> | null = null;
let runningTasks = 0;

export function startScheduler(): void {
  logger.info({ intervalMs: SCHEDULER_POLL_INTERVAL }, 'Scheduler started');
  schedulerTimer = setInterval(tick, SCHEDULER_POLL_INTERVAL);
  tick();
}

export function stopScheduler(): void {
  if (schedulerTimer) {
    clearInterval(schedulerTimer);
    schedulerTimer = null;
  }
}

async function tick(): Promise<void> {
  const config = loadConfig();
  const dueTasks = getDueTasks();

  if (dueTasks.length === 0) return;

  logger.info({ count: dueTasks.length }, 'Scheduler tick: found due tasks');

  for (const task of dueTasks) {
    if (runningTasks >= config.maxConcurrentExecutions) {
      logger.warn('Max concurrent executions reached, deferring remaining tasks');
      break;
    }
    runTask(task).catch((err) =>
      logger.error({ err, taskId: task.id }, 'Task execution error'),
    );
  }
}

async function runTask(task: ScheduledTask): Promise<void> {
  const startTime = Date.now();
  runningTasks++;

  try {
    const isHeartbeat = task.prompt.toLowerCase().includes('heartbeat');
    if (isHeartbeat) {
      const prefilter = runPrefilter();
      if (!prefilter.shouldEscalate) {
        const nextRun = calculateNextRun(task, null);
        updateTaskAfterRun(task.id, new Date().toISOString(), null, nextRun);
        logActivity({
          type: 'heartbeat',
          groupId: task.groupId,
          startedAt: new Date(startTime).toISOString(),
          completedAt: new Date().toISOString(),
          durationMs: Date.now() - startTime,
          status: 'skipped',
          summary: `Tier 0 skip: ${prefilter.reason}`,
          costEstimate: 0,
        });
        return;
      }
    }

    let prompt = task.prompt;

    if (task.prompt.endsWith('.md')) {
      const promptPath = path.resolve(task.prompt);
      if (fs.existsSync(promptPath)) {
        prompt = fs.readFileSync(promptPath, 'utf-8');
      }
    }

    const groupDir = path.join(GROUPS_DIR, task.groupId);
    const memoryDir = path.join(groupDir, 'memory');
    if (fs.existsSync(memoryDir)) {
      for (const file of fs.readdirSync(memoryDir)) {
        if (file.endsWith('.md')) {
          const tag = file.replace('.md', '');
          const content = fs.readFileSync(path.join(memoryDir, file), 'utf-8');
          prompt += `\n\n<${tag}>\n${content}\n</${tag}>`;
        }
      }
    }

    const group = getGroup(task.groupId);
    const result = await executePrompt(prompt, { model: group?.model });

    const lastResult = result.stdout.trim() || result.stderr.trim() || null;
    const nextRun = calculateNextRun(task, lastResult);

    const status = task.scheduleType === 'once' ? 'completed' : undefined;
    updateTaskAfterRun(task.id, new Date().toISOString(), lastResult, nextRun, status);

    if (lastResult && shouldNotify(task, lastResult)) {
      await sendMessage(task.groupId, lastResult);
    }

    logActivity({
      type: task.scheduleType === 'once' ? 'task' : 'heartbeat',
      groupId: task.groupId,
      startedAt: new Date(startTime).toISOString(),
      completedAt: new Date().toISOString(),
      durationMs: Date.now() - startTime,
      status: result.exitCode === 0 ? 'success' : 'error',
      summary: lastResult?.substring(0, 200) || null,
      costEstimate: Math.round((result.durationMs / 30000) * 0.01 * 1000) / 1000,
    });

    logger.info({ taskId: task.id, durationMs: Date.now() - startTime, nextRun }, 'Task completed');
  } finally {
    runningTasks--;
  }
}

function calculateNextRun(task: ScheduledTask, result: string | null): string | null {
  if (task.scheduleType === 'once') return null;

  if (task.scheduleType === 'cron') {
    const interval = CronExpressionParser.parse(task.scheduleValue);
    return interval.next().toISOString();
  }

  const isHeartbeat = task.prompt.toLowerCase().includes('heartbeat');
  let intervalMs = parseInt(task.scheduleValue, 10);

  if (isHeartbeat) {
    intervalMs = getAdaptiveInterval(result);
  }

  return new Date(Date.now() + intervalMs).toISOString();
}

function getAdaptiveInterval(result: string | null): number {
  if (result) {
    const upper = result.toUpperCase();
    if (ACTION_KEYWORDS.some((kw) => upper.includes(kw.toUpperCase()))) {
      return HEARTBEAT_INTERVAL_POST_ACTION;
    }
  }

  if (isQuietHours()) return HEARTBEAT_INTERVAL_QUIET;
  if (isHighActivity()) return HEARTBEAT_INTERVAL_HIGH_ACTIVITY;

  return HEARTBEAT_INTERVAL_DEFAULT;
}

function shouldNotify(task: ScheduledTask, result: string): boolean {
  if (!task.notifyOn) return true;

  try {
    const conditions = JSON.parse(task.notifyOn) as {
      always?: boolean;
      never?: boolean;
      containsAny?: string[];
      containsAll?: string[];
    };

    if (conditions.never) return false;
    if (conditions.always) return true;

    if (conditions.containsAny) {
      return conditions.containsAny.some((kw) =>
        result.toLowerCase().includes(kw.toLowerCase()),
      );
    }

    if (conditions.containsAll) {
      return conditions.containsAll.every((kw) =>
        result.toLowerCase().includes(kw.toLowerCase()),
      );
    }

    return true;
  } catch {
    return true;
  }
}
