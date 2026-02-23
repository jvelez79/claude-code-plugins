---
description: "Manage WhatsApp groups: register, config, remove"
argument-hint: "<register|config|remove> [group-folder]"
allowed-tools:
  - "Read"
  - "Write"
  - "Bash(node:*)"
  - "Bash(tail:*)"
  - "Bash(mkdir:*)"
  - "AskUserQuestion"
---

# Heartbeat Group Management

Manage WhatsApp groups registered with the heartbeat daemon.

All database operations use the parameterized helper script to prevent SQL injection:
```
node ${CLAUDE_PLUGIN_ROOT}/scripts/heartbeat-db.js <operation> [args...]
```

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
node ${CLAUDE_PLUGIN_ROOT}/scripts/heartbeat-db.js insert-group "$JID" "$NAME" "$FOLDER" "$TRIGGER" "$MODEL" "$IS_MAIN"
```

### `/heartbeat-group config <folder>`

Update group settings. Read current config from DB, let user modify trigger, model, or edit CLAUDE.md.

### `/heartbeat-group remove <folder>`

Deactivate a group:

```bash
node ${CLAUDE_PLUGIN_ROOT}/scripts/heartbeat-db.js deactivate-group "$FOLDER"
```
