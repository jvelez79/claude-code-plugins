#!/bin/bash
# UI Improve Loop - Stop Hook
# This hook intercepts session exit attempts and continues the loop if needed

set -e

STATE_FILE=".claude/ui-loop.local.md"

# Check if state file exists
if [ ! -f "$STATE_FILE" ]; then
    # No active loop, allow exit
    exit 0
fi

# Read the state file frontmatter
read_frontmatter() {
    local key="$1"
    grep "^${key}:" "$STATE_FILE" | head -1 | sed "s/^${key}:[[:space:]]*//"
}

# Check if loop is active
ACTIVE=$(read_frontmatter "active")
if [ "$ACTIVE" != "true" ]; then
    exit 0
fi

# Read current state
ITERATION=$(read_frontmatter "iteration")
MAX_ITERATIONS=$(read_frontmatter "max_iterations")
THRESHOLD=$(read_frontmatter "threshold")
CURRENT_SCORE=$(read_frontmatter "current_score")

# Validate numeric values
if ! [[ "$ITERATION" =~ ^[0-9]+$ ]]; then
    echo "Error: Invalid iteration value in state file" >&2
    exit 1
fi

if ! [[ "$MAX_ITERATIONS" =~ ^[0-9]+$ ]]; then
    echo "Error: Invalid max_iterations value in state file" >&2
    exit 1
fi

# Check if max iterations reached
if [ "$ITERATION" -ge "$MAX_ITERATIONS" ]; then
    echo "Max iterations ($MAX_ITERATIONS) reached. Exiting loop."
    # Deactivate the loop
    sed -i.bak "s/^active: true/active: false/" "$STATE_FILE"
    rm -f "${STATE_FILE}.bak"
    exit 0
fi

# Read stdin for hook input (contains transcript)
HOOK_INPUT=$(cat)

# Check for completion promise in the last assistant message
# Look for <ui-loop-complete>SCORE</ui-loop-complete> pattern
if echo "$HOOK_INPUT" | grep -q "<ui-loop-complete>"; then
    COMPLETED_SCORE=$(echo "$HOOK_INPUT" | grep -o '<ui-loop-complete>[0-9]*</ui-loop-complete>' | tail -1 | sed 's/<[^>]*>//g')

    if [ -n "$COMPLETED_SCORE" ] && [ "$COMPLETED_SCORE" -ge "$THRESHOLD" ]; then
        echo "Target score ($THRESHOLD) reached with score $COMPLETED_SCORE. Loop complete!"
        # Deactivate the loop
        sed -i.bak "s/^active: true/active: false/" "$STATE_FILE"
        sed -i.bak "s/^current_score: [0-9]*/current_score: $COMPLETED_SCORE/" "$STATE_FILE"
        rm -f "${STATE_FILE}.bak"
        exit 0
    fi
fi

# Loop should continue - increment iteration
NEW_ITERATION=$((ITERATION + 1))

# Update state file with new iteration
sed -i.bak "s/^iteration: [0-9]*/iteration: $NEW_ITERATION/" "$STATE_FILE"
rm -f "${STATE_FILE}.bak"

# Extract the original prompt (everything after the closing ---)
PROMPT=$(awk '/^---$/{if(++c==2){found=1;next}}found' "$STATE_FILE")

# Build the continuation message
SYSTEM_MESSAGE="🔄 UI Improve Loop - Iteration $NEW_ITERATION/$MAX_ITERATIONS

Current score: ${CURRENT_SCORE:-0} | Target: $THRESHOLD

Continue the UI improvement loop:
1. Navigate to the target screen (if not already there)
2. Take a screenshot
3. Run UI review and extract score
4. If score >= $THRESHOLD, output <ui-loop-complete>SCORE</ui-loop-complete>
5. Otherwise, implement the most critical improvements

$PROMPT"

# Output JSON response to block exit and continue
cat << EOF
{
  "decision": "block",
  "message": "$SYSTEM_MESSAGE"
}
EOF
