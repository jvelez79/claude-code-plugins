import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { DB_PATH, STORE_DIR, loadConfig } from './config.js';
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
  if (!db) throw new Error('Database not initialized. Call initDatabase() first.');
  return db;
}

export function closeDatabase(): void {
  if (db) {
    db.close();
  }
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
  const config = loadConfig();
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: config.timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const todayStr = formatter.format(now); // YYYY-MM-DD
  const todayStart = new Date(`${todayStr}T00:00:00`);
  const row = db.prepare(`
    SELECT COALESCE(SUM(cost_estimate), 0) as total
    FROM activity_log WHERE started_at >= ? AND status = 'success'
  `).get(todayStart.toISOString()) as { total: number };
  return row.total;
}
