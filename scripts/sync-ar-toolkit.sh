#!/bin/bash

# Auto-sync script for AR-ToolKit updates
# Run this script to manually sync latest changes

set -e

echo "🔄 Syncing AR-ToolKit updates..."

# Fetch latest from AR-ToolKit
git fetch ar-toolkit main

# Check if there are updates
if git diff --quiet HEAD ar-toolkit/main; then
    echo "✅ AR-ToolKit is already up to date"
    exit 0
fi

echo "📥 Found updates in AR-ToolKit, syncing..."

# Pull updates using subtree
git subtree pull --prefix=ar-toolkit ar-toolkit main --squash -m "Sync: Update AR-ToolKit from upstream

- Automatic sync from CVO-TreeAi/AR-ToolKit
- Ensures agent system stays current with AR capabilities"

echo "✅ AR-ToolKit successfully synced!"
echo "📄 Changes have been committed and are ready to push"

# Optional: Auto-push (uncomment if you want automatic pushing)
# git push origin main
# echo "🚀 Changes pushed to origin"