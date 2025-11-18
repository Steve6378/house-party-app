# Context Handoff - Copy/Paste This to New Claude Sessions

**Use this when**: Claude Code crashes, context resets, or starting a new session

---

## 🚀 Quick Handoff (Copy This)

```
We're building the House Party App (AI-assisted event planning).

Foundation is 100% complete. Read these files in order:

1. README.md - Project overview
2. v1/dev/context.md - Current state (last 50 lines show recent progress)
3. v1/dev/tasks.md - Task checklist (see IN PROGRESS section)
4. .claude/session-state.log - Last checkpoint (tail -50)

Tech stack: FastAPI + PostgreSQL+pgvector + Next.js
Branch: claude/expand-seed-data-017U1BvVDd1Q8Bop9ooQKkrj

What's done:
- Database schema (13 tables) ✅
- Seed data (2,100+ lines, 16 events) ✅
- Ground truth query system (keyword + semantic) ✅
- Implementation guide (150 tasks) ✅
- Claude infrastructure (skills + hooks) ✅

Next step: [FILL IN CURRENT TASK]

Continue from where we left off.
```

---

## 🚑 After Crash Recovery (Copy This)

```
Claude Code just crashed. I need to recover context.

Run this first to see what was happening:
1. Read .claude/session-state.log (tail -50 lines)
2. Read .claude/change-log.txt (tail -20 lines)
3. Check git status

Then read these for full context:
- v1/dev/context.md (see Recent Changes section)
- v1/dev/tasks.md (see what's checked off)
- v1/SESSION_HISTORY.md (full conversation log if needed)

Tell me:
1. What was the last file changed?
2. What task were we working on?
3. Any uncommitted changes?
4. How to resume?
```

---

## 📋 Context Reset (No Crash) - Copy This

```
We just had a context reset. Read .claude/session-state.log to see the last checkpoint.

Project: House Party App (AI event planning)
Branch: claude/expand-seed-data-017U1BvVDd1Q8Bop9ooQKkrj

Foundation complete. Now implementing: [FILL IN PHASE]

Quick context:
- Read v1/dev/context.md - Current state
- Read v1/dev/tasks.md - See checkboxes for progress
- Read tail of .claude/session-state.log - Last checkpoint

Continue from checkpoint.
```

---

## 🔍 Deep Context Needed (Copy This)

```
I need you to fully understand the House Party App project.

Read these IN ORDER:

1. README.md - High-level overview
2. v1/dev/plan.md - Architecture decisions (why we chose this approach)
3. v1/dev/context.md - Current project state
4. v1/dev/tasks.md - Task breakdown (150 tasks)
5. v1/IMPLEMENTATION_GUIDE.md - Step-by-step guide with code examples
6. .claude/session-state.log - Recent session history
7. v1/SESSION_HISTORY.md - Complete conversation log

Tech stack: FastAPI (Python) + PostgreSQL w/ pgvector + Next.js + WebSocket

Key features:
- 3 interaction modes: Guest AI Assistant, Group Chat (observer), Host Interface
- Ground truth query: Two-tier (keyword matching → semantic search fallback)
- Groups optional (one-off events OR recurring group events)

What's built:
- Database schema: 13 tables ✅
- Seed data: 2,100+ lines (16 events, 50+ messages) ✅
- Ground truth query system: keyword + semantic search ✅
- Tests: 30+ unit tests ✅
- Infrastructure: Skills + hooks for crash recovery ✅

Current phase: [FILL IN]

After reading, confirm what we're working on and continue.
```

---

## 🛠️ Implementation Phase (Copy This)

```
We're in implementation phase for House Party App.

Current phase: [Day X - FILL IN]

Quick context:
- Phase 1 (Day 1): EC2 setup ← [MARK IF CURRENT]
- Phase 2 (Days 2-5): Backend API ← [MARK IF CURRENT]
- Phase 3 (Days 6-9): Frontend ← [MARK IF CURRENT]

Read v1/IMPLEMENTATION_GUIDE.md for full task list.

Last completed: [FILL IN TASK]
Working on: [FILL IN CURRENT TASK]

Check git status and .claude/change-log.txt for recent changes.

Continue implementation from current task.
```

---

## 📦 Files to Check (Quick Reference)

### Always Check First
```bash
# Last session checkpoint
tail -50 .claude/session-state.log

# Recent file changes
tail -20 .claude/change-log.txt

# Git status
git status

# Current tasks
grep "IN PROGRESS" -A 5 v1/dev/tasks.md
```

### For Full Context
- `README.md` - Project overview
- `v1/dev/plan.md` - Architecture (478 lines)
- `v1/dev/context.md` - Project state (461 lines)
- `v1/dev/tasks.md` - 150 tasks
- `v1/IMPLEMENTATION_GUIDE.md` - Step-by-step guide
- `v1/SESSION_HISTORY.md` - Full conversation log
- `.claude/session-state.log` - Session checkpoints

---

## 🎯 What to Fill In

When using these templates, replace:
- `[FILL IN CURRENT TASK]` - Current task from tasks.md
- `[FILL IN PHASE]` - Phase 1/2/3/4
- `[Day X]` - Current day (1-12)
- `[MARK IF CURRENT]` - Add ✅ or remove

---

## 💡 Pro Tips

**For routine continuations**:
→ Use "Quick Handoff" (first template)

**After crashes**:
→ Use "After Crash Recovery" (second template)

**After context resets**:
→ Use "Context Reset" (third template)

**When Claude is confused**:
→ Use "Deep Context Needed" (fourth template)

**During active implementation**:
→ Use "Implementation Phase" (fifth template)

---

## 🔧 Emergency Commands

If hooks didn't save state:
```bash
# Manual recovery
./.claude/hooks/session-crash-recovery.sh

# See all recent changes
cat .claude/change-log.txt | tail -50

# See git changes
git log -10 --oneline
git diff
```

---

## Example Usage

**Scenario**: Claude Code crashes while you're building auth endpoints

**What you do**:
1. Run: `./.claude/hooks/session-crash-recovery.sh`
2. Copy "After Crash Recovery" template above
3. Fill in: "Working on: Build authentication endpoints (Phase 2)"
4. Paste to new Claude session
5. Claude reads files and resumes

**Result**: Back on track in 30 seconds! ✅

---

**Last Updated**: 2025-11-18
**Branch**: `claude/expand-seed-data-017U1BvVDd1Q8Bop9ooQKkrj`
