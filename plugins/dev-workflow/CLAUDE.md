# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Claude Code Plugin** that implements a comprehensive feature development workflow. It orchestrates multiple specialized agents to take a feature idea from initial concept through implementation and review.

## Architecture

### Agent-based Workflow

The plugin uses a pipeline of specialized agents, each with isolated context and specific tool access:

```
/feature command
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│                    DESIGN PHASE                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Idea Refiner                                         │   │
│  │  ├─ PASO 1: Refinamiento (3+ rondas AskUserQuestion) │   │
│  │  ├─ PASO 1.5: Exploración paralela (design-explorer) │   │
│  │  ├─ PASO 2: Mindmap con Pencil MCP                   │   │
│  │  ├─ PASO 3: Prototipos con Pencil MCP (opcional)     │   │
│  │  └─ PASO 4: concept.md                               │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
    │
    ▼
Spec Writer -> Technical specification (file tools)
    │
Task Planner -> Atomic task breakdown (file tools)
    │
Implementer -> Write code and tests (file tools + Bash)
    │
E2E Tester -> Browser testing (Chrome MCP tools)
    │
    [Loop: Implementer <-> E2E Tester until passing]
    │
Reviewer -> Code review and approval (file tools + Bash)
```

### Design Mode Restrictions

During the Design Phase (Idea Refiner), the following restrictions apply:

**PROHIBITED:**
- Modifying code in `src/`, `app/`, `lib/`, `components/`
- Creating/modifying database migrations
- Modifying `package.json`, `composer.json`, `requirements.txt`
- Writing production code

**ALLOWED:**
- Reading existing code for exploration
- Creating `.pen` files for visual design (Pencil MCP)
- Creating `.md` documentation files
- Creating files in `.claude/features/`

### State Persistence

State is stored in `.claude/features/<feature-slug>/`:

```
.claude/features/<feature-slug>/
├── exploration.md        # Codebase exploration findings
├── mindmap.pen           # Visual concept map (Pencil MCP)
├── concept.md            # Structured requirements from Idea Refiner
├── flows/                # Flow diagrams directory
│   ├── main-flow.pen     # User flow diagrams
│   └── error-flow.pen
├── prototypes/           # UI prototypes directory
│   ├── dashboard.pen     # Screen prototypes
│   └── login.pen
├── spec.md               # Technical specification from Spec Writer
├── tasks.md              # Task breakdown from Task Planner
└── review.md             # Code review from Reviewer
```

### Workflow Resumption

The workflow supports resumption from any agent using `--from <agent>`:
```bash
/feature --from implementer  # Resume from implementation phase
/feature --from e2e-tester   # Resume from E2E testing
```

## Key Files

| File | Purpose |
|------|---------|
| `commands/feature.md` | Main workflow orchestrator |
| `commands/prototype.md` | Standalone prototype creation with Pencil |
| `commands/flow.md` | Flow diagram creation with Pencil |
| `agents/idea-refiner.md` | Product analyst - clarifies requirements + design mode |
| `agents/design-explorer.md` | Codebase explorer for parallel exploration |
| `agents/spec-writer.md` | Technical architect - creates specifications |
| `agents/task-planner.md` | Tech lead - breaks down into tasks |
| `agents/implementer.md` | Developer - writes code and tests |
| `agents/e2e-tester.md` | QA engineer - tests in browser |
| `agents/reviewer.md` | Senior reviewer - code review |

## Plugin Commands

```bash
# Start new feature development
/feature "<idea description>"

# With options
/feature "<idea>" --auto            # No confirmations between agents
/feature "<idea>" --skip-e2e        # Skip E2E testing (no Chrome)
/feature "<idea>" --skip-review     # Skip code review
/feature "<idea>" --linear          # Create Linear tasks after planning

# Resume from specific agent
/feature --from spec-writer
/feature --from implementer
/feature --from e2e-tester
/feature --from reviewer

# Standalone design commands
/prototype                          # Interactive prototype creation
/prototype --from-concept           # Prototype all screens from concept.md
/prototype --screen dashboard       # Prototype specific screen

/flow checkout                      # Create flow diagram for checkout
/flow --from-concept                # Create all flows from concept.md
```

