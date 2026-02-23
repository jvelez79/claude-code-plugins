export interface RegisteredGroup {
  id: string;
  name: string;
  folder: string;
  trigger: string;
  model: string | null;
  isMain: boolean;
  active: boolean;
  registeredAt: string;
}

export interface StoredMessage {
  id: number;
  groupId: string;
  senderName: string;
  content: string;
  timestamp: string;
}

export interface ScheduledTask {
  id: string;
  groupId: string;
  prompt: string;
  scheduleType: 'cron' | 'interval' | 'once';
  scheduleValue: string;
  contextMode: 'isolated' | 'group';
  nextRun: string | null;
  lastRun: string | null;
  lastResult: string | null;
  notifyOn: string | null;
  status: 'active' | 'paused' | 'completed';
  createdAt: string;
}

export interface ActivityLogEntry {
  id?: number;
  type: 'heartbeat' | 'message' | 'task';
  groupId: string;
  startedAt: string;
  completedAt: string | null;
  durationMs: number | null;
  status: 'success' | 'error' | 'skipped';
  summary: string | null;
  costEstimate: number | null;
}

export interface PrefilterResult {
  shouldEscalate: boolean;
  reason: string;
  context: string;
  durationMs: number;
}

export interface ExecutorResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  durationMs: number;
}

export interface HeartbeatConfig {
  quietHours: {
    start: string;
    end: string;
  };
  dailyBudgetUsd: number;
  defaultModel: string | null;
  timezone: string;
  schedulerPollIntervalMs: number;
  adaptiveIntervals: {
    defaultMs: number;
    quietMs: number;
    postActionMs: number;
    highActivityMs: number;
  };
  maxConcurrentExecutions: number;
}
