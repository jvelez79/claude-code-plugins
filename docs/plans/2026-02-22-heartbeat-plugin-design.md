# Heartbeat Plugin — Design Document

**Date:** 2026-02-22
**Status:** Approved
**Author:** juanca + Claude

## Problem Statement

We need an autonomous heartbeat system packaged as a Claude Code plugin that:
1. Executes predefined prompts on a cron schedule via `claude -p` (headless CLI)
2. Provides bidirectional WhatsApp messaging (receive messages, respond via Claude)
3. Supports multi-group configuration with per-group personality and settings
4. Complies with Anthropic's Terms of Service

## Anthropic TOS Compliance

Based on research of Anthropic's legal documentation (as of Feb 2026):

**Why this is compliant:**
- All Claude interactions use `claude -p` (official Claude Code CLI) — OAuth authentication within Claude Code is explicitly permitted
- Each execution is discrete and independent — not an infinite loop hijacking tokens
- No OAuth token extraction — we invoke Claude Code as intended
- No third-party API routing — the daemon only handles I/O (WhatsApp), not AI inference
- Quiet hours and budget limits prevent abuse of "ordinary individual usage" expectation

**What would NOT be compliant:**
- Extracting OAuth tokens and using them in a custom API client
- Routing requests through subscription credentials on behalf of other users
- Using the Agent SDK with OAuth tokens (requires API keys)

**Sources:**
- https://code.claude.com/docs/en/legal-and-compliance
- https://www.anthropic.com/legal/aup
- https://www.anthropic.com/legal/consumer-terms

## Architecture

### High-Level Overview

```
launchd (com.claude-heartbeat.plist)
  KeepAlive: true | RunAtLoad: true
          |
          v
  daemon.ts (Node.js single process)
  |
  +-- WhatsApp I/O (Baileys)
  |     msg in --> Router --> Group lookup --> claude -p --> Reply
  |
  +-- Task Scheduler (setInterval 60s)
  |     For each due task:
  |       1. Tier 0 prefilter (quiet hours, budget)
  |       2. claude -p "prompt"
  |       3. Log result
  |       4. Conditional notify via WhatsApp
  |       5. Update next_run (adaptive)
  |
  +-- Session Manager (per-group claude sessions)
  |
  +-- SQLite DB (messages, tasks, activity_log)
```

### Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Scheduler | launchd (macOS native) | Survives reboots, native KeepAlive, no extra deps |
| WhatsApp lib | Baileys | Same as nanoclaw, proven, open-source |
| Storage | SQLite | Multi-group messages + tasks need relational queries |
| Claude execution | `claude -p` (CLI headless) | TOS compliant, uses official CLI, stateless per call |
| Process model | Single Node.js process | Simple, Baileys needs persistent WebSocket |
| State location | `.claude/heartbeat/` | Standard plugin state directory pattern |
| Container isolation | None | Not needed for single-user plugin (unlike nanoclaw) |

## Plugin Structure

```
plugins/heartbeat/
├── .claude-plugin/
│   └── plugin.json                 # Plugin metadata
├── commands/
│   ├── heartbeat.md                # /heartbeat add|list|remove|status
│   ├── heartbeat-start.md          # Setup: npm install, QR auth, launchd install
│   ├── heartbeat-stop.md           # Tear down daemon + launchd
│   └── heartbeat-group.md          # /heartbeat-group register|config|remove
├── agents/
│   └── heartbeat-setup.md          # Interactive setup agent (guides QR scan, etc)
├── src/
│   ├── daemon.ts                   # Entry point: boots WhatsApp + scheduler
│   ├── whatsapp.ts                 # Baileys connection, auth, message send/receive
│   ├── router.ts                   # Message routing: group lookup, trigger check
│   ├── scheduler.ts                # Task scheduler: cron/interval/once, adaptive intervals
│   ├── prefilter.ts                # Tier 0 checks: quiet hours, budget, priority
│   ├── executor.ts                 # claude -p wrapper with timeout and retry
│   ├── notifier.ts                 # Send results via WhatsApp (+ extensible)
│   ├── db.ts                       # SQLite schema, migrations, queries
│   ├── config.ts                   # Constants, env vars, defaults
│   └── types.ts                    # TypeScript interfaces
├── templates/
│   └── com.claude-heartbeat.plist  # launchd plist template with placeholders
├── scripts/
│   ├── install-daemon.sh           # Compile TS, render plist, launchctl load
│   └── uninstall-daemon.sh         # launchctl unload, cleanup
├── CLAUDE.md
└── README.md
```