## Command Options

- `--from <agent>`: Resume from specific agent (idea-refiner, spec-writer, task-planner, implementer, e2e-tester, reviewer)
- `--auto`: Execute without confirmations between agents
- `--skip-e2e`: Skip E2E testing (useful when Chrome not available)
- `--skip-review`: Skip the Reviewer agent
- `--linear`: Create tasks in Linear after Task Planner

## Tool Access by Agent

| Agent | Tools |
|-------|-------|
| Idea Refiner | AskUserQuestion, Write, Read, Bash, Task, Chrome MCP, Pencil MCP |
| Design Explorer | Read, Glob, Grep |
| Spec Writer | Read, Glob, Grep, Bash |
| Task Planner | Read, Glob, Grep |
| Implementer | Read, Write, Edit, Bash, Glob, Grep |
| E2E Tester | Read, Glob, Grep, Bash + Chrome MCP |
| Reviewer | Read, Glob, Grep, Bash |

## Agent Responsibilities

### Idea Refiner (Design Phase)

1. **PASO 1: Refinamiento Iterativo**
   - Interactive dialogue via AskUserQuestion (minimum 3 rounds)
   - Gap analysis using checklists for project/feature scope

2. **PASO 1.5: Exploración Paralela** (NEW)
   - Launches 2-3 design-explorer agents in parallel
   - Explores: patterns, business logic, UI components
   - Consolidates findings in `exploration.md`

3. **PASO 2: Mindmap con Pencil**
   - Creates visual mindmap using Pencil MCP
   - User validates via screenshot and AskUserQuestion

4. **PASO 3: Prototipos con Pencil**
   - Asks user about prototypes (always asks, user can decline)
   - If accepted: creates `.pen` prototypes for each screen
   - Uses style guide for consistent design

5. **PASO 4: concept.md**
   - Generates structured requirements with exploration findings
   - References all design artifacts

### Design Explorer
- Fast parallel exploration agent (haiku model)
- Searches for patterns, business logic, UI components
- Returns structured findings for mindmap

### Spec Writer
- Analyzes existing codebase patterns
- Designs technical architecture
- Produces spec.md with components, APIs, schemas

### Task Planner
- Dependency analysis
- Task decomposition
- Produces tasks.md with atomic tasks

### Implementer
- Writes production code
- Creates unit tests
- Follows project conventions

### E2E Tester
- Tests in live browser (Chrome)
- Verifies acceptance criteria
- Loops with Implementer on failures

### Reviewer
- Code quality assessment
- Security review
- Final approval or change requests

## Pencil MCP Integration

The Design Phase uses Pencil MCP for all visual artifacts:

| Artifact | File Type | Pencil Tools Used |
|----------|-----------|-------------------|
| Mindmap | `.pen` | batch_design, get_screenshot |
| Prototypes | `.pen` | batch_design, get_style_guide, get_screenshot |
| Flow diagrams | `.pen` | batch_design, get_screenshot |

Key Pencil MCP tools:
- `mcp__pencil__open_document`: Create/open .pen files
- `mcp__pencil__batch_design`: Insert/modify design elements
- `mcp__pencil__get_guidelines`: Get design rules
- `mcp__pencil__get_style_guide`: Get visual style inspiration
- `mcp__pencil__get_screenshot`: Validate designs visually

## Error Handling

If any agent fails:
1. Error is reported to user
2. Partial state is preserved in feature directory
3. User can resume with: `/feature --from <failed-agent>`

## Chrome Integration

E2E Tester requires Chrome with Claude in Chrome extension:
- Install: https://chromewebstore.google.com/detail/claude-in-chrome
- Start Claude with: `claude --chrome`
- Or skip with: `--skip-e2e` flag
