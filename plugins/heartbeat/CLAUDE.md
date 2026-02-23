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