### User State (in target project)

```
.claude/heartbeat/
├── store/
│   ├── auth/                       # WhatsApp auth state (Baileys credentials)
│   └── heartbeat.db                # SQLite database
├── groups/
│   ├── main/
│   │   ├── CLAUDE.md               # System prompt for main/admin group
│   │   └── memory/                 # Optional memory files
│   ├── familia/
│   │   └── CLAUDE.md               # System prompt for this group
│   └── trabajo/
│       └── CLAUDE.md
├── logs/
│   ├── daemon.log                  # stdout
│   └── daemon.error.log            # stderr
└── config.json                     # Global settings
```

## SQLite Schema

```sql
CREATE TABLE groups (
  id TEXT PRIMARY KEY,              -- WhatsApp JID (e.g., 120363336...@g.us)
  name TEXT NOT NULL,               -- Human-readable name
  folder TEXT NOT NULL UNIQUE,      -- Directory name under groups/
  trigger_word TEXT DEFAULT '@Bot', -- When to respond (trigger pattern)
  model TEXT,                       -- Model override (NULL = use default)
  is_main INTEGER DEFAULT 0,       -- Only 1 group is admin
  active INTEGER DEFAULT 1,
  registered_at TEXT NOT NULL
);

CREATE TABLE messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  group_id TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  content TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  FOREIGN KEY (group_id) REFERENCES groups(id)
);

CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL,
  prompt TEXT NOT NULL,             -- Inline prompt or path to .md file
  schedule_type TEXT NOT NULL,      -- 'cron' | 'interval' | 'once'
  schedule_value TEXT NOT NULL,     -- Cron expression or milliseconds
  context_mode TEXT DEFAULT 'isolated', -- 'isolated' (fresh) | 'group' (with history)
  next_run TEXT,
  last_run TEXT,
  last_result TEXT,
  notify_on TEXT,                   -- JSON: conditions for notification
  status TEXT DEFAULT 'active',     -- 'active' | 'paused' | 'completed'
  created_at TEXT NOT NULL,
  FOREIGN KEY (group_id) REFERENCES groups(id)
);

CREATE TABLE activity_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,               -- 'heartbeat' | 'message' | 'task'
  group_id TEXT NOT NULL,
  started_at TEXT NOT NULL,
  completed_at TEXT,
  duration_ms INTEGER,
  status TEXT NOT NULL,             -- 'success' | 'error' | 'skipped'
  summary TEXT,
  cost_estimate REAL
);
```

## Execution Flows

### Flow 1: Incoming WhatsApp Message

```
1. Baileys receives message event
2. Router checks: is group registered? → No → ignore
3. Router checks: trigger match? (@Bot / DM / always) → No → ignore
4. Store message in SQLite (messages table)
5. Fetch recent messages for context (last N from same group)
6. Build prompt:
   - System context: groups/{folder}/CLAUDE.md
   - Message history: <messages><message sender="Juan" time="...">text</message>...</messages>
7. Execute: claude -p "prompt" [--model override if group has one]
8. Capture stdout as response
9. Send response via WhatsApp to the group
10. Log execution in activity_log
```

### Flow 2: Scheduled Heartbeat Task

```
1. Scheduler tick (every 60 seconds)
2. Query: SELECT * FROM tasks WHERE next_run <= now AND status = 'active'
3. For each due task:
   a. Tier 0 Prefilter:
      - Quiet hours (23:00 - 07:00)? → skip, reschedule
      - Daily budget exceeded? → skip, reschedule
   b. Build prompt:
      - Base: task.prompt (inline or from .md file)
      - If context_mode = 'group': append recent group messages
      - If memory files exist: append as <active-projects>, <pending-actions>
   c. Execute: claude -p "prompt" [--model group.model]
   d. Evaluate notify_on conditions against output
   e. If conditions match → send result via WhatsApp to task's group
   f. Calculate next_run:
      - If cron: next cron occurrence
      - If interval: now + interval (adaptive if heartbeat)
      - If once: mark status = 'completed'
   g. Update task in DB (last_run, last_result, next_run)
   h. Log in activity_log (type, duration, status, cost_estimate)
```

### Flow 3: Adaptive Heartbeat Intervals

Inspired by nanoclaw's tier system:

```
Default:     30 min
Quiet hours: 60 min (23:00 - 07:00)
Post-action: 10 min (after Claude took an action — detected by keywords)
High activity: 15 min (10+ messages in last 15 min)
```

