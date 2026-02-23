#!/bin/bash
# Tests for init-state.sh - Personal Assistant plugin
# Run: bash plugins/personal-assistant/tests/test-init-state.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
INIT_SCRIPT="$SCRIPT_DIR/../scripts/init-state.sh"
TEST_DIR=$(mktemp -d)
PASS=0
FAIL=0

cleanup() {
  rm -rf "$TEST_DIR"
}
trap cleanup EXIT

assert_eq() {
  local desc="$1" expected="$2" actual="$3"
  if [ "$expected" = "$actual" ]; then
    echo "  PASS: $desc"
    PASS=$((PASS + 1))
  else
    echo "  FAIL: $desc"
    echo "    expected: $expected"
    echo "    actual:   $actual"
    FAIL=$((FAIL + 1))
  fi
}

assert_file_exists() {
  local desc="$1" filepath="$2"
  if [ -f "$filepath" ]; then
    echo "  PASS: $desc"
    PASS=$((PASS + 1))
  else
    echo "  FAIL: $desc (file not found: $filepath)"
    FAIL=$((FAIL + 1))
  fi
}

assert_dir_exists() {
  local desc="$1" dirpath="$2"
  if [ -d "$dirpath" ]; then
    echo "  PASS: $desc"
    PASS=$((PASS + 1))
  else
    echo "  FAIL: $desc (dir not found: $dirpath)"
    FAIL=$((FAIL + 1))
  fi
}

assert_file_contains() {
  local desc="$1" filepath="$2" pattern="$3"
  if grep -q "$pattern" "$filepath" 2>/dev/null; then
    echo "  PASS: $desc"
    PASS=$((PASS + 1))
  else
    echo "  FAIL: $desc (pattern '$pattern' not found in $filepath)"
    FAIL=$((FAIL + 1))
  fi
}

# ============================================================
echo "=== Test Suite: init-state.sh ==="
echo ""

# --- Test 1: Script exists and is executable ---
echo "Test 1: Script exists"
assert_file_exists "init-state.sh exists" "$INIT_SCRIPT"

# --- Test 2: Creates all required directories ---
echo ""
echo "Test 2: Directory creation"
cd "$TEST_DIR"
bash "$INIT_SCRIPT" > /dev/null 2>&1

assert_dir_exists "creates .claude/pa/" ".claude/pa"
assert_dir_exists "creates .claude/pa/memories/" ".claude/pa/memories"
assert_dir_exists "creates .claude/pa/briefings/" ".claude/pa/briefings"
assert_dir_exists "creates .claude/pa/research/" ".claude/pa/research"

# --- Test 3: config.local.md has valid YAML frontmatter ---
echo ""
echo "Test 3: config.local.md format"
CONFIG=".claude/pa/config.local.md"
assert_file_exists "config.local.md exists" "$CONFIG"
assert_file_contains "config starts with YAML delimiter" "$CONFIG" "^---$"
assert_file_contains "config has timezone field" "$CONFIG" "^timezone:"
assert_file_contains "config has locale field" "$CONFIG" "^locale:"
assert_file_contains "config has google_calendar section" "$CONFIG" "^google_calendar:"
assert_file_contains "config has daily_routine section" "$CONFIG" "^daily_routine:"

# --- Test 4: tasks.md has correct section headers ---
echo ""
echo "Test 4: tasks.md format"
TASKS=".claude/pa/tasks.md"
assert_file_exists "tasks.md exists" "$TASKS"
assert_file_contains "tasks starts with YAML delimiter" "$TASKS" "^---$"
assert_file_contains "tasks has total_tasks counter" "$TASKS" "^total_tasks:"
assert_file_contains "tasks has Pending section" "$TASKS" "^## Pendientes"
assert_file_contains "tasks has In Progress section" "$TASKS" "^## En Progreso"
assert_file_contains "tasks has Completed section" "$TASKS" "^## Completadas"

# --- Test 5: memories/_index.md has table header ---
echo ""
echo "Test 5: memories/_index.md format"
INDEX=".claude/pa/memories/_index.md"
assert_file_exists "_index.md exists" "$INDEX"
assert_file_contains "index starts with YAML delimiter" "$INDEX" "^---$"
assert_file_contains "index has total_memories counter" "$INDEX" "^total_memories:"
assert_file_contains "index has table header with Tema" "$INDEX" "| Tema"
assert_file_contains "index has table separator" "$INDEX" "|---"

# --- Test 6: Idempotency - running twice doesn't overwrite ---
echo ""
echo "Test 6: Idempotency"

# Add custom content to config
echo "# Custom user content" >> "$CONFIG"
BEFORE_CONTENT=$(cat "$CONFIG")

# Run init again
bash "$INIT_SCRIPT" > /dev/null 2>&1

AFTER_CONTENT=$(cat "$CONFIG")
assert_eq "config not overwritten on second run" "$BEFORE_CONTENT" "$AFTER_CONTENT"

# Same for tasks
echo "### Custom task" >> "$TASKS"
BEFORE_TASKS=$(cat "$TASKS")

bash "$INIT_SCRIPT" > /dev/null 2>&1

AFTER_TASKS=$(cat "$TASKS")
assert_eq "tasks not overwritten on second run" "$BEFORE_TASKS" "$AFTER_TASKS"

# ============================================================
echo ""
echo "=== Results: $PASS passed, $FAIL failed ==="

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
exit 0
