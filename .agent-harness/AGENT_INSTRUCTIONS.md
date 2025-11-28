# Agent Instructions for Email Classification Project

## Critical Rules

### 🚫 NEVER DO THESE THINGS

1. **Do NOT remove or edit tests** - It is unacceptable to remove or edit tests, even if they're failing
2. **Do NOT work on multiple features** - Work on ONE feature per session
3. **Do NOT skip the startup protocol** - Always run `bash .agent-harness/startup.sh` first
4. **Do NOT commit without updating tasks** - Always update tasks.json before committing

### ✅ ALWAYS DO THESE THINGS

1. **Run startup protocol** - `bash .agent-harness/startup.sh` at session start
2. **Pick ONE feature** - From tasks.json, pick the highest priority incomplete task
3. **Break into subtasks** - Create 20+ granular subtasks for each feature
4. **Update progress** - Add notes to progress.txt as you work
5. **Create checkpoints** - Use `bash .agent-harness/checkpoint.sh` after features
6. **Update tasks.json** - Mark subtasks as completed as you go

## Session Workflow

### 1. Start Session
```bash
bash .agent-harness/startup.sh
```

### 2. Pick Task
- Read tasks.json
- Find highest priority incomplete task
- Review progress.txt for context
- Check git log for recent work

### 3. Work on Feature
- Break feature into 20+ granular subtasks
- Work on ONE feature only
- Update tasks.json as you complete subtasks
- Add notes to progress.txt

### 4. End Session
```bash
# Update task status
bash .agent-harness/update-task.sh email-XXX completed

# Add final notes
bash .agent-harness/add-note.sh "Completed feature X. Next: Y"

# Create checkpoint
bash .agent-harness/checkpoint.sh "Complete feature X"
```

## Task Granularity

**Good**: 20+ subtasks per feature
- "Create EmailTemplate interface"
- "Add water-damage-incident template"
- "Add keywords array"
- "Add regex patterns"
- "Test classification"

**Bad**: 3-5 large tasks
- "Implement email classification"
- "Add all templates"
- "Test everything"

## Progress Notes Format

When adding notes to progress.txt:

```
## YYYY-MM-DD - Feature Name

### Completed
- Subtask 1
- Subtask 2

### Key Decisions
- Decision 1 and why
- Decision 2 and why

### Challenges Encountered
- Challenge 1 and how resolved
- Challenge 2 and current status

### Next Steps
- What to do next
- Blockers if any

### Context for Next Session
- Important context
- Where to start
- What to avoid
```

## Common Patterns

### Adding a New Template
1. Add template to EMAIL_TEMPLATES array
2. Create response generator function
3. Add to switch statement
4. Update EMAIL_TEMPLATES_REFERENCE.md
5. Test classification
6. Test response generation

### Fixing a Bug
1. Reproduce the bug
2. Identify root cause
3. Fix the issue
4. Add test to prevent regression
5. Update progress.txt with learnings

### Optimizing Performance
1. Profile the code
2. Identify bottleneck
3. Implement optimization
4. Measure improvement
5. Document in progress.txt

## Context Management

### State in Files
- ✅ tasks.json - Task status
- ✅ progress.txt - Notes and context
- ✅ Git commits - Code checkpoints
- ❌ Prompt context - Don't rely on this

### Reading State
- Read tasks.json to see what's done
- Read progress.txt for context
- Read git log for recent changes
- Read code comments for implementation details

## Failure Prevention

### Premature Completion
- **Problem**: Declaring "done" too early
- **Fix**: 20+ granular subtasks per feature
- **Check**: All subtasks completed?

### One-Shotting
- **Problem**: Trying to do everything at once
- **Fix**: ONE feature per session
- **Check**: Am I working on multiple features?

### Test Deletion
- **Problem**: Removing failing tests
- **Fix**: Never remove tests, fix the code
- **Check**: Did I edit or remove any test files?

### Context Exhaustion
- **Problem**: Losing track of progress
- **Fix**: Frequent commits and progress notes
- **Check**: Can I resume from git log + progress.txt?

## Integration Points

### With Codebase
- Email templates: `frontend/lib/email-template-classifier.ts`
- Response generators: `frontend/app/api/email/classify-and-respond/route.ts`
- Knowledge base: `frontend/lib/declaration-knowledge.ts`
- UI: `frontend/app/email-responder/page.tsx`

### With Git
- Commit after each feature
- Use descriptive commit messages
- Push when ready to share

### With Development
- Run dev server: `npm run dev`
- Run tests: `npm test`
- Build: `npm run build`

## Quick Reference

```bash
# Start session
bash .agent-harness/startup.sh

# Update task status
bash .agent-harness/update-task.sh email-001 completed

# Add note
bash .agent-harness/add-note.sh "Fixed language detection caching"

# Create checkpoint
bash .agent-harness/checkpoint.sh "Complete bilingual responses"
```