Detection heuristic for "action taken":
- Output contains: DELEGATE, sent, created, updated, scheduled
- These keywords indicate Claude did something proactive

### Flow 4: Tier 0 Prefilter

Runs BEFORE spawning `claude -p` to avoid unnecessary API cost:

```typescript
interface PrefilterResult {
  shouldEscalate: boolean;
  reason: string;
  context?: string;      // Extra context to inject into prompt
  durationMs: number;
}

// Checks (all pure Node.js, no Claude needed):
// 1. Quiet hours → skip unless priority
// 2. Daily budget exceeded → skip
// 3. Priority contact sent message in last 30min → escalate
// 4. Pending tasks in memory files → escalate
// 5. High message activity → escalate
```

## Plugin Commands

| Command | Description | Example |
|---------|-------------|---------|
| `/heartbeat-start` | Full setup: npm install, WhatsApp QR auth, install launchd, start daemon | `/heartbeat-start` |
| `/heartbeat-stop` | Stop daemon, uninstall launchd | `/heartbeat-stop` |
| `/heartbeat status` | Show daemon status, registered groups, active tasks | `/heartbeat status` |
| `/heartbeat-group register` | Register a WhatsApp group (interactive: select group, set trigger, model) | `/heartbeat-group register` |
| `/heartbeat-group config <group>` | Update group settings (trigger, model, CLAUDE.md) | `/heartbeat-group config familia` |
| `/heartbeat-group remove <group>` | Unregister group | `/heartbeat-group remove trabajo` |
| `/heartbeat add <group>` | Create scheduled task (interactive: prompt, schedule, notify conditions) | `/heartbeat add main` |
| `/heartbeat list [group]` | List active tasks, optionally filtered by group | `/heartbeat list` |
| `/heartbeat remove <task-id>` | Delete a scheduled task | `/heartbeat remove task-abc123` |
| `/heartbeat logs [group]` | View recent activity log | `/heartbeat logs familia` |

## launchd Configuration

Template at `templates/com.claude-heartbeat.plist`:

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
        <string>{{HOME}}/.local/bin:/usr/local/bin:/usr/bin:/bin</string>
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

## Global Configuration

`.claude/heartbeat/config.json`:

```json
{
  "quiet_hours": {
    "start": "23:00",
    "end": "07:00"
  },
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

## Group Registration

When registering a group:

1. Daemon lists available WhatsApp groups
2. User selects one
3. Creates entry in `groups` table with:
   - JID, name, folder, trigger_word, model (optional)
4. Creates directory `groups/{folder}/`
5. Creates default `CLAUDE.md` for the group
6. The **main** group (is_main=1) has admin privileges:
   - Can register/remove other groups
   - Can create tasks for any group
   - Receives system alerts (daemon errors, budget warnings)

Non-main groups can only create tasks for themselves.

## Dependencies

```json
{
  "dependencies": {
    "baileys": "^6.x",
    "better-sqlite3": "^11.x",
    "cron-parser": "^4.x",
    "pino": "^9.x"
  },
  "devDependencies": {
    "typescript": "^5.x",
    "@types/better-sqlite3": "^7.x",
    "@types/node": "^22.x"
  }
}
```

Minimal dependencies: WhatsApp, SQLite, cron parsing, structured logging.

## Security Considerations

- WhatsApp auth state stored in `.claude/heartbeat/store/auth/` (gitignored)
- No API keys stored in plugin code — uses Claude Code's own auth
- Non-main groups cannot escalate privileges (create tasks for other groups)
- Budget limit prevents runaway cost
- Quiet hours prevent overnight abuse
- Max concurrent executions prevents resource exhaustion
- All prompts are user-defined — no hidden prompt injection vectors

## Out of Scope (v1)

- Container isolation (can add later if needed)
- Smart model routing (use per-group model override instead)
- Voice notes / image / document handling (text only for v1)
- Multi-channel beyond WhatsApp (Telegram, Slack — future plugins)
- Session persistence across `claude -p` calls (stateless by design)
- Web dashboard / Mac app WebSocket

## Future Considerations (v2+)

- Session persistence: pass `--session-id` to `claude -p` if supported
- Image handling: forward images as file paths to Claude
- Voice transcription: Whisper integration for voice notes
- Telegram adapter: alternative to WhatsApp
- Remote access: SSH tunnel for managing daemon from phone
