---
description: "Cancel an active UI improvement loop"
allowed-tools:
  - "Bash(test -f .claude/ui-loop.local.md:*)"
  - "Bash(rm .claude/ui-loop.local.md)"
  - "Read(.claude/ui-loop.local.md)"
---

# Cancel UI Loop

Cancel an active UI improvement loop.

## Process

1. **Check if loop exists**
   ```bash
   test -f .claude/ui-loop.local.md
   ```

2. **If loop exists, read current state**
   - Read the file at `.claude/ui-loop.local.md`
   - Extract the current iteration and score

3. **Delete the state file**
   ```bash
   rm .claude/ui-loop.local.md
   ```

4. **Report cancellation**
   - Show the user what iteration they were on
   - Show the last known score
   - Confirm the loop has been cancelled

## Output

If loop was active:
```
🛑 UI Improve Loop cancelled

Status at cancellation:
- Iteration: X/Y
- Last score: Z/10
- Target: [description]

The loop state file has been removed.
```

If no loop was active:
```
ℹ️ No active UI Improve Loop found.

There is no state file at .claude/ui-loop.local.md
```
