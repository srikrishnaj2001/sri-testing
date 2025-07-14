#!/bin/bash

echo "🔧 Setting up script permissions..."

# Make all shell scripts executable
chmod +x scripts/*.sh

echo "✅ All script permissions set"
echo "📁 Scripts ready:"
echo "   - scripts/run-db.sh"
echo "   - scripts/stop-db.sh"
echo "   - scripts/setup-permissions.sh" 