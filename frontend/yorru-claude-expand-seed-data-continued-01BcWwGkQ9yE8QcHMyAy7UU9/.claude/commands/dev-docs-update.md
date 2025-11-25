---
description: Update dev docs (context.md, tasks.md) before context reset
---

Update the dev documentation to reflect current progress:

## Steps

1. **Read current state**
   - Read `/v1/dev/context.md` (focus on "Current Session Progress")
   - Read `/v1/dev/tasks.md` (check completed tasks)

2. **Update context.md**
   - Update the "SESSION PROGRESS" section with what was completed
   - Add any new architectural decisions made
   - Note any blockers or issues discovered
   - Update "Next Steps" section

3. **Update tasks.md**
   - Mark completed tasks as [x]
   - Move current task to "IN PROGRESS" section
   - Add any new subtasks discovered during implementation

4. **Add session summary**
   Append to `/v1/dev/context.md` under "SESSION HISTORY":
   ```markdown
   ### Session [DATE]
   **Completed**:
   - [List completed tasks]

   **Discovered**:
   - [New insights, decisions, or issues]

   **Next**:
   - [Immediate next steps]
   ```

5. **Commit changes**
   ```bash
   git add v1/dev/
   git commit -m "Update dev docs - session [DATE]"
   ```

## Example Output

After running this command, you should update:
- `/v1/dev/context.md` - Session progress updated
- `/v1/dev/tasks.md` - Checkboxes updated
- Commit made with summary

This ensures continuity across Claude Code sessions!
