#!/usr/bin/env node
// Helper script for safe parameterized SQLite operations
// Usage: node heartbeat-db.js <operation> [args...]

const Database = require('better-sqlite3');
const path = require('path');

const dataDir = process.env.HEARTBEAT_DATA_DIR
  || path.resolve(process.cwd(), '.claude', 'pa', 'heartbeat');
const dbPath = path.join(dataDir, 'store', 'heartbeat.db');

const db = new Database(dbPath);
const op = process.argv[2];

try {
  switch (op) {
    case 'insert-task': {
      const [id, groupId, prompt, scheduleType, scheduleValue, contextMode, nextRun, notifyOn] = process.argv.slice(3);
      db.prepare(`INSERT INTO tasks (id, group_id, prompt, schedule_type, schedule_value, context_mode, next_run, notify_on, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', datetime('now'))`).run(id, groupId, prompt, scheduleType, scheduleValue, contextMode, nextRun, notifyOn);
      console.log(`Task ${id} created`);
      break;
    }
    case 'delete-task': {
      const [taskId] = process.argv.slice(3);
      const result = db.prepare('DELETE FROM tasks WHERE id = ?').run(taskId);
      console.log(result.changes > 0 ? `Task ${taskId} deleted` : `Task ${taskId} not found`);
      break;
    }
    case 'list-tasks': {
      const rows = db.prepare("SELECT id, group_id, schedule_type, schedule_value, status, next_run FROM tasks WHERE status != 'completed'").all();
      if (rows.length === 0) { console.log('No active tasks'); break; }
      console.log('ID | Group | Type | Value | Status | Next Run');
      console.log('---|-------|------|-------|--------|--------');
      rows.forEach(r => console.log(`${r.id} | ${r.group_id} | ${r.schedule_type} | ${r.schedule_value} | ${r.status} | ${r.next_run || 'N/A'}`));
      break;
    }
    case 'list-logs': {
      const limit = process.argv[3] || '20';
      const rows = db.prepare('SELECT type, group_id, started_at, duration_ms, status, summary FROM activity_log ORDER BY started_at DESC LIMIT ?').all(parseInt(limit));
      if (rows.length === 0) { console.log('No activity logged'); break; }
      console.log('Type | Group | Started | Duration(ms) | Status | Summary');
      console.log('-----|-------|---------|-------------|--------|-------');
      rows.forEach(r => console.log(`${r.type} | ${r.group_id} | ${r.started_at} | ${r.duration_ms || 'N/A'} | ${r.status} | ${r.summary || 'N/A'}`));
      break;
    }
    case 'insert-group': {
      const [id, name, folder, triggerWord, model, isMain] = process.argv.slice(3);
      db.prepare(`INSERT INTO groups (id, name, folder, trigger_word, model, is_main, active, registered_at) VALUES (?, ?, ?, ?, ?, ?, 1, datetime('now'))`).run(id, name, folder, triggerWord, model === 'null' ? null : model, parseInt(isMain));
      console.log(`Group "${name}" registered`);
      break;
    }
    case 'deactivate-group': {
      const [folder] = process.argv.slice(3);
      const result = db.prepare('UPDATE groups SET active = 0 WHERE folder = ?').run(folder);
      console.log(result.changes > 0 ? `Group "${folder}" deactivated` : `Group "${folder}" not found`);
      break;
    }
    case 'status': {
      const groups = db.prepare('SELECT COUNT(*) as count FROM groups WHERE active = 1').get();
      const tasks = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'active'").get();
      const recent = db.prepare('SELECT * FROM activity_log ORDER BY started_at DESC LIMIT 5').all();
      console.log(`Groups: ${groups.count} active`);
      console.log(`Tasks: ${tasks.count} active`);
      console.log(`\nRecent activity:`);
      recent.forEach(r => console.log(`  [${r.status}] ${r.type} @ ${r.started_at} (${r.duration_ms}ms)`));
      break;
    }
    default:
      console.error(`Unknown operation: ${op}`);
      console.error('Available: insert-task, delete-task, list-tasks, list-logs, insert-group, deactivate-group, status');
      process.exit(1);
  }
} finally {
  db.close();
}
