---
description: "Show help for UI Improve Loop plugin"
---

# UI Improve Loop - Help

Display help information for the UI Improve Loop plugin.

## Overview

The UI Improve Loop plugin automatically improves your web application's UI through iterative review and implementation cycles. It uses Chrome automation to take screenshots, evaluates UI quality using a professional design framework, and implements improvements until a target quality score is reached.

## Commands

### /ui-improve-loop

Start an iterative UI improvement loop.

**Usage:**
```
/ui-improve-loop "<description>" [options]
```

**Arguments:**
- `<description>` - Natural language description of the screen to improve

**Options:**
- `--threshold <N>` - Target score to reach (1-10, default: 9)
- `--max-iterations <N>` - Maximum iterations before stopping (default: 10)
- `--url <URL>` - Direct URL to navigate to (optional)
- `--focus <area>` - Specific area to focus improvements on (optional)

**Examples:**
```
/ui-improve-loop "Login page with email form"
/ui-improve-loop "Dashboard showing user stats" --threshold 8
/ui-improve-loop "Settings page" --url http://localhost:3000/settings --max-iterations 5
```

### /ui-review

Run a single UI review without the improvement loop.

**Usage:**
```
/ui-review [screenshot or description]
```

This command evaluates the UI and provides a score and recommendations, but does not implement changes or loop.

### /cancel-ui-loop

Cancel an active improvement loop.

**Usage:**
```
/cancel-ui-loop
```

This stops the current loop and removes the state file.

## How It Works

1. **Initialize** - Creates a state file with your configuration
2. **Navigate** - Uses Chrome to navigate to the described screen
3. **Screenshot** - Captures the current screen state
4. **Review** - Evaluates UI against professional design standards
5. **Check Score** - If score >= threshold, loop completes
6. **Implement** - Makes code changes to fix critical issues
7. **Repeat** - Continues until threshold reached or max iterations

## Scoring System

| Score | Quality Level |
|-------|--------------|
| 1-3 | Broken, major issues |
| 4-5 | Amateur, inconsistent |
| 6-7 | Decent, needs polish |
| 8 | Professional |
| 9 | Excellent, production-ready |
| 10 | Exceptional |

## Requirements

- **Claude Code CLI** - The Claude Code command line tool
- **Chrome MCP** - The `claude-in-chrome` MCP extension must be installed and running
- **Web Application** - Your app should be running on a local dev server

## State File

The loop maintains state in `.claude/ui-loop.local.md` in your project directory. This file tracks:
- Current iteration
- Score history
- Navigation steps
- Files modified

## Tips

- Start with a lower threshold (7-8) for initial improvements
- Use `--max-iterations` to prevent runaway loops
- The loop works best with hot-reload enabled
- Focus on one screen at a time for best results

## Troubleshooting

**Loop not starting:**
- Make sure Chrome MCP is running
- Check that your dev server is accessible

**Score not improving:**
- Review the implementation suggestions
- Some issues may require manual intervention

**Loop running too long:**
- Use `--max-iterations` to set a limit
- Run `/cancel-ui-loop` to stop immediately

## More Information

Repository: https://github.com/jvelez79/ui-improve-loop
