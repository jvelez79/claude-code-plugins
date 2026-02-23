import path from 'path';
import fs from 'fs';
import { HeartbeatConfig } from './types.js';

export const DATA_DIR = process.env.HEARTBEAT_DATA_DIR
  || path.resolve(process.cwd(), '.claude', 'pa', 'heartbeat');

export const STORE_DIR = path.join(DATA_DIR, 'store');
export const GROUPS_DIR = path.join(DATA_DIR, 'groups');
export const LOGS_DIR = path.join(DATA_DIR, 'logs');
export const AUTH_DIR = path.join(STORE_DIR, 'auth');
export const DB_PATH = path.join(STORE_DIR, 'heartbeat.db');

export const SCHEDULER_POLL_INTERVAL = 60_000;
export const MESSAGE_CONTEXT_LIMIT = 20;

export const HEARTBEAT_INTERVAL_DEFAULT = 30 * 60 * 1000;
export const HEARTBEAT_INTERVAL_QUIET = 60 * 60 * 1000;
export const HEARTBEAT_INTERVAL_POST_ACTION = 10 * 60 * 1000;
export const HEARTBEAT_INTERVAL_HIGH_ACTIVITY = 15 * 60 * 1000;

export const ACTION_KEYWORDS = [
  'DELEGATE', 'EXECUTE', 'NOTIFY', 'sent', 'created',
  'updated', 'scheduled', 'messaged', 'replied',
];

export const TIMEZONE =
  process.env.TZ || Intl.DateTimeFormat().resolvedOptions().timeZone;

const DEFAULT_CONFIG: HeartbeatConfig = {
  quietHours: { start: '23:00', end: '07:00' },
  dailyBudgetUsd: 5.0,
  defaultModel: null,
  timezone: TIMEZONE,
  schedulerPollIntervalMs: SCHEDULER_POLL_INTERVAL,
  adaptiveIntervals: {
    defaultMs: HEARTBEAT_INTERVAL_DEFAULT,
    quietMs: HEARTBEAT_INTERVAL_QUIET,
    postActionMs: HEARTBEAT_INTERVAL_POST_ACTION,
    highActivityMs: HEARTBEAT_INTERVAL_HIGH_ACTIVITY,
  },
  maxConcurrentExecutions: 2,
};

let cachedConfig: HeartbeatConfig | null = null;
let cachedAt = 0;

export function loadConfig(): HeartbeatConfig {
  const now = Date.now();
  if (cachedConfig && now - cachedAt < 60_000) return cachedConfig;
  const configPath = path.join(DATA_DIR, 'config.json');
  let config: HeartbeatConfig;
  if (fs.existsSync(configPath)) {
    const raw = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    config = {
      ...DEFAULT_CONFIG,
      ...raw,
      quietHours: { ...DEFAULT_CONFIG.quietHours, ...raw.quietHours },
      adaptiveIntervals: { ...DEFAULT_CONFIG.adaptiveIntervals, ...raw.adaptiveIntervals },
    };
  } else {
    config = DEFAULT_CONFIG;
  }
  cachedConfig = config;
  cachedAt = now;
  return config;
}

export function saveConfig(config: HeartbeatConfig): void {
  const configPath = path.join(DATA_DIR, 'config.json');
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

export function ensureDirectories(): void {
  for (const dir of [DATA_DIR, STORE_DIR, GROUPS_DIR, LOGS_DIR, AUTH_DIR]) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function estimateCost(durationMs: number): number {
  return Math.round((durationMs / 30000) * 0.01 * 1000) / 1000;
}
