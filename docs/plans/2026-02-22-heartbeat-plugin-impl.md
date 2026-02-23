# Heartbeat Plugin — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a Claude Code plugin that runs as a Node.js daemon (via launchd), connects to WhatsApp via Baileys, supports multi-group messaging, and executes scheduled prompts via `claude -p`.

**Architecture:** Single Node.js process managed by launchd with KeepAlive. WhatsApp I/O via Baileys, SQLite for state, `claude -p` for all Claude interactions. See `docs/plans/2026-02-22-heartbeat-plugin-design.md` for full design.

**Tech Stack:** TypeScript, Node.js 20+, Baileys (WhatsApp), better-sqlite3, cron-parser, pino (logging)

**Reference:** Patterns adapted from `/Users/juanca/Projects/nanoclaw` — see `src/config.ts`, `src/types.ts`, `src/db.ts`, `src/task-scheduler.ts`, `src/heartbeat-prefilter.ts` for reference implementations.

---

### Task 1: Plugin Scaffold & Build Setup

**Files:**
- Create: `plugins/heartbeat/.claude-plugin/plugin.json`
- Create: `plugins/heartbeat/package.json`
- Create: `plugins/heartbeat/tsconfig.json`
- Create: `plugins/heartbeat/.gitignore`

**Step 1: Create plugin.json**

```json
{
  "name": "heartbeat",
  "version": "1.0.0",
  "description": "Autonomous heartbeat daemon with WhatsApp messaging, multi-group support, and scheduled prompt execution via claude -p",
  "author": {
    "name": "jvelez79"
  },
  "repository": "https://github.com/jvelez79/claude-code-plugins",
  "license": "MIT",
  "keywords": ["heartbeat", "cron", "whatsapp", "daemon", "autonomous", "scheduling"]
}
```

**Step 2: Create package.json**

```json
{
  "name": "claude-heartbeat",
  "version": "1.0.0",
  "description": "Heartbeat daemon for Claude Code plugin",
  "type": "module",
  "main": "dist/daemon.js",
  "scripts": {
    "build": "tsc",
    "start": "node dist/daemon.js",
    "dev": "tsx src/daemon.ts",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@whiskeysockets/baileys": "^7.0.0-rc.9",
    "better-sqlite3": "^11.8.1",
    "cron-parser": "^5.5.0",
    "pino": "^9.6.0",
    "pino-pretty": "^13.0.0",
    "qrcode-terminal": "^0.12.0"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.6.12",
    "@types/node": "^22.10.0",
    "@types/qrcode-terminal": "^0.12.2",
    "tsx": "^4.19.0",
    "typescript": "^5.7.0"
  },
  "engines": {
    "node": ">=20"
  }
}
```

**Step 3: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Step 4: Create .gitignore**

```
node_modules/
dist/
*.js.map
```

**Step 5: Run npm install and verify build**

```bash
cd plugins/heartbeat && npm install
```

Expected: Clean install with no errors.

```bash
npx tsc --noEmit
```

Expected: No TypeScript files yet, exits cleanly.

**Step 6: Commit**

```bash
git add plugins/heartbeat/.claude-plugin/plugin.json plugins/heartbeat/package.json plugins/heartbeat/tsconfig.json plugins/heartbeat/.gitignore plugins/heartbeat/package-lock.json
git commit -m "feat(heartbeat): scaffold plugin with build setup"
```

---

### Task 2: Types & Config

**Files:**
- Create: `plugins/heartbeat/src/types.ts`
- Create: `plugins/heartbeat/src/config.ts`

**Step 1: Create types.ts**

All TypeScript interfaces for the plugin. Reference: nanoclaw `src/types.ts` but simplified (no container types, no teams).

```typescript
// plugins/heartbeat/src/types.ts

export interface RegisteredGroup {
  id: string;           // WhatsApp JID
  name: string;         // Human-readable name
  folder: string;       // Directory name under groups/
  trigger: string;      // Trigger pattern (e.g., '@Bot')
  model: string | null; // Model override (null = use default)
  isMain: boolean;      // Only 1 group is admin
  active: boolean;
  registeredAt: string; // ISO timestamp
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
  prompt: string;              // Inline prompt or path to .md file
  scheduleType: 'cron' | 'interval' | 'once';
  scheduleValue: string;       // Cron expression or milliseconds
  contextMode: 'isolated' | 'group';
  nextRun: string | null;
  lastRun: string | null;
  lastResult: string | null;
  notifyOn: string | null;     // JSON: notification conditions
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
    start: string;  // "23:00"
    end: string;    // "07:00"
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
```

**Step 2: Create config.ts**

```typescript
// plugins/heartbeat/src/config.ts
import path from 'path';
import fs from 'fs';
import { HeartbeatConfig } from './types.js';

// Resolve data directory: HEARTBEAT_DATA_DIR env var or .claude/heartbeat/ in cwd
export const DATA_DIR = process.env.HEARTBEAT_DATA_DIR
  || path.resolve(process.cwd(), '.claude', 'heartbeat');

export const STORE_DIR = path.join(DATA_DIR, 'store');
export const GROUPS_DIR = path.join(DATA_DIR, 'groups');
export const LOGS_DIR = path.join(DATA_DIR, 'logs');
export const AUTH_DIR = path.join(STORE_DIR, 'auth');
export const DB_PATH = path.join(STORE_DIR, 'heartbeat.db');

export const SCHEDULER_POLL_INTERVAL = 60_000; // 60 seconds
export const MESSAGE_CONTEXT_LIMIT = 20; // Last N messages for context

// Adaptive heartbeat intervals (milliseconds)
export const HEARTBEAT_INTERVAL_DEFAULT = 30 * 60 * 1000;   // 30 min
export const HEARTBEAT_INTERVAL_QUIET = 60 * 60 * 1000;     // 60 min
export const HEARTBEAT_INTERVAL_POST_ACTION = 10 * 60 * 1000; // 10 min
export const HEARTBEAT_INTERVAL_HIGH_ACTIVITY = 15 * 60 * 1000; // 15 min

// Action keywords that indicate Claude took a meaningful action
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

export function loadConfig(): HeartbeatConfig {
  const configPath = path.join(DATA_DIR, 'config.json');
  if (fs.existsSync(configPath)) {
    const raw = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    return { ...DEFAULT_CONFIG, ...raw };
  }
  return DEFAULT_CONFIG;
}

export function saveConfig(config: HeartbeatConfig): void {
  const configPath = path.join(DATA_DIR, 'config.json');
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

/** Ensure all required directories exist. */
export function ensureDirectories(): void {
  for (const dir of [DATA_DIR, STORE_DIR, GROUPS_DIR, LOGS_DIR, AUTH_DIR]) {
    fs.mkdirSync(dir, { recursive: true });
  }
}
```

**Step 3: Verify types compile**

