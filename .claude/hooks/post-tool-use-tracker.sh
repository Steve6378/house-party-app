#!/bin/bash
# Post-Tool-Use Tracker Hook
# Automatically logs file changes after Claude uses Edit/Write/MultiEdit tools
# Critical for tracking progress when Claude Code crashes

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
CONTEXT_FILE="$PROJECT_ROOT/v1/dev/context.md"
CHANGE_LOG="$PROJECT_ROOT/.claude/change-log.txt"

# Get tool name and file path from environment variables
# Claude Code sets these when hooks run
TOOL_NAME="${CLAUDE_TOOL_NAME:-unknown}"
FILE_PATH="${CLAUDE_TOOL_FILE_PATH:-unknown}"

# Only proceed if we have file path
if [ "$FILE_PATH" = "unknown" ]; then
    exit 0
fi

# Create timestamp
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Append to change log
echo "[$TIMESTAMP] $TOOL_NAME: $FILE_PATH" >> "$CHANGE_LOG"

# Determine what was changed and update context.md accordingly
RELATIVE_PATH="${FILE_PATH#$PROJECT_ROOT/}"

# Check if this is a significant file
SHOULD_UPDATE_CONTEXT=false
UPDATE_MESSAGE=""

case "$RELATIVE_PATH" in
    v1/backend/*)
        SHOULD_UPDATE_CONTEXT=true
        if [[ "$RELATIVE_PATH" == *"/api/"* ]]; then
            UPDATE_MESSAGE="Added/modified API endpoint"
        elif [[ "$RELATIVE_PATH" == *"/models/"* ]]; then
            UPDATE_MESSAGE="Added/modified database model"
        elif [[ "$RELATIVE_PATH" == *"/services/"* ]]; then
            UPDATE_MESSAGE="Added/modified service"
        elif [[ "$RELATIVE_PATH" == *"/auth/"* ]]; then
            UPDATE_MESSAGE="Added/modified authentication"
        else
            UPDATE_MESSAGE="Modified backend code"
        fi
        ;;
    v1/frontend/*)
        SHOULD_UPDATE_CONTEXT=true
        if [[ "$RELATIVE_PATH" == *"/app/"* ]]; then
            UPDATE_MESSAGE="Added/modified page"
        elif [[ "$RELATIVE_PATH" == *"/components/"* ]]; then
            UPDATE_MESSAGE="Added/modified component"
        elif [[ "$RELATIVE_PATH" == *"/lib/"* ]]; then
            UPDATE_MESSAGE="Added/modified utility"
        else
            UPDATE_MESSAGE="Modified frontend code"
        fi
        ;;
    v1/database/*)
        SHOULD_UPDATE_CONTEXT=true
        UPDATE_MESSAGE="Modified database schema/data"
        ;;
    v1/tests/*)
        SHOULD_UPDATE_CONTEXT=true
        UPDATE_MESSAGE="Added/modified tests"
        ;;
    v1/dev/*)
        # Dev docs changed - don't create infinite loop
        SHOULD_UPDATE_CONTEXT=false
        ;;
    *)
        # Other files - still log but don't update context
        SHOULD_UPDATE_CONTEXT=false
        ;;
esac

# Update context.md if this is a significant change
if [ "$SHOULD_UPDATE_CONTEXT" = true ] && [ -f "$CONTEXT_FILE" ]; then
    # Check if there's already a "Recent Changes" section
    if ! grep -q "## Recent Changes" "$CONTEXT_FILE"; then
        # Add section before the first ## heading or at end
        if grep -q "^## " "$CONTEXT_FILE"; then
            # Insert before first ## heading
            FIRST_HEADING_LINE=$(grep -n "^## " "$CONTEXT_FILE" | head -1 | cut -d: -f1)
            sed -i "${FIRST_HEADING_LINE}i\\
## Recent Changes\\
\\
This section is auto-updated by post-tool-use hook.\\
\\
" "$CONTEXT_FILE"
        else
            # Append at end
            cat >> "$CONTEXT_FILE" << EOF

## Recent Changes

This section is auto-updated by post-tool-use hook.

EOF
        fi
    fi

    # Append the change
    # Find the "## Recent Changes" section and append after it
    RECENT_CHANGES_LINE=$(grep -n "^## Recent Changes" "$CONTEXT_FILE" | cut -d: -f1)
    if [ ! -z "$RECENT_CHANGES_LINE" ]; then
        # Insert after the "## Recent Changes" line + 3 (skip section header lines)
        INSERT_LINE=$((RECENT_CHANGES_LINE + 4))
        sed -i "${INSERT_LINE}i\\
- **[$TIMESTAMP]** $UPDATE_MESSAGE: \`$RELATIVE_PATH\`" "$CONTEXT_FILE"
    fi

    # Keep only last 20 changes to avoid bloat
    # This is a bit hacky but works
    RECENT_SECTION=$(sed -n '/^## Recent Changes/,/^## /p' "$CONTEXT_FILE" | grep "^\- \*\*" | tail -20)
    if [ ! -z "$RECENT_SECTION" ]; then
        # Replace Recent Changes section with trimmed version
        # (This is complex in bash, so we'll skip for now and just append)
        :
    fi
fi

# Log to stdout for debugging
echo "📝 File changed: $RELATIVE_PATH"
if [ "$SHOULD_UPDATE_CONTEXT" = true ]; then
    echo "✅ Context.md updated"
fi

exit 0
