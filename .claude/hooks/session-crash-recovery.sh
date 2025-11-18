#!/bin/bash
# Session Crash Recovery Script
# Run this manually after Claude Code crashes/freezes to see what was happening

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SESSION_LOG="$PROJECT_ROOT/.claude/session-state.log"
CHANGE_LOG="$PROJECT_ROOT/.claude/change-log.txt"
CONTEXT_FILE="$PROJECT_ROOT/v1/dev/context.md"

echo "🚑 Claude Code Crash Recovery"
echo "=============================="
echo ""

# Check if session log exists
if [ ! -f "$SESSION_LOG" ]; then
    echo "❌ No session log found (.claude/session-state.log)"
    echo "   This means hooks haven't run yet or files were deleted."
    exit 1
fi

echo "📋 Last Session State:"
echo "----------------------"
tail -50 "$SESSION_LOG"
echo ""

echo "📝 Recent File Changes:"
echo "-----------------------"
if [ -f "$CHANGE_LOG" ]; then
    tail -20 "$CHANGE_LOG"
else
    echo "(No change log found)"
fi
echo ""

echo "🔍 Git Status:"
echo "--------------"
cd "$PROJECT_ROOT"
git status --short
echo ""

echo "📊 Tasks Progress:"
echo "------------------"
if [ -f "$PROJECT_ROOT/v1/dev/tasks.md" ]; then
    COMPLETED=$(grep -E "^\s*-\s*\[x\]" "$PROJECT_ROOT/v1/dev/tasks.md" | wc -l)
    TOTAL=$(grep -E "^\s*-\s*\[(x| )\]" "$PROJECT_ROOT/v1/dev/tasks.md" | wc -l)
    echo "✅ Completed: $COMPLETED / $TOTAL tasks"

    echo ""
    echo "Current section:"
    grep -A 5 "## 🚧 IN PROGRESS" "$PROJECT_ROOT/v1/dev/tasks.md" || echo "(No in-progress section)"
fi
echo ""

echo "💡 Recovery Actions:"
echo "--------------------"
echo "1. Read .claude/session-state.log for detailed context"
echo "2. Check uncommitted changes with: git diff"
echo "3. Review v1/dev/context.md for latest updates"
echo "4. Continue from last checkpoint in v1/dev/tasks.md"
echo ""

echo "🔗 Quick Commands:"
echo "------------------"
echo "View full session log:    cat .claude/session-state.log"
echo "View all changes:         cat .claude/change-log.txt"
echo "View uncommitted diff:    git diff"
echo "View context file:        cat v1/dev/context.md"
echo ""

exit 0
