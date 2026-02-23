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

5. Once connected, create a default config if it doesn't exist. Write `.claude/heartbeat/config.json`:
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

6. Tell the user the daemon is running and how to register groups, add tasks, and check status.
