---
description: "Start an iterative UI improvement loop until target score is reached"
argument-hint: "<description> [--threshold N] [--max-iterations N] [--url URL]"
allowed-tools:
  - "Bash(${CLAUDE_PLUGIN_ROOT}/scripts/setup-ui-loop.sh:*)"
  - "Read"
  - "Write"
  - "Edit"
  - "Glob"
  - "Grep"
  - "Task"
  - "mcp__claude-in-chrome__*"
---

# UI Improve Loop

Start an iterative UI improvement loop that will automatically improve the UI until the target quality score is reached.

## Arguments

- `$ARGUMENTS` - The description of the screen to improve and any options

## Initialization

First, run the setup script to create the state file:

```bash
${CLAUDE_PLUGIN_ROOT}/scripts/setup-ui-loop.sh $ARGUMENTS
```

## Loop Workflow

After initialization, execute the following workflow. The Stop hook will automatically continue the loop until completion.

### Phase 1: Navigate to Target Screen

Use the Chrome MCP tools to navigate to the described screen:

1. First, get the current tab context:
   - Use `mcp__claude-in-chrome__tabs_context_mcp` to see available tabs
   - If no MCP tab group exists, create one with `createIfEmpty: true`

2. Navigate to the target:
   - Read the state file at `.claude/ui-loop.local.md` to get the target description
   - If a URL is specified in the state file, navigate directly using `mcp__claude-in-chrome__navigate`
   - Otherwise, interpret the natural language description and navigate accordingly
   - Use `mcp__claude-in-chrome__find` and `mcp__claude-in-chrome__computer` to interact with the page

3. Confirm arrival:
   - Take a screenshot to verify you're on the correct screen
   - If navigation steps were used, save them to the state file for reuse

### Phase 2: Take Screenshot

Use the Chrome MCP to capture the current screen:

```
mcp__claude-in-chrome__computer with action: "screenshot"
```

Store the imageId for the review phase.

### Phase 3: UI Review

Analyze the screenshot using the UIReview framework. Evaluate:

1. **Spacing & Layout** - 4/8px scale, grouping, breathing room
2. **Typography** - Scale, weights, hierarchy, line lengths
3. **Color** - Palette, contrast, semantic colors
4. **Visual Hierarchy** - Focal points, de-emphasis, action hierarchy
5. **Components** - Consistency, states, accessibility
6. **Icons & Imagery** - Style consistency, sizing, spacing
7. **Empty/Loading/Error States** - Completeness
8. **Structural Design** - Layout patterns, UX patterns
9. **Screen-specific Patterns** - Dashboard, table, form, etc.
10. **Responsive** - Breakpoints, touch targets

Generate:
- **Score (1-10)**: Current quality score
- **Critical Issues**: Must-fix problems with specific locations
- **Improvements**: Should-fix enhancements
- **Suggestions**: Nice-to-have polish

### Phase 4: Check Threshold

Read the threshold from `.claude/ui-loop.local.md`.

If score >= threshold:
```
<ui-loop-complete>SCORE</ui-loop-complete>
```

The loop will then exit successfully.

### Phase 5: Implement Improvements

If score < threshold, implement the most critical improvements:

1. **Prioritize**: Focus on Critical Issues first, then Improvements
2. **Locate Files**: Find the relevant CSS/component files in the project
3. **Make Changes**: Edit files to fix the issues
4. **Build Check**: If the project requires a build step, run it
5. **Refresh**: If hot-reload is not active, refresh the browser

Update the state file:
- Set `current_score` to the new score
- Add modified files to `files_modified` list
- Update `last_improvements` with what was done

### Phase 6: Loop Continues

After implementing improvements, the session will attempt to exit.
The Stop hook will intercept and re-run the loop with the updated iteration count.

## Important Notes

- **Context Management**: Each major phase should use sub-agents where possible to keep context clean
- **State Persistence**: All important state is stored in `.claude/ui-loop.local.md`
- **Max Iterations**: The loop will stop after max_iterations even if threshold not reached
- **Cancel**: User can run `/cancel-ui-loop` at any time to stop

## Example Usage

```
/ui-improve-loop "Login page with email and password form" --threshold 9 --max-iterations 10
```

This will:
1. Navigate to the login page
2. Take a screenshot
3. Review and score the UI
4. Implement improvements if score < 9
5. Repeat until score >= 9 or 10 iterations complete
