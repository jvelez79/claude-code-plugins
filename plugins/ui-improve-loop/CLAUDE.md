# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Claude Code Plugin** that implements an iterative UI improvement loop. It automatically evaluates web application UI quality, generates improvement recommendations, implements CSS/component changes, and re-evaluates until reaching a target quality score.

## Architecture

### Agent-based Workflow

The plugin uses a pipeline of specialized agents, each with isolated context and specific tool access:

```
/ui-improve-loop command
    ↓
Navigator Agent → Navigate to target screen (Chrome MCP tools)
    ↓
Screenshotter Agent → Capture screenshot
    ↓
UI Reviewer Agent → Evaluate UI (score 1-10)
    ↓
[If score < threshold]
    ↓
UI Implementer Agent → Modify code to fix issues (file tools)
    ↓
Stop Hook → Intercept exit, continue loop if needed
```

### State Persistence

State is stored in `.claude/ui-loop.local.md` using YAML frontmatter:
- Tracks: active status, iteration count, threshold, current score, target description
- Persisted across session boundaries
- Read by stop hook to determine loop continuation

### Hook-based Loop Control

`hooks/stop-hook.sh` runs on every session exit:
- Reads state file to check if loop should continue
- Outputs JSON decision: `{"decision": "block", "message": "..."}` to block exit and continue loop
- Increments iteration counter between cycles

## Key Files

| File | Purpose |
|------|---------|
| `commands/ui-improve-loop.md` | Main workflow orchestrator |
| `commands/ui-review.md` | UI evaluation framework (detailed scoring criteria) |
| `agents/*.md` | Specialized sub-agents (navigator, screenshotter, reviewer, implementer) |
| `scripts/setup-ui-loop.sh` | Initialize state file with parsed arguments |
| `hooks/stop-hook.sh` | Session exit interception for loop continuation |

## Plugin Commands

```bash
# Start iterative improvement loop
/ui-improve-loop "<description>" [--threshold 9] [--max-iterations 10] [--url URL] [--focus area]

# Single UI review without loop
/ui-review [screenshot or description]

# Cancel active loop
/cancel-ui-loop

# Show help
/help
```

## Command Options

- `--threshold <1-10>`: Quality score to achieve (default: 9)
- `--max-iterations <N>`: Maximum loop cycles (default: 10)
- `--url <URL>`: Direct URL instead of navigation
- `--focus <area>`: Specific UI area to focus on

## Tool Access by Agent

| Agent | Tools |
|-------|-------|
| Navigator | `mcp__claude-in-chrome__*` (Chrome automation) |
| Screenshotter | `mcp__claude-in-chrome__computer`, `resize_window` |
| Reviewer | Read, WebFetch (reference only) |
| Implementer | Read, Write, Edit, Bash, Glob, Grep |

## UI Scoring System

Scores 1-10 based on 10 dimensions:
- Spacing & Layout (4/8px scale)
- Typography (hierarchy, font scales)
- Color (palette, WCAG AA contrast)
- Visual Hierarchy
- Component Consistency
- Icons & Imagery
- Empty/Loading/Error States
- Structural Design
- Screen-specific Patterns
- Responsive Design

Score interpretation:
- 1-3: Broken/unusable
- 4-5: Functional but amateur
- 6-7: Decent, needs polish
- 8: Professional quality
- 9: Excellent, production-ready
- 10: Exceptional reference quality

## File Format Conventions

Commands and agents use Markdown with YAML frontmatter:
```yaml
---
name: "agent-name"
description: "Purpose"
tools: ["Tool1", "Tool2"]
allowed-tools: ["Bash(...)", "Read"]
---
# Instructions here
```

## Bash Script Conventions

- Use `set -e` for exit on error
- Validate numeric ranges before use
- Use `sed -i.bak` for safe file modifications
- Extract YAML fields with `sed` and `awk`
