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

2. **List available WhatsApp groups** to let the user pick one (the JID is obtained automatically):

```bash
node ${CLAUDE_PLUGIN_ROOT}/scripts/list-wa-groups.js
```

This connects to WhatsApp, fetches all groups, and displays them with their JID and participant count. Parse the JSON after the `---JSON---` marker to get structured data.

3. Present the list to the user with AskUserQuestion and let them select which group to register.

4. Ask the user for the remaining settings:
   - **Folder name**: short slug for the directory (e.g., `familia`, `trabajo`, `main`)
   - **Trigger word**: when the bot should respond (default: `@Bot`). Options: `@Bot`, `always`, or a custom word
   - **Model override**: optional model (e.g., `sonnet`, `haiku`). Use `null` for default.
   - **Is main group?**: only one group should be the admin group (receives system alerts, can manage other groups)

5. Create directory: `mkdir -p .claude/pa/heartbeat/groups/{folder}`

6. Create default CLAUDE.md for the group with a template system prompt. Write to `.claude/pa/heartbeat/groups/{folder}/CLAUDE.md`:
```markdown
# {Group Name} — System Prompt

You are an assistant for the "{Group Name}" WhatsApp group.
Respond concisely in the language used by the group members.
Be helpful, friendly, and respect the group's context.
```

7. Insert into database:

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
