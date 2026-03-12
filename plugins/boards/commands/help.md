---
description: "Show available board commands"
allowed-tools:
  - Read
---

# Boards Plugin — Help

Display the available board commands to the user:

## Available Commands

| Command | Description |
|---------|-------------|
| `/board-meeting <topic>` | AI Board Meeting — 7 C-suite agents (CEO, CFO, CMO, COO, CTO, Research, Critic) analyze any business decision from multiple expert perspectives |
| `/ux-board <url\|path\|description>` | UI/UX Board Review — 7 specialists (Visual Designer, UX Strategist, Information Architect, Accessibility, Mobile, Performance, Critic) analyze screens and provide prioritized improvements |

## How It Works

Each board assembles a panel of 6 specialized agents that analyze your topic in parallel, followed by a Critic who challenges their findings, and a final synthesis with prioritized recommendations.

## Examples

```
/board-meeting Should we pivot from B2C to B2B?
/board-meeting Launching a freemium tier for our SaaS product
/ux-board https://myapp.com/dashboard
/ux-board /path/to/screenshot.png
/ux-board "Login page with email/password form and social login buttons"
```
