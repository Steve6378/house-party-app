# Claude Code Hooks for Yorru

## Overview

These hooks provide **session continuity and crash recovery** for Claude Code, which is critical given its tendency to freeze/crash.

## Hooks

### 1. `pre-context-reset.sh`
**When**: Before Claude's context window resets (every ~200k tokens)

**What it does**:
- Saves current session state to `.claude/session-state.log`
- Captures uncommitted changes
- Records current branch, last commit
- Notes which phase/task you're on
- Adds checkpoint marker to `v1/dev/context.md`

**Why it's critical**: When context resets, Claude "forgets" what you were doing. This hook ensures state is saved so the next session can resume seamlessly.

### 2. `post-tool-use-tracker.sh`
**When**: After Claude uses Edit, Write, or MultiEdit tools

**What it does**:
- Logs every file change to `.claude/change-log.txt`
- Updates `v1/dev/context.md` with significant changes
- Tracks backend, frontend, database, test changes
- Keeps last 20 changes for quick reference

**Why it's critical**: If Claude Code crashes mid-work, you know exactly what files were modified and can resume from there.

### 3. `session-crash-recovery.sh`
**When**: Run manually after Claude Code crashes

**What it does**:
- Shows last session checkpoint
- Lists recent file changes
- Shows git status
- Displays task progress
- Suggests recovery actions

**Usage**:
```bash
./.claude/hooks/session-crash-recovery.sh
```

## Log Files

### `.claude/session-state.log`
Checkpoint history of all sessions. Each checkpoint includes:
- Timestamp
- Current branch
- Last commit
- Uncommitted changes
- Task progress
- Current phase

**Never delete this file!** It's your session memory.

### `.claude/change-log.txt`
Chronological log of every file Edit/Write. Format:
```
[2025-11-18 10:30:45] Write: v1/backend/api/events.py
[2025-11-18 10:31:12] Edit: v1/backend/models/event.py
```

**Never delete this file!** It's your change history.

## Recovery Workflow

### If Claude Code Crashes:

1. **Run recovery script**:
   ```bash
   ./.claude/hooks/session-crash-recovery.sh
   ```

2. **Check what was being worked on**:
   ```bash
   tail -50 .claude/session-state.log
   ```

3. **See recent changes**:
   ```bash
   tail -20 .claude/change-log.txt
   ```

4. **Check for uncommitted work**:
   ```bash
   git status
   git diff
   ```

5. **Resume in new session**:
   - Tell Claude: "Read .claude/session-state.log to see where we left off"
   - Claude will load context and continue from checkpoint

### If Context Resets (Not a Crash):

No action needed! The `pre-context-reset.sh` hook automatically saves state. Next message to Claude, say:

> "We just had a context reset. Read .claude/session-state.log to see where we left off."

Claude will pick up exactly where you were.

## Setup

Hooks are automatically configured in `.claude/settings.json`:

```json
{
  "hooks": {
    "PreContextReset": [{
      "hooks": [{
        "type": "command",
        "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/pre-context-reset.sh"
      }]
    }],
    "PostToolUse": [{
      "matcher": "Edit|Write|MultiEdit",
      "hooks": [{
        "type": "command",
        "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/post-tool-use-tracker.sh"
      }]
    }]
  }
}
```

## Troubleshooting

### Hooks not running?

1. **Check permissions**:
   ```bash
   chmod +x .claude/hooks/*.sh
   ```

2. **Check settings.json syntax**:
   ```bash
   cat .claude/settings.json | jq .
   ```

3. **Test hook manually**:
   ```bash
   ./.claude/hooks/pre-context-reset.sh
   cat .claude/session-state.log
   ```

### Logs getting too large?

```bash
# Archive old logs
mv .claude/session-state.log .claude/session-state.log.backup
mv .claude/change-log.txt .claude/change-log.txt.backup

# Hooks will create fresh files
```

## Best Practices

1. **Don't delete log files** - They're your crash recovery lifeline
2. **Run recovery script immediately** after crashes
3. **Commit frequently** - Hooks track uncommitted changes but git is safer
4. **Update dev docs** - Run `/dev-docs-update` command before long breaks
5. **Archive logs weekly** - Keep them from growing too large

## Integration with Dev Docs

Hooks automatically update `v1/dev/context.md` with:
- Session checkpoints (from pre-context-reset)
- Recent changes (from post-tool-use-tracker)

This ensures dev docs stay current even if you forget to manually update them.

## Emergency Recovery

If everything is lost and you only have the hooks:

```bash
# See last known state
cat .claude/session-state.log | tail -100

# See all files that were changed
cat .claude/change-log.txt | tail -50

# Check what's uncommitted
git status
git diff > uncommitted-changes.patch

# See last checkpoint in context.md
grep -A 20 "SESSION CHECKPOINT" v1/dev/context.md | tail -25
```

Then tell Claude:
> "Claude Code crashed. Here's the recovery info: [paste session-state.log tail]. Resume from there."

---

These hooks are your insurance policy against Claude Code's instability. Use them! 🛟
