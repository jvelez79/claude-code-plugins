# UI Improve Loop

A Claude Code plugin that implements an iterative UI improvement loop. It automatically takes screenshots of your web application, evaluates the UI quality, implements improvements, and repeats until reaching a target quality score.

## Features

- **Automatic UI Review**: Uses a comprehensive design framework to evaluate your UI (spacing, typography, color, hierarchy, components, etc.)
- **Iterative Improvement**: Automatically implements suggested improvements and re-evaluates
- **Chrome Integration**: Uses Chrome MCP to navigate and take screenshots
- **Context-Efficient**: Uses sub-agents to keep context clean during long loops
- **Configurable**: Set your target score and maximum iterations

## Installation

```bash
# Add the marketplace
/plugin marketplace add https://github.com/jvelez79/ui-improve-loop.git

# Install the plugin
/plugin install ui-improve-loop
```

## Requirements

- Claude Code CLI
- Chrome MCP (`claude-in-chrome`) configured and running
- A web application running locally (dev server)

## Usage

```bash
/ui-improve-loop "<description of the screen>" [options]
```

### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--threshold <N>` | Minimum score to complete (1-10) | 9 |
| `--max-iterations <N>` | Maximum improvement iterations | 10 |
| `--url <URL>` | Base URL of the application | (auto-detect) |
| `--focus <area>` | Specific area to focus improvements on | (all areas) |

### Examples

```bash
# Improve login page until score reaches 9
/ui-improve-loop "Login page with centered form" --threshold 9

# Improve dashboard with max 5 iterations
/ui-improve-loop "Main dashboard showing user metrics" --max-iterations 5

# Focus on specific URL
/ui-improve-loop "Product listing page" --url http://localhost:3000/products
```

## Commands

| Command | Description |
|---------|-------------|
| `/ui-improve-loop` | Start an improvement loop |
| `/ui-review` | Run a single UI review (no loop) |
| `/cancel-ui-loop` | Cancel an active loop |
| `/ui-improve-loop:help` | Show help |

## How It Works

1. **Navigation**: An agent navigates to the described screen using Chrome
2. **Screenshot**: Takes a screenshot of the current page
3. **Review**: Evaluates the UI using the UIReview framework (score 1-10)
4. **Check Threshold**: If score >= threshold, loop completes
5. **Implement**: If below threshold, implements the most critical improvements
6. **Repeat**: Goes back to step 1

## Scoring System

| Score | Meaning |
|-------|---------|
| 1-3 | Broken/unusable, major usability issues |
| 4-5 | Functional but amateur, inconsistent, poor hierarchy |
| 6-7 | Decent, minor issues, lacks polish |
| 8 | Professional quality, minor refinements possible |
| 9 | Excellent, production-ready, well-crafted |
| 10 | Exceptional, could be a reference |

## State File

The plugin creates a state file at `.claude/ui-loop.local.md` in your project to track:
- Current iteration
- Current score
- Navigation steps
- Improvements applied

## License

MIT