```bash
cd plugins/heartbeat && npx tsc --noEmit
```

Expected: Clean compilation.

**Step 4: Commit**

```bash
git add plugins/heartbeat/src/types.ts plugins/heartbeat/src/config.ts
git commit -m "feat(heartbeat): add TypeScript types and config module"
```

---

### Task 3: Logger Module

**Files:**
- Create: `plugins/heartbeat/src/logger.ts`

**Step 1: Create logger.ts**

```typescript
// plugins/heartbeat/src/logger.ts
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.stdout.isTTY
    ? { target: 'pino-pretty', options: { colorize: true } }
    : undefined,
});
```

**Step 2: Commit**

```bash
git add plugins/heartbeat/src/logger.ts
git commit -m "feat(heartbeat): add pino logger"
```

---

### Task 4: Database Module

**Files:**
- Create: `plugins/heartbeat/src/db.ts`

**Step 1: Create db.ts with schema + CRUD operations**

Reference: nanoclaw `src/db.ts` pattern — `better-sqlite3`, synchronous API, indexed queries.

```typescript
// plugins/heartbeat/src/db.ts
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { DB_PATH, STORE_DIR } from './config.js';
import { RegisteredGroup, StoredMessage, ScheduledTask, ActivityLogEntry } from './types.js';

let db: Database.Database;

export function initDatabase(): void {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS groups (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      folder TEXT NOT NULL UNIQUE,
      trigger_word TEXT DEFAULT '@Bot',
      model TEXT,
      is_main INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1,
      registered_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id TEXT NOT NULL,
      sender_name TEXT NOT NULL,
      content TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      FOREIGN KEY (group_id) REFERENCES groups(id)
    );
    CREATE INDEX IF NOT EXISTS idx_messages_group_ts
      ON messages(group_id, timestamp DESC);

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      group_id TEXT NOT NULL,
      prompt TEXT NOT NULL,
      schedule_type TEXT NOT NULL,
      schedule_value TEXT NOT NULL,
      context_mode TEXT DEFAULT 'isolated',
      next_run TEXT,
      last_run TEXT,
      last_result TEXT,
      notify_on TEXT,
      status TEXT DEFAULT 'active',
      created_at TEXT NOT NULL,
      FOREIGN KEY (group_id) REFERENCES groups(id)
    );
    CREATE INDEX IF NOT EXISTS idx_tasks_next_run ON tasks(next_run);
    CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);

    CREATE TABLE IF NOT EXISTS activity_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      group_id TEXT NOT NULL,
      started_at TEXT NOT NULL,
      completed_at TEXT,
      duration_ms INTEGER,
      status TEXT NOT NULL,
      summary TEXT,
      cost_estimate REAL
    );
    CREATE INDEX IF NOT EXISTS idx_activity_started
      ON activity_log(started_at DESC);
  `);
}

export function getDb(): Database.Database {
  return db;
}

// --- Groups ---

