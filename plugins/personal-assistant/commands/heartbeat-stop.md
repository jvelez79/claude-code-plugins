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
Note that data in `.claude/pa/heartbeat/` is preserved.
