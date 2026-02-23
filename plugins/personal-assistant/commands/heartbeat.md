---
description: "Manage heartbeat tasks: add, list, remove, status, logs"
argument-hint: "<add|list|remove|status|logs> [args]"
allowed-tools:
  - "Read"
  - "Write"
  - "Bash(launchctl:*)"
  - "Bash(tail:*)"
  - "Bash(node:*)"
  - "AskUserQuestion"
---

# Heartbeat Management

Manage heartbeat tasks and check daemon status.

All database operations use the parameterized helper script to prevent SQL injection:
```
node ${CLAUDE_PLUGIN_ROOT}/scripts/heartbeat-db.js <operation> [args...]
```

## Arguments

Parse `$ARGUMENTS` to determine the subcommand:

### `/heartbeat status`

Show daemon status and overview:
1. Check if launchd service is running: `launchctl list | grep claude-heartbeat`
2. Read `.claude/pa/heartbeat/config.json` for current settings
3. Query the database for counts and recent activity:

```bash
node ${CLAUDE_PLUGIN_ROOT}/scripts/heartbeat-db.js status
```

### `/heartbeat add <group-folder>`

Create a new scheduled task for a group. Ask the user interactively:
1. **Prompt**: What should Claude do? (inline text or path to .md file)
2. **Schedule type**: cron, interval, or once
3. **Schedule value**: cron expression (e.g., "0 9 * * 1-5") or interval in minutes
4. **Context mode**: isolated (fresh each time) or group (include message history)
5. **Notify conditions**: always, never, or keyword-based (containsAny/containsAll)

Generate a task ID like `task-{timestamp}-{random}`.
Write the task to the SQLite database:

```bash
node ${CLAUDE_PLUGIN_ROOT}/scripts/heartbeat-db.js insert-task "$TASK_ID" "$GROUP_JID" "$PROMPT" "$TYPE" "$VALUE" "$MODE" "$NEXT_RUN" "$NOTIFY"
```

### `/heartbeat list [group-folder]`

List active tasks:

```bash
node ${CLAUDE_PLUGIN_ROOT}/scripts/heartbeat-db.js list-tasks
```

### `/heartbeat remove <task-id>`

Delete a task:

```bash
node ${CLAUDE_PLUGIN_ROOT}/scripts/heartbeat-db.js delete-task "$TASK_ID"
```

### `/heartbeat logs [group-folder]`

Show recent activity:

```bash
node ${CLAUDE_PLUGIN_ROOT}/scripts/heartbeat-db.js list-logs
```
