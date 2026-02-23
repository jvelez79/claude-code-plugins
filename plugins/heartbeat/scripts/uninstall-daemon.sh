#!/usr/bin/env bash
set -euo pipefail

PLIST_LABEL="com.claude-heartbeat"
PLIST_PATH="$HOME/Library/LaunchAgents/${PLIST_LABEL}.plist"

echo "=== Heartbeat Daemon Uninstaller ==="

if [ -f "$PLIST_PATH" ]; then
  echo "Unloading launchd service..."
  launchctl unload "$PLIST_PATH" 2>/dev/null || true
  rm -f "$PLIST_PATH"
  echo "Removed: $PLIST_PATH"
else
  echo "No plist found at $PLIST_PATH"
fi

echo ""
echo "=== Heartbeat daemon uninstalled ==="
echo "Note: Data in .claude/heartbeat/ was NOT deleted."
echo "To remove data: rm -rf .claude/heartbeat/"
