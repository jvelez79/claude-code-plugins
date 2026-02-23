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
Write the task to the SQLite database at `.claude/heartbeat/store/heartbeat.db`:

```bash
sqlite3 .claude/heartbeat/store/heartbeat.db "INSERT INTO tasks (id, group_id, prompt, schedule_type, schedule_value, context_mode, next_run, notify_on, status, created_at) VALUES ('$TASK_ID', '$GROUP_JID', '$PROMPT', '$TYPE', '$VALUE', '$MODE', '$NEXT_RUN', '$NOTIFY', 'active', '$NOW')"
```

### `/heartbeat list [group-folder]`

List active tasks:

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
