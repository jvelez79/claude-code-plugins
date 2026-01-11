#!/bin/bash
# UI Improve Loop - Setup Script
# Creates the state file to initialize a new UI improvement loop

set -e

# Default values
THRESHOLD=9
MAX_ITERATIONS=10
URL=""
FOCUS=""
PROMPT=""

# Help message
show_help() {
    cat << EOF
Usage: setup-ui-loop.sh "<prompt>" [options]

Options:
  --threshold <N>        Minimum score to complete (1-10, default: 9)
  --max-iterations <N>   Maximum improvement iterations (default: 10)
  --url <URL>           Base URL of the application (optional)
  --focus <area>        Specific area to focus on (optional)
  -h, --help            Show this help message

Example:
  setup-ui-loop.sh "Login page with centered form" --threshold 8 --max-iterations 5
EOF
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --threshold)
            THRESHOLD="$2"
            shift 2
            ;;
        --max-iterations)
            MAX_ITERATIONS="$2"
            shift 2
            ;;
        --url)
            URL="$2"
            shift 2
            ;;
        --focus)
            FOCUS="$2"
            shift 2
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            if [ -z "$PROMPT" ]; then
                PROMPT="$1"
            else
                PROMPT="$PROMPT $1"
            fi
            shift
            ;;
    esac
done

# Validate prompt
if [ -z "$PROMPT" ]; then
    echo "Error: No prompt provided" >&2
    show_help
    exit 1
fi

# Validate threshold
if ! [[ "$THRESHOLD" =~ ^[0-9]+$ ]] || [ "$THRESHOLD" -lt 1 ] || [ "$THRESHOLD" -gt 10 ]; then
    echo "Error: Threshold must be a number between 1 and 10" >&2
    exit 1
fi

# Validate max_iterations
if ! [[ "$MAX_ITERATIONS" =~ ^[0-9]+$ ]] || [ "$MAX_ITERATIONS" -lt 1 ]; then
    echo "Error: Max iterations must be a positive number" >&2
    exit 1
fi

# Create .claude directory if it doesn't exist
mkdir -p .claude

# Get current timestamp
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Create state file
STATE_FILE=".claude/ui-loop.local.md"

cat > "$STATE_FILE" << EOF
---
active: true
iteration: 0
max_iterations: $MAX_ITERATIONS
threshold: $THRESHOLD
current_score: 0
target_description: "$PROMPT"
url: "$URL"
focus: "$FOCUS"
navigation_steps: []
last_improvements: []
files_modified: []
timestamp: "$TIMESTAMP"
---

$PROMPT
EOF

echo "✅ UI Improve Loop initialized"
echo ""
echo "Configuration:"
echo "  Target: $PROMPT"
echo "  Threshold: $THRESHOLD"
echo "  Max iterations: $MAX_ITERATIONS"
[ -n "$URL" ] && echo "  URL: $URL"
[ -n "$FOCUS" ] && echo "  Focus: $FOCUS"
echo ""
echo "State file created at: $STATE_FILE"
echo ""
echo "⚠️  The loop will run until:"
echo "   - Score reaches $THRESHOLD"
echo "   - Max iterations ($MAX_ITERATIONS) is reached"
echo "   - You run /cancel-ui-loop"
