#!/bin/bash
# Pre-Context Reset Hook
# Saves session state before Claude's context window resets
# Critical for continuity when Claude Code bugs out or context expires

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
CONTEXT_FILE="$PROJECT_ROOT/v1/dev/context.md"
TASKS_FILE="$PROJECT_ROOT/v1/dev/tasks.md"
SESSION_LOG="$PROJECT_ROOT/.claude/session-state.log"

echo "🔄 Pre-Context Reset: Saving session state..."

# Create timestamp
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Append to session log
cat >> "$SESSION_LOG" << EOF

================================================================================
SESSION CHECKPOINT: $TIMESTAMP
================================================================================
EOF

# Check if there are uncommitted changes
cd "$PROJECT_ROOT"
if ! git diff --quiet 2>/dev/null || ! git diff --cached --quiet 2>/dev/null; then
    echo "⚠️  Uncommitted changes detected!" >> "$SESSION_LOG"
    echo "" >> "$SESSION_LOG"
    echo "Modified files:" >> "$SESSION_LOG"
    git status --short >> "$SESSION_LOG" 2>/dev/null || echo "  (git status failed)" >> "$SESSION_LOG"
    echo "" >> "$SESSION_LOG"
fi

# Get current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
echo "Branch: $CURRENT_BRANCH" >> "$SESSION_LOG"

# Get last commit
LAST_COMMIT=$(git log -1 --oneline 2>/dev/null || echo "No commits")
echo "Last commit: $LAST_COMMIT" >> "$SESSION_LOG"

# Check what phase we're in from tasks.md
if [ -f "$TASKS_FILE" ]; then
    echo "" >> "$SESSION_LOG"
    echo "Current tasks status:" >> "$SESSION_LOG"
    grep -E "^\s*-\s*\[x\]" "$TASKS_FILE" | wc -l | xargs -I {} echo "  Completed: {} tasks" >> "$SESSION_LOG"
    grep -E "^\s*-\s*\[ \]" "$TASKS_FILE" | wc -l | xargs -I {} echo "  Remaining: {} tasks" >> "$SESSION_LOG"

    # Find current section
    CURRENT_SECTION=$(grep -B 5 "IN PROGRESS" "$TASKS_FILE" | grep "^##" | tail -1 || echo "Unknown phase")
    echo "  Current phase: $CURRENT_SECTION" >> "$SESSION_LOG"
fi

# Save a snapshot of context.md current state
if [ -f "$CONTEXT_FILE" ]; then
    echo "" >> "$SESSION_LOG"
    echo "Last context.md update:" >> "$SESSION_LOG"
    tail -n 20 "$CONTEXT_FILE" >> "$SESSION_LOG"
fi

echo "" >> "$SESSION_LOG"
echo "✅ Session state saved to .claude/session-state.log" >> "$SESSION_LOG"
echo "   Resume by reading this file to understand where you left off." >> "$SESSION_LOG"
echo "" >> "$SESSION_LOG"

# Also update context.md with checkpoint marker
if [ -f "$CONTEXT_FILE" ]; then
    cat >> "$CONTEXT_FILE" << EOF

---

## SESSION CHECKPOINT: $TIMESTAMP

**Status**: Context reset triggered - session state saved

**What was happening**:
- Branch: $CURRENT_BRANCH
- Last commit: $LAST_COMMIT

**To resume**:
1. Read \`.claude/session-state.log\` for detailed state
2. Check git status for uncommitted changes
3. Review tasks.md for current progress
4. Continue from where checkpoint was made

---
EOF
fi

echo "✅ Pre-context reset hook completed"
echo "📄 Session state saved to: .claude/session-state.log"
echo "📝 Context.md updated with checkpoint marker"

exit 0
