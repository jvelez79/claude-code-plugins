#!/usr/bin/env bash
set -euo pipefail

PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"
PROJECT_ROOT="${1:-$(pwd)}"
PLIST_LABEL="com.claude-heartbeat"
PLIST_DEST="$HOME/Library/LaunchAgents/${PLIST_LABEL}.plist"
TEMPLATE="$PLUGIN_ROOT/templates/com.claude-heartbeat.plist"

echo "=== Heartbeat Daemon Installer ==="
echo "Plugin root: $PLUGIN_ROOT"
echo "Project root: $PROJECT_ROOT"

echo "Installing dependencies..."
cd "$PLUGIN_ROOT"
npm install --production 2>/dev/null

echo "Building TypeScript..."
npx tsc

DATA_DIR="$PROJECT_ROOT/.claude/pa/heartbeat"
mkdir -p "$DATA_DIR/store/auth" "$DATA_DIR/groups" "$DATA_DIR/logs"

NODE_PATH=$(which node)
CURRENT_PATH="$HOME/.local/bin:/usr/local/bin:/usr/bin:/bin:$(dirname "$NODE_PATH")"

echo "Rendering launchd plist..."
sed \
  -e "s|{{NODE_PATH}}|$NODE_PATH|g" \
  -e "s|{{PLUGIN_ROOT}}|$PLUGIN_ROOT|g" \
  -e "s|{{PROJECT_ROOT}}|$PROJECT_ROOT|g" \
  -e "s|{{HOME}}|$HOME|g" \
  -e "s|{{PATH}}|$CURRENT_PATH|g" \
  "$TEMPLATE" > "$PLIST_DEST"

launchctl unload "$PLIST_DEST" 2>/dev/null || true

echo "Loading launchd service..."
launchctl load "$PLIST_DEST"

echo ""
echo "=== Heartbeat daemon installed ==="
echo "Plist: $PLIST_DEST"
echo "Logs: $DATA_DIR/logs/"
echo ""
echo "Check status: launchctl list | grep heartbeat"
echo "View logs: tail -f $DATA_DIR/logs/daemon.log"
