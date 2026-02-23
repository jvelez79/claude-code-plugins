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
2. Ask the user for: group name, WhatsApp JID, folder name, trigger word, model override, is main group?
3. Create directory: `mkdir -p .claude/pa/heartbeat/groups/{folder}`
4. Create default CLAUDE.md for the group with a template system prompt
5. Insert into database:

```bash
sqlite3 .claude/pa/heartbeat/store/heartbeat.db "INSERT INTO groups (id, name, folder, trigger_word, model, is_main, active, registered_at) VALUES ('$JID', '$NAME', '$FOLDER', '$TRIGGER', $MODEL, $IS_MAIN, 1, '$NOW')"
```

### `/heartbeat-group config <folder>`

Update group settings. Read current config from DB, let user modify trigger, model, or edit CLAUDE.md.

### `/heartbeat-group remove <folder>`

Deactivate a group:

```bash
sqlite3 .claude/pa/heartbeat/store/heartbeat.db "UPDATE groups SET active = 0 WHERE folder = '$FOLDER'"
```