export function registerGroup(group: RegisteredGroup): void {
  db.prepare(`
    INSERT OR REPLACE INTO groups (id, name, folder, trigger_word, model, is_main, active, registered_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(group.id, group.name, group.folder, group.trigger, group.model, group.isMain ? 1 : 0, group.active ? 1 : 0, group.registeredAt);
}

export function getGroup(id: string): RegisteredGroup | null {
  const row = db.prepare('SELECT * FROM groups WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  return row ? mapGroup(row) : null;
}

export function getGroupByFolder(folder: string): RegisteredGroup | null {
  const row = db.prepare('SELECT * FROM groups WHERE folder = ?').get(folder) as Record<string, unknown> | undefined;
  return row ? mapGroup(row) : null;
}

export function getAllGroups(): RegisteredGroup[] {
  const rows = db.prepare('SELECT * FROM groups WHERE active = 1').all() as Record<string, unknown>[];
  return rows.map(mapGroup);
}

export function getMainGroup(): RegisteredGroup | null {
  const row = db.prepare('SELECT * FROM groups WHERE is_main = 1').get() as Record<string, unknown> | undefined;
  return row ? mapGroup(row) : null;
}

export function removeGroup(id: string): void {
  db.prepare('UPDATE groups SET active = 0 WHERE id = ?').run(id);
}

function mapGroup(row: Record<string, unknown>): RegisteredGroup {
  return {
    id: row.id as string,
    name: row.name as string,
    folder: row.folder as string,
    trigger: row.trigger_word as string,
    model: row.model as string | null,
    isMain: row.is_main === 1,
    active: row.active === 1,
    registeredAt: row.registered_at as string,
  };
}

// --- Messages ---

export function storeMessage(groupId: string, senderName: string, content: string, timestamp: string): void {
  db.prepare(`
    INSERT INTO messages (group_id, sender_name, content, timestamp)
    VALUES (?, ?, ?, ?)
  `).run(groupId, senderName, content, timestamp);
}

export function getRecentMessages(groupId: string, limit: number): StoredMessage[] {
  const rows = db.prepare(`
    SELECT * FROM messages WHERE group_id = ? ORDER BY timestamp DESC LIMIT ?
  `).all(groupId, limit) as Record<string, unknown>[];
  return rows.reverse().map(row => ({
    id: row.id as number,
    groupId: row.group_id as string,
    senderName: row.sender_name as string,
    content: row.content as string,
    timestamp: row.timestamp as string,
  }));
}

export function getMessageCountSince(timestamp: string): number {
  const row = db.prepare('SELECT COUNT(*) as count FROM messages WHERE timestamp > ?').get(timestamp) as { count: number };
  return row.count;
}

// --- Tasks ---

export function createTask(task: ScheduledTask): void {
  db.prepare(`
    INSERT INTO tasks (id, group_id, prompt, schedule_type, schedule_value, context_mode, next_run, notify_on, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(task.id, task.groupId, task.prompt, task.scheduleType, task.scheduleValue, task.contextMode, task.nextRun, task.notifyOn, task.status, task.createdAt);
}

export function getDueTasks(): ScheduledTask[] {
  const now = new Date().toISOString();
  const rows = db.prepare(`
    SELECT * FROM tasks WHERE status = 'active' AND next_run <= ?
  `).all(now) as Record<string, unknown>[];
  return rows.map(mapTask);
}

export function getAllTasks(groupId?: string): ScheduledTask[] {
  if (groupId) {
    return (db.prepare('SELECT * FROM tasks WHERE group_id = ? AND status != ?').all(groupId, 'completed') as Record<string, unknown>[]).map(mapTask);
  }
  return (db.prepare('SELECT * FROM tasks WHERE status != ?').all('completed') as Record<string, unknown>[]).map(mapTask);
}

export function updateTaskAfterRun(taskId: string, lastRun: string, lastResult: string | null, nextRun: string | null, status?: string): void {
  db.prepare(`
    UPDATE tasks SET last_run = ?, last_result = ?, next_run = ?, status = COALESCE(?, status) WHERE id = ?
  `).run(lastRun, lastResult, nextRun, status || null, taskId);
}

export function removeTask(taskId: string): void {
  db.prepare('DELETE FROM tasks WHERE id = ?').run(taskId);
}

function mapTask(row: Record<string, unknown>): ScheduledTask {
  return {
    id: row.id as string,
    groupId: row.group_id as string,
    prompt: row.prompt as string,
    scheduleType: row.schedule_type as 'cron' | 'interval' | 'once',
    scheduleValue: row.schedule_value as string,
    contextMode: (row.context_mode as string) === 'group' ? 'group' : 'isolated',
    nextRun: row.next_run as string | null,
    lastRun: row.last_run as string | null,
    lastResult: row.last_result as string | null,
    notifyOn: row.notify_on as string | null,
    status: row.status as 'active' | 'paused' | 'completed',
    createdAt: row.created_at as string,
  };
}

// --- Activity Log ---

export function logActivity(entry: ActivityLogEntry): void {
  db.prepare(`
    INSERT INTO activity_log (type, group_id, started_at, completed_at, duration_ms, status, summary, cost_estimate)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(entry.type, entry.groupId, entry.startedAt, entry.completedAt, entry.durationMs, entry.status, entry.summary, entry.costEstimate);
}

export function getRecentActivity(limit: number, groupId?: string): ActivityLogEntry[] {
  const query = groupId
    ? 'SELECT * FROM activity_log WHERE group_id = ? ORDER BY started_at DESC LIMIT ?'
    : 'SELECT * FROM activity_log ORDER BY started_at DESC LIMIT ?';
  const rows = (groupId
    ? db.prepare(query).all(groupId, limit)
    : db.prepare(query).all(limit)) as Record<string, unknown>[];
  return rows.map(row => ({
    id: row.id as number,
    type: row.type as 'heartbeat' | 'message' | 'task',
    groupId: row.group_id as string,
    startedAt: row.started_at as string,
    completedAt: row.completed_at as string | null,
    durationMs: row.duration_ms as number | null,
    status: row.status as 'success' | 'error' | 'skipped',
    summary: row.summary as string | null,
    costEstimate: row.cost_estimate as number | null,
  }));
}

export function getDailySpend(): number {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const row = db.prepare(`
    SELECT COALESCE(SUM(cost_estimate), 0) as total
    FROM activity_log WHERE started_at >= ? AND status = 'success'
  `).get(todayStart.toISOString()) as { total: number };
  return row.total;
}
```

**Step 2: Verify compilation**

```bash
cd plugins/heartbeat && npx tsc --noEmit
```

Expected: Clean.

**Step 3: Commit**

```bash
git add plugins/heartbeat/src/db.ts
git commit -m "feat(heartbeat): add SQLite database module with schema and CRUD"
```

---

### Task 5: Executor Module (claude -p wrapper)

**Files:**
- Create: `plugins/heartbeat/src/executor.ts`

**Step 1: Create executor.ts**

Wraps `claude -p` with timeout, captures stdout/stderr, measures duration.

```typescript
// plugins/heartbeat/src/executor.ts
import { execFile } from 'child_process';
import { ExecutorResult } from './types.js';
import { logger } from './logger.js';

const DEFAULT_TIMEOUT = 300_000; // 5 minutes
const CLAUDE_BIN = process.env.CLAUDE_BIN || 'claude';

/**
 * Execute a prompt via `claude -p` in headless mode.
 * Each invocation is independent and stateless.
 */
export function executePrompt(
  prompt: string,
  options: {
    model?: string | null;
    timeout?: number;
    cwd?: string;
  } = {},
): Promise<ExecutorResult> {
  const startTime = Date.now();
  const args = ['-p', prompt, '--output-format', 'text'];

  if (options.model) {
    args.push('--model', options.model);
  }

  return new Promise((resolve) => {
    const child = execFile(
      CLAUDE_BIN,
      args,
      {
        timeout: options.timeout || DEFAULT_TIMEOUT,
        cwd: options.cwd || process.cwd(),
        maxBuffer: 10 * 1024 * 1024, // 10MB
        env: { ...process.env },
      },
      (error, stdout, stderr) => {
        const durationMs = Date.now() - startTime;
        const exitCode = error?.code === 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER'
          ? 1
          : (error as { code?: number })?.code ?? child.exitCode ?? 0;

        logger.info({ durationMs, exitCode, promptLen: prompt.length }, 'claude -p completed');

        resolve({
          stdout: stdout.toString(),
          stderr: stderr.toString(),
          exitCode: typeof exitCode === 'number' ? exitCode : 1,
          durationMs,
        });
      },
    );
  });
}
```

**Step 2: Verify compilation**

```bash
cd plugins/heartbeat && npx tsc --noEmit
```

**Step 3: Commit**

```bash
git add plugins/heartbeat/src/executor.ts
git commit -m "feat(heartbeat): add claude -p executor wrapper"
```

---

### Task 6: Prefilter Module (Tier 0 Checks)

**Files:**
- Create: `plugins/heartbeat/src/prefilter.ts`

**Step 1: Create prefilter.ts**

Reference: nanoclaw `src/heartbeat-prefilter.ts` + `src/tier0-checks.ts` — simplified for plugin (no container concepts).

```typescript
// plugins/heartbeat/src/prefilter.ts
import { loadConfig } from './config.js';
import { getDailySpend, getMessageCountSince } from './db.js';
import { PrefilterResult } from './types.js';
import { logger } from './logger.js';

/**
 * Check if current time is within quiet hours.
 */
export function isQuietHours(): boolean {
  const config = loadConfig();
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const current = hours * 60 + minutes;

  const [startH, startM] = config.quietHours.start.split(':').map(Number);
  const [endH, endM] = config.quietHours.end.split(':').map(Number);
  const start = startH * 60 + startM;
  const end = endH * 60 + endM;

  // Handle overnight ranges (e.g., 23:00 - 07:00)
  if (start > end) {
    return current >= start || current < end;
  }
  return current >= start && current < end;
}

/**
 * Check if daily budget has been exceeded.
 */
export function isBudgetExceeded(): boolean {
  const config = loadConfig();
  const spent = getDailySpend();
  return spent >= config.dailyBudgetUsd;
}

/**
 * Check if there is high message activity (10+ messages in last 15 min).
 */
export function isHighActivity(): boolean {
  const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  return getMessageCountSince(fifteenMinAgo) >= 10;
}

/**
 * Run all Tier 0 pre-filter checks.
 * Returns whether to escalate (spawn claude -p) or skip.
 */
export function runPrefilter(): PrefilterResult {
  const start = Date.now();
  const reasons: string[] = [];

  // Check 1: Budget exceeded → always skip
  if (isBudgetExceeded()) {
    const durationMs = Date.now() - start;
    logger.info({ durationMs }, 'Prefilter: SKIP — daily budget exceeded');
    return {
      shouldEscalate: false,
      reason: 'budget_exceeded',
      context: '',
      durationMs,
    };
  }

  // Check 2: Quiet hours → skip unless high activity
  if (isQuietHours()) {
    if (!isHighActivity()) {
      const durationMs = Date.now() - start;
      logger.info({ durationMs }, 'Prefilter: SKIP — quiet hours, no high activity');
      return {
        shouldEscalate: false,
        reason: 'quiet_hours',
        context: '',
        durationMs,
      };
    }
    reasons.push('quiet_hours_but_high_activity');
  }

  // Check 3: High activity → escalate with context
  let context = '';
  if (isHighActivity()) {
    reasons.push('high_activity');
    context += '<prefilter-context>High message activity detected in last 15 minutes.</prefilter-context>\n';
  }

  const durationMs = Date.now() - start;
  const shouldEscalate = true; // Default: escalate if no blocking condition

  logger.info(
    { durationMs, shouldEscalate, reasons },
    `Prefilter: ${shouldEscalate ? 'ESCALATE' : 'SKIP'}`,
  );

  return {
    shouldEscalate,
    reason: reasons.join(', ') || 'default',
    context,
    durationMs,
  };
}
```

**Step 2: Verify compilation**

```bash
cd plugins/heartbeat && npx tsc --noEmit
```

**Step 3: Commit**

```bash
git add plugins/heartbeat/src/prefilter.ts
git commit -m "feat(heartbeat): add Tier 0 prefilter (quiet hours, budget, activity)"
```

---

### Task 7: WhatsApp Module (Baileys Connection)

**Files:**
- Create: `plugins/heartbeat/src/whatsapp.ts`

**Step 1: Create whatsapp.ts**

Handles Baileys connection, QR auth, message sending/receiving. Reference: nanoclaw `src/index.ts` WhatsApp setup section.

```typescript
// plugins/heartbeat/src/whatsapp.ts
import makeWASocket, {
  DisconnectReason,
  WASocket,
  makeCacheableSignalKeyStore,
  useMultiFileAuthState,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import { AUTH_DIR } from './config.js';
import { logger } from './logger.js';

let sock: WASocket | null = null;
let messageHandler: ((jid: string, senderName: string, content: string, timestamp: string) => void) | null = null;

/**
 * Register a handler for incoming messages.
 */
export function onMessage(
  handler: (jid: string, senderName: string, content: string, timestamp: string) => void,
): void {
  messageHandler = handler;
}

/**
 * Connect to WhatsApp via Baileys.
 * First connection requires QR code scan.
 */
export async function connectWhatsApp(): Promise<WASocket> {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

  sock = makeWASocket({
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })),
    },
    logger: pino({ level: 'silent' }),
    printQRInTerminal: true,
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === 'close') {
      const reason = (lastDisconnect?.error as Boom)?.output?.statusCode;
      const shouldReconnect = reason !== DisconnectReason.loggedOut;

      logger.warn(
        { reason, shouldReconnect },
        'WhatsApp connection closed',
      );

      if (shouldReconnect) {
        setTimeout(() => connectWhatsApp(), 5000);
      } else {
        logger.error('WhatsApp logged out. Re-run /heartbeat-start to re-authenticate.');
        process.exit(1);
      }
    }

    if (connection === 'open') {
      logger.info('WhatsApp connected');
    }
  });

  sock.ev.on('messages.upsert', async ({ messages }) => {
    for (const msg of messages) {
      if (!msg.message || msg.key.fromMe) continue;

      const jid = msg.key.remoteJid;
      if (!jid) continue;

      const content =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        '';
      if (!content) continue;

      const senderName = msg.pushName || msg.key.participant || 'Unknown';
      const timestamp = new Date(
        (msg.messageTimestamp as number) * 1000,
      ).toISOString();

      if (messageHandler) {
        messageHandler(jid, senderName, content, timestamp);
      }
    }
  });

  return sock;
}

/**
 * Send a text message to a WhatsApp JID.
 */
export async function sendMessage(jid: string, text: string): Promise<void> {
  if (!sock) throw new Error('WhatsApp not connected');
  await sock.sendMessage(jid, { text });
}

/**
 * Get list of available groups from WhatsApp.
 */
export async function getAvailableGroups(): Promise<Array<{ id: string; subject: string }>> {
  if (!sock) throw new Error('WhatsApp not connected');
  const groups = await sock.groupFetchAllParticipating();
  return Object.entries(groups).map(([id, meta]) => ({
    id,
    subject: meta.subject,
  }));
}

export function getSocket(): WASocket | null {
  return sock;
}
```

**Step 2: Verify compilation**

```bash
cd plugins/heartbeat && npx tsc --noEmit
```

Note: `@hapi/boom` is a transitive dependency of Baileys, should be available. If not:

```bash
cd plugins/heartbeat && npm install @hapi/boom
```

**Step 3: Commit**

```bash
git add plugins/heartbeat/src/whatsapp.ts
git commit -m "feat(heartbeat): add WhatsApp module with Baileys connection"
```

---

### Task 8: Router Module (Message Routing)

**Files:**
- Create: `plugins/heartbeat/src/router.ts`

**Step 1: Create router.ts**

Routes incoming WhatsApp messages to the correct group handler. Checks trigger patterns, builds prompts, invokes executor.

```typescript
// plugins/heartbeat/src/router.ts
import fs from 'fs';
import path from 'path';
import { GROUPS_DIR, MESSAGE_CONTEXT_LIMIT } from './config.js';
import { getGroup, getAllGroups, storeMessage, getRecentMessages, logActivity } from './db.js';
import { executePrompt } from './executor.js';
import { sendMessage } from './whatsapp.js';
import { logger } from './logger.js';

/**
 * Handle an incoming WhatsApp message.
 * Called by the WhatsApp module's message handler.
 */
export async function handleIncomingMessage(
  jid: string,
  senderName: string,
  content: string,
  timestamp: string,
): Promise<void> {
  // 1. Check if this group is registered
  const group = getGroup(jid);
  if (!group || !group.active) return;

  // 2. Store the message regardless of trigger
  storeMessage(jid, senderName, content, timestamp);

  // 3. Check trigger match
  if (!matchesTrigger(content, group.trigger)) return;

  logger.info({ group: group.folder, sender: senderName }, 'Trigger matched, processing message');

  const startTime = Date.now();

  try {
    // 4. Build prompt with context
    const prompt = buildPrompt(group.id, group.folder, senderName, content);

    // 5. Execute via claude -p
    const result = await executePrompt(prompt, { model: group.model });

    // 6. Send response
    if (result.stdout.trim()) {
      await sendMessage(jid, result.stdout.trim());
    }

    // 7. Log activity
    logActivity({
      type: 'message',
      groupId: group.id,
      startedAt: new Date(startTime).toISOString(),
      completedAt: new Date().toISOString(),
      durationMs: Date.now() - startTime,
      status: result.exitCode === 0 ? 'success' : 'error',
      summary: `Responded to ${senderName} in ${group.folder}`,
      costEstimate: estimateCost(result.durationMs),
    });
  } catch (err) {
    logger.error({ err, group: group.folder }, 'Error handling message');
    logActivity({
      type: 'message',
      groupId: group.id,
      startedAt: new Date(startTime).toISOString(),
      completedAt: new Date().toISOString(),
      durationMs: Date.now() - startTime,
      status: 'error',
      summary: `Error: ${(err as Error).message}`,
      costEstimate: 0,
    });
  }
}

function matchesTrigger(content: string, trigger: string): boolean {
  // '@Bot' style trigger: check if message starts with or contains the trigger
  const escaped = trigger.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`(^|\\s)${escaped}\\b`, 'i');
  return pattern.test(content);
}

function buildPrompt(groupId: string, folder: string, senderName: string, currentMessage: string): string {
  const parts: string[] = [];

  // System prompt from group's CLAUDE.md
  const claudeMdPath = path.join(GROUPS_DIR, folder, 'CLAUDE.md');
  if (fs.existsSync(claudeMdPath)) {
    parts.push(fs.readFileSync(claudeMdPath, 'utf-8'));
  }

  // Recent message history for context
  const recent = getRecentMessages(groupId, MESSAGE_CONTEXT_LIMIT);
  if (recent.length > 0) {
    const messagesXml = recent
      .map((m) => `<message sender="${escapeXml(m.senderName)}" time="${m.timestamp}">${escapeXml(m.content)}</message>`)
      .join('\n');
    parts.push(`<messages>\n${messagesXml}\n</messages>`);
  }

  // Current message that triggered the response
  parts.push(`<current-message sender="${escapeXml(senderName)}">${escapeXml(currentMessage)}</current-message>`);

  return parts.join('\n\n');
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Rough cost estimate based on duration (proxy for tokens used). */
function estimateCost(durationMs: number): number {
  // Very rough heuristic: ~$0.01 per 30s of claude -p execution
  return Math.round((durationMs / 30000) * 0.01 * 1000) / 1000;
}
```

**Step 2: Verify compilation**

```bash
cd plugins/heartbeat && npx tsc --noEmit
```

**Step 3: Commit**

```bash
git add plugins/heartbeat/src/router.ts
git commit -m "feat(heartbeat): add message router with trigger matching and prompt building"
```

---

### Task 9: Scheduler Module

**Files:**
- Create: `plugins/heartbeat/src/scheduler.ts`

**Step 1: Create scheduler.ts**

Reference: nanoclaw `src/task-scheduler.ts` — adaptive intervals, prefilter integration, cron parsing.

```typescript
// plugins/heartbeat/src/scheduler.ts
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
import { getDueTasks, updateTaskAfterRun, logActivity } from './db.js';
import { executePrompt } from './executor.js';
import { runPrefilter, isQuietHours, isHighActivity } from './prefilter.js';
import { sendMessage } from './whatsapp.js';
import { logger } from './logger.js';
import { ScheduledTask } from './types.js';

let schedulerTimer: ReturnType<typeof setInterval> | null = null;
let runningTasks = 0;

/**
 * Start the scheduler loop.
 */
export function startScheduler(): void {
  logger.info({ intervalMs: SCHEDULER_POLL_INTERVAL }, 'Scheduler started');
  schedulerTimer = setInterval(tick, SCHEDULER_POLL_INTERVAL);
  // Run first tick immediately
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
    // Fire and forget (but track concurrency)
    runTask(task).catch((err) =>
      logger.error({ err, taskId: task.id }, 'Task execution error'),
    );
  }
}

async function runTask(task: ScheduledTask): Promise<void> {
  const startTime = Date.now();
  runningTasks++;

  try {
    // Tier 0 prefilter for heartbeat tasks
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

    // Build enriched prompt
    let prompt = task.prompt;

    // If prompt is a file path, read it
    if (task.prompt.endsWith('.md')) {
      const promptPath = path.resolve(task.prompt);
      if (fs.existsSync(promptPath)) {
        prompt = fs.readFileSync(promptPath, 'utf-8');
      }
    }

    // Append memory files if they exist
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

    // Get group info for model override
    // Note: task.groupId is the WhatsApp JID stored in the tasks table
    const { getGroup } = await import('./db.js');
    const group = getGroup(task.groupId);

    // Execute
    const result = await executePrompt(prompt, { model: group?.model });

    const lastResult = result.stdout.trim() || result.stderr.trim() || null;
    const nextRun = calculateNextRun(task, lastResult);

    // Update task
    const status = task.scheduleType === 'once' ? 'completed' : undefined;
    updateTaskAfterRun(task.id, new Date().toISOString(), lastResult, nextRun, status);

    // Conditional notification
    if (lastResult && shouldNotify(task, lastResult)) {
      await sendMessage(task.groupId, lastResult);
    }

    // Log activity
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

/**
 * Calculate the next run time based on schedule type and result.
 */
function calculateNextRun(task: ScheduledTask, result: string | null): string | null {
  if (task.scheduleType === 'once') return null;

  if (task.scheduleType === 'cron') {
    const interval = CronExpressionParser.parseExpression(task.scheduleValue);
    return interval.next().toISOString();
  }

  // Interval type — potentially adaptive
  const isHeartbeat = task.prompt.toLowerCase().includes('heartbeat');
  let intervalMs = parseInt(task.scheduleValue, 10);

  if (isHeartbeat) {
    intervalMs = getAdaptiveInterval(result);
  }

  return new Date(Date.now() + intervalMs).toISOString();
}

/**
 * Determine adaptive heartbeat interval based on conditions and result.
 */
function getAdaptiveInterval(result: string | null): number {
  // Post-action: shorter interval
  if (result) {
    const upper = result.toUpperCase();
    if (ACTION_KEYWORDS.some((kw) => upper.includes(kw.toUpperCase()))) {
      return HEARTBEAT_INTERVAL_POST_ACTION;
    }
  }

  // Quiet hours: longer interval
  if (isQuietHours()) return HEARTBEAT_INTERVAL_QUIET;

  // High activity: shorter interval
  if (isHighActivity()) return HEARTBEAT_INTERVAL_HIGH_ACTIVITY;

  return HEARTBEAT_INTERVAL_DEFAULT;
}

/**
 * Check if the task result matches notification conditions.
 */
function shouldNotify(task: ScheduledTask, result: string): boolean {
  if (!task.notifyOn) return true; // Default: always notify

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
```

**Step 2: Verify compilation**

```bash
cd plugins/heartbeat && npx tsc --noEmit
```

**Step 3: Commit**

```bash
git add plugins/heartbeat/src/scheduler.ts
git commit -m "feat(heartbeat): add task scheduler with adaptive intervals and prefilter"
```

---

### Task 10: Daemon Entry Point

**Files:**
- Create: `plugins/heartbeat/src/daemon.ts`

**Step 1: Create daemon.ts**

Boots WhatsApp, initializes DB, starts scheduler. Reference: nanoclaw `src/index.ts` startup sequence.

```typescript
// plugins/heartbeat/src/daemon.ts
import { ensureDirectories } from './config.js';
import { initDatabase } from './db.js';
import { connectWhatsApp, onMessage } from './whatsapp.js';
import { handleIncomingMessage } from './router.js';
import { startScheduler, stopScheduler } from './scheduler.js';
import { logger } from './logger.js';

async function main(): Promise<void> {
  logger.info('Heartbeat daemon starting...');

  // 1. Ensure directory structure
  ensureDirectories();

  // 2. Initialize SQLite database
  initDatabase();
  logger.info('Database initialized');

  // 3. Register message handler
  onMessage((jid, senderName, content, timestamp) => {
    handleIncomingMessage(jid, senderName, content, timestamp).catch((err) =>
      logger.error({ err, jid }, 'Message handler error'),
    );
  });

  // 4. Connect to WhatsApp (shows QR on first run)
  await connectWhatsApp();
  logger.info('WhatsApp connected');

  // 5. Start task scheduler
  startScheduler();
  logger.info('Scheduler started');

  logger.info('Heartbeat daemon running. Press Ctrl+C to stop.');

  // Graceful shutdown
  const shutdown = () => {
    logger.info('Shutting down...');
    stopScheduler();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  logger.fatal({ err }, 'Daemon failed to start');
  process.exit(1);
});
```

**Step 2: Build and verify**

```bash
cd plugins/heartbeat && npx tsc
```

Expected: Compiles to `dist/daemon.js` and all other modules.

**Step 3: Commit**

```bash
git add plugins/heartbeat/src/daemon.ts
git commit -m "feat(heartbeat): add daemon entry point (WhatsApp + scheduler boot)"
```

---

### Task 11: launchd Template & Install/Uninstall Scripts

**Files:**
- Create: `plugins/heartbeat/templates/com.claude-heartbeat.plist`
- Create: `plugins/heartbeat/scripts/install-daemon.sh`
- Create: `plugins/heartbeat/scripts/uninstall-daemon.sh`

**Step 1: Create launchd plist template**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.claude-heartbeat</string>

    <key>ProgramArguments</key>
    <array>
        <string>{{NODE_PATH}}</string>
        <string>{{PLUGIN_ROOT}}/dist/daemon.js</string>
    </array>

    <key>WorkingDirectory</key>
    <string>{{PROJECT_ROOT}}</string>

    <key>RunAtLoad</key>
    <true/>

    <key>KeepAlive</key>
    <true/>

    <key>ThrottleInterval</key>
    <integer>10</integer>

    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>{{PATH}}</string>
        <key>HOME</key>
        <string>{{HOME}}</string>
        <key>HEARTBEAT_DATA_DIR</key>
        <string>{{PROJECT_ROOT}}/.claude/heartbeat</string>
    </dict>

    <key>StandardOutPath</key>
    <string>{{PROJECT_ROOT}}/.claude/heartbeat/logs/daemon.log</string>
    <key>StandardErrorPath</key>
    <string>{{PROJECT_ROOT}}/.claude/heartbeat/logs/daemon.error.log</string>
</dict>
</plist>
```

**Step 2: Create install-daemon.sh**

```bash
#!/usr/bin/env bash
set -euo pipefail

PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"
PROJECT_ROOT="${1:-$(pwd)}"
PLIST_LABEL="com.claude-heartbeat"
PLIST_DEST="$HOME/Library/LaunchAgents/${PLIST_LABEL}.plist"
TEMPLATE="$PLUGIN_ROOT/templates/com.claude-heartbeat.plist"

echo "=== Heartbeat Daemon Installer ==="
echo "Plugin root: $PLUGIN_ROOT"
echo "Project root: $PROJECT_ROOT"

# 1. Install npm dependencies
echo "Installing dependencies..."
cd "$PLUGIN_ROOT"
npm install --production 2>/dev/null

# 2. Build TypeScript
echo "Building TypeScript..."
npx tsc

# 3. Create data directories
DATA_DIR="$PROJECT_ROOT/.claude/heartbeat"
mkdir -p "$DATA_DIR/store/auth" "$DATA_DIR/groups" "$DATA_DIR/logs"

# 4. Render plist template
NODE_PATH=$(which node)
CURRENT_PATH="$HOME/.local/bin:/usr/local/bin:/usr/bin:/bin:$(dirname "$NODE_PATH")"

echo "Rendering launchd plist..."
sed \
  -e "s|{{NODE_PATH}}|$NODE_PATH|g" \
  -e "s|{{PLUGIN_ROOT}}|$PLUGIN_ROOT|g" \
  -e "s|{{PROJECT_ROOT}}|$PROJECT_ROOT|g" \
  -e "s|{{HOME}}|$HOME|g" \
  -e "s|{{PATH}}|$CURRENT_PATH|g" \
  "$TEMPLATE" > "$PLIST_DEST"

# 5. Unload if already loaded
launchctl unload "$PLIST_DEST" 2>/dev/null || true

# 6. Load the plist
echo "Loading launchd service..."
launchctl load "$PLIST_DEST"

echo ""
echo "=== Heartbeat daemon installed ==="
echo "Plist: $PLIST_DEST"
echo "Logs: $DATA_DIR/logs/"
echo ""
echo "Check status: launchctl list | grep heartbeat"
echo "View logs: tail -f $DATA_DIR/logs/daemon.log"
```

**Step 3: Create uninstall-daemon.sh**

```bash
#!/usr/bin/env bash
set -euo pipefail

PLIST_LABEL="com.claude-heartbeat"
PLIST_PATH="$HOME/Library/LaunchAgents/${PLIST_LABEL}.plist"

echo "=== Heartbeat Daemon Uninstaller ==="

if [ -f "$PLIST_PATH" ]; then
  echo "Unloading launchd service..."
  launchctl unload "$PLIST_PATH" 2>/dev/null || true
  rm -f "$PLIST_PATH"
  echo "Removed: $PLIST_PATH"
else
  echo "No plist found at $PLIST_PATH"
fi

echo ""
echo "=== Heartbeat daemon uninstalled ==="
echo "Note: Data in .claude/heartbeat/ was NOT deleted."
echo "To remove data: rm -rf .claude/heartbeat/"
```

**Step 4: Make scripts executable**

```bash
chmod +x plugins/heartbeat/scripts/install-daemon.sh plugins/heartbeat/scripts/uninstall-daemon.sh
```

**Step 5: Commit**

```bash
git add plugins/heartbeat/templates/ plugins/heartbeat/scripts/
git commit -m "feat(heartbeat): add launchd template and install/uninstall scripts"
```

---

### Task 12: Plugin Commands

**Files:**
- Create: `plugins/heartbeat/commands/heartbeat-start.md`
- Create: `plugins/heartbeat/commands/heartbeat-stop.md`
- Create: `plugins/heartbeat/commands/heartbeat.md`
- Create: `plugins/heartbeat/commands/heartbeat-group.md`

**Step 1: Create heartbeat-start.md**

```markdown
---
description: "Setup and start the heartbeat daemon (npm install, WhatsApp auth, launchd)"
allowed-tools:
  - "Bash(${CLAUDE_PLUGIN_ROOT}/scripts/install-daemon.sh:*)"
  - "Bash(npm:*)"
  - "Bash(npx:*)"
  - "Bash(launchctl:*)"
  - "Bash(tail:*)"
  - "Read"
  - "Write"
---

# Heartbeat Start

Setup and start the heartbeat daemon.

## Steps

1. Run the install script:

```bash
${CLAUDE_PLUGIN_ROOT}/scripts/install-daemon.sh "$(pwd)"
```

2. The daemon will start and show a QR code in the logs if this is the first WhatsApp connection.

3. Check the logs for the QR code:

```bash
tail -20 .claude/heartbeat/logs/daemon.log
```

4. Tell the user to scan the QR code with WhatsApp (Settings > Linked Devices > Link a Device).

5. Once connected, create a default config if it doesn't exist:

Write `.claude/heartbeat/config.json` with sensible defaults:
```json
{
  "quiet_hours": { "start": "23:00", "end": "07:00" },
  "daily_budget_usd": 5.0,
  "default_model": null,
  "timezone": "America/Mexico_City",
  "scheduler_poll_interval_ms": 60000,
  "adaptive_intervals": {
    "default_ms": 1800000,
    "quiet_ms": 3600000,
    "post_action_ms": 600000,
    "high_activity_ms": 900000
  },
  "max_concurrent_executions": 2
}
```

6. Tell the user the daemon is running and how to:
   - Register groups: `/heartbeat-group register`
   - Add tasks: `/heartbeat add <group>`
   - Check status: `/heartbeat status`
   - View logs: `tail -f .claude/heartbeat/logs/daemon.log`
```

**Step 2: Create heartbeat-stop.md**

```markdown
---
description: "Stop the heartbeat daemon and uninstall launchd service"
allowed-tools:
  - "Bash(${CLAUDE_PLUGIN_ROOT}/scripts/uninstall-daemon.sh:*)"
  - "Bash(launchctl:*)"
---

# Heartbeat Stop

Stop the heartbeat daemon.

Run the uninstall script:

```bash
${CLAUDE_PLUGIN_ROOT}/scripts/uninstall-daemon.sh
```

Confirm to the user that the daemon has been stopped and the launchd service removed.
Note that data in `.claude/heartbeat/` is preserved.
```

**Step 3: Create heartbeat.md**

```markdown
---
description: "Manage heartbeat tasks: add, list, remove, status, logs"
argument-hint: "<add|list|remove|status|logs> [args]"
allowed-tools:
  - "Read"
  - "Write"
  - "Bash(launchctl:*)"
  - "Bash(tail:*)"
  - "Bash(sqlite3:*)"
  - "AskUserQuestion"
---

# Heartbeat Management

Manage heartbeat tasks and check daemon status.

## Arguments

Parse `$ARGUMENTS` to determine the subcommand:

### `/heartbeat status`

Show daemon status and overview:
1. Check if launchd service is running: `launchctl list | grep claude-heartbeat`
2. Read `.claude/heartbeat/config.json` for current settings
3. Count registered groups from the database
4. Count active tasks
5. Show recent activity log entries

### `/heartbeat add <group-folder>`

Create a new scheduled task for a group. Ask the user interactively:
1. **Prompt**: What should Claude do? (inline text or path to .md file)
2. **Schedule type**: cron, interval, or once
3. **Schedule value**: cron expression (e.g., "0 9 * * 1-5") or interval in minutes
4. **Context mode**: isolated (fresh each time) or group (include message history)
5. **Notify conditions**: always, never, or keyword-based (containsAny/containsAll)

Generate a task ID like `task-{timestamp}-{random}`.
Write the task to the SQLite database at `.claude/heartbeat/store/heartbeat.db`.

```bash
sqlite3 .claude/heartbeat/store/heartbeat.db "INSERT INTO tasks (id, group_id, prompt, schedule_type, schedule_value, context_mode, next_run, notify_on, status, created_at) VALUES ('$TASK_ID', '$GROUP_JID', '$PROMPT', '$TYPE', '$VALUE', '$MODE', '$NEXT_RUN', '$NOTIFY', 'active', '$NOW')"
```

### `/heartbeat list [group-folder]`

List active tasks. Query the database:

```bash
sqlite3 -header -column .claude/heartbeat/store/heartbeat.db "SELECT id, group_id, schedule_type, schedule_value, status, next_run FROM tasks WHERE status != 'completed'"
```

### `/heartbeat remove <task-id>`

Delete a task:

```bash
sqlite3 .claude/heartbeat/store/heartbeat.db "DELETE FROM tasks WHERE id = '$TASK_ID'"
```

### `/heartbeat logs [group-folder]`

Show recent activity:

```bash
sqlite3 -header -column .claude/heartbeat/store/heartbeat.db "SELECT type, group_id, started_at, duration_ms, status, summary FROM activity_log ORDER BY started_at DESC LIMIT 20"
```
```

**Step 4: Create heartbeat-group.md**

```markdown
---
description: "Manage WhatsApp groups: register, config, remove"
argument-hint: "<register|config|remove> [group-folder]"
allowed-tools:
  - "Read"
  - "Write"
  - "Bash(sqlite3:*)"
  - "Bash(tail:*)"
  - "Bash(mkdir:*)"
  - "AskUserQuestion"
---

# Heartbeat Group Management

Manage WhatsApp groups registered with the heartbeat daemon.

## Arguments

Parse `$ARGUMENTS` to determine the subcommand:

### `/heartbeat-group register`

Register a new WhatsApp group:

1. The daemon must be running. Check: `launchctl list | grep claude-heartbeat`

2. Ask the user which group to register. They need to provide:
   - **Group name**: Human-readable name
   - **WhatsApp JID**: The group's JID (they can find this in daemon logs when messages arrive)
   - **Folder name**: Directory name for this group's config (lowercase, no spaces)
   - **Trigger word**: When the bot should respond (e.g., "@Andy", or "always" for DMs)
   - **Model override**: Optional model (e.g., "claude-haiku-4-5-20251001") or null for default
   - **Is main group?**: Whether this is the admin group (only one allowed)

3. Create the group directory and default CLAUDE.md:

```bash
mkdir -p .claude/heartbeat/groups/{folder}
```

Write `.claude/heartbeat/groups/{folder}/CLAUDE.md` with a default system prompt:
```markdown
# {Group Name}

You are a helpful assistant in the {Group Name} WhatsApp group.

## Guidelines
- Be concise in your responses (WhatsApp messages should be short)
- Respond in the same language as the message
- If asked about something you don't know, say so
```

4. Insert into the database:

```bash
sqlite3 .claude/heartbeat/store/heartbeat.db "INSERT INTO groups (id, name, folder, trigger_word, model, is_main, active, registered_at) VALUES ('$JID', '$NAME', '$FOLDER', '$TRIGGER', $MODEL, $IS_MAIN, 1, '$NOW')"
```

### `/heartbeat-group config <folder>`

Update group settings. Read current config from DB, let user modify trigger, model, or edit CLAUDE.md.

### `/heartbeat-group remove <folder>`

Deactivate a group:

```bash
sqlite3 .claude/heartbeat/store/heartbeat.db "UPDATE groups SET active = 0 WHERE folder = '$FOLDER'"
```

Note: Does not delete the group directory or CLAUDE.md.
```

**Step 5: Commit**

```bash
git add plugins/heartbeat/commands/
git commit -m "feat(heartbeat): add plugin commands (start, stop, heartbeat, group)"
```

---

### Task 13: Plugin CLAUDE.md

**Files:**
- Create: `plugins/heartbeat/CLAUDE.md`

**Step 1: Create CLAUDE.md**

```markdown
# Heartbeat Plugin

Autonomous heartbeat daemon with WhatsApp messaging, multi-group support, and scheduled prompt execution.

## Architecture

- **Daemon**: Node.js process managed by launchd (`com.claude-heartbeat` plist)
- **WhatsApp**: Baileys library for bidirectional messaging
- **Storage**: SQLite at `.claude/heartbeat/store/heartbeat.db`
- **Execution**: All Claude interactions via `claude -p` (headless CLI, TOS compliant)
- **Scheduling**: Cron/interval/once tasks with adaptive heartbeat intervals

## State Location

All state lives in `.claude/heartbeat/` in the user's project:
- `store/auth/` — WhatsApp credentials (gitignore!)
- `store/heartbeat.db` — SQLite database
- `groups/{name}/CLAUDE.md` — Per-group system prompts
- `groups/{name}/memory/` — Optional memory files
- `logs/` — Daemon stdout/stderr
- `config.json` — Global settings

## Commands

| Command | Description |
|---------|-------------|
| `/heartbeat-start` | Setup daemon, install launchd, WhatsApp QR auth |
| `/heartbeat-stop` | Stop daemon, remove launchd service |
| `/heartbeat status` | Show daemon status and overview |
| `/heartbeat add <group>` | Create scheduled task |
| `/heartbeat list` | List active tasks |
| `/heartbeat remove <id>` | Delete a task |
| `/heartbeat logs` | View recent activity |
| `/heartbeat-group register` | Register WhatsApp group |
| `/heartbeat-group config <g>` | Update group settings |
| `/heartbeat-group remove <g>` | Deactivate group |

## TOS Compliance

Uses `claude -p` (official Claude Code CLI) for all AI interactions. No OAuth token extraction, no third-party API routing. Each execution is discrete and stateless.
```

**Step 2: Commit**

```bash
git add plugins/heartbeat/CLAUDE.md
git commit -m "feat(heartbeat): add plugin CLAUDE.md documentation"
```

---

### Task 14: Marketplace Entry & Version Bump

**Files:**
- Modify: `.claude-plugin/marketplace.json`

**Step 1: Add heartbeat to marketplace.json**

Add this entry to the `plugins` array in `.claude-plugin/marketplace.json`:

```json
{
  "name": "heartbeat",
  "description": "Autonomous heartbeat daemon with WhatsApp messaging, multi-group support, and scheduled prompt execution via claude -p",
  "version": "1.0.0",
  "author": {
    "name": "jvelez79"
  },
  "source": "./plugins/heartbeat",
  "category": "productivity",
  "homepage": "https://github.com/jvelez79/claude-code-plugins",
  "tags": ["heartbeat", "cron", "whatsapp", "daemon", "autonomous", "scheduling"]
}
```

**Step 2: Commit**

```bash
git add .claude-plugin/marketplace.json
git commit -m "feat(heartbeat): add to marketplace registry"
```

---

### Task 15: Integration Test — Full Build & Smoke Test

**Step 1: Full build**

```bash
cd plugins/heartbeat && npm install && npx tsc
```

Expected: Clean build, all files in `dist/`.

**Step 2: Verify dist output**

```bash
ls plugins/heartbeat/dist/
```

Expected: `daemon.js`, `config.js`, `types.js`, `db.js`, `executor.js`, `prefilter.js`, `whatsapp.js`, `router.js`, `scheduler.js`, `logger.js` (plus `.js.map` and `.d.ts` files).

**Step 3: Verify scripts are executable**

```bash
ls -la plugins/heartbeat/scripts/
```

Expected: `install-daemon.sh` and `uninstall-daemon.sh` with execute permissions.

**Step 4: Verify plugin structure**

```bash
find plugins/heartbeat -type f | sort
```

Expected: All files from the design doc present.

**Step 5: Commit final state**

```bash
git add -A plugins/heartbeat/
git commit -m "feat(heartbeat): complete v1.0.0 plugin implementation"
```

---

## Summary

| Task | Description | Key Files |
|------|-------------|-----------|
| 1 | Plugin scaffold | plugin.json, package.json, tsconfig.json |
| 2 | Types & Config | types.ts, config.ts |
| 3 | Logger | logger.ts |
| 4 | Database | db.ts (schema + CRUD) |
| 5 | Executor | executor.ts (claude -p wrapper) |
| 6 | Prefilter | prefilter.ts (Tier 0 checks) |
| 7 | WhatsApp | whatsapp.ts (Baileys connection) |
| 8 | Router | router.ts (message routing + prompt building) |
| 9 | Scheduler | scheduler.ts (cron/interval, adaptive) |
| 10 | Daemon | daemon.ts (entry point, boots everything) |
| 11 | launchd | plist template, install/uninstall scripts |
| 12 | Commands | heartbeat-start, stop, heartbeat, heartbeat-group |
| 13 | CLAUDE.md | Plugin documentation |
| 14 | Marketplace | Add entry to marketplace.json |
| 15 | Integration test | Full build + smoke test |
