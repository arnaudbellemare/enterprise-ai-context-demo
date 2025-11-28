# Agent Harness System

A structured system for managing long-running AI agent development, based on Anthropic's learnings.

## Core Principles

1. **State belongs in files, not prompts**
2. **Structured task tracking** (JSON) survives context boundaries
3. **Unstructured progress notes** (plain text) capture context
4. **Git checkpoints** enable session continuity

## Structure

```
.agent-harness/
├── tasks.json          # Structured task tracking (JSON)
├── progress.txt        # Unstructured progress notes (plain text)
├── startup.sh          # Startup protocol script
└── README.md           # This file
```

## Usage

### Starting a Session

```bash
# Run the startup protocol
bash .agent-harness/startup.sh

# Or manually:
# 1. Verify location (pwd)
# 2. Read git logs + progress files
# 3. Read task list
# 4. Check dev server status
# 5. Run integration tests
# 6. Pick highest priority incomplete task
```

### Working on a Task

1. **Pick ONE feature** - Never try to build everything in one session
2. **Break into granular subtasks** - 200+ items prevent premature completion
3. **Update tasks.json** - Mark subtasks as completed
4. **Take notes in progress.txt** - Document decisions, challenges, learnings
5. **Commit frequently** - After each feature completion

### Ending a Session

1. **Update tasks.json** - Mark current task status
2. **Add notes to progress.txt** - What worked, what didn't, next steps
3. **Git commit** - Create checkpoint
4. **Push if ready** - Share progress

## Task Status Values

- `pending` - Not started
- `in_progress` - Currently working on
- `completed` - Finished
- `blocked` - Cannot proceed (document why)

## Common Failure Modes (and Fixes)

### a) Premature Completion
**Problem**: Agent declares "done" at 30% progress  
**Fix**: 200+ granular task items. Seriously.

### b) One-Shotting
**Problem**: Agent tries to build everything in one session  
**Fix**: Constrain to ONE feature per session

### c) Test Deletion
**Problem**: Agent "fixes" failing tests by removing them  
**Fix**: Explicit instruction: "It is unacceptable to remove or edit tests"

### d) Context Exhaustion
**Problem**: Agent loses track of what's been done  
**Fix**: Git commits after every feature. The model is good at reading git logs.

## Task Format

```json
{
  "id": "email-001",
  "title": "Feature Name",
  "status": "in_progress",
  "priority": 8,
  "feature": "classification",
  "subtasks": [
    {"id": "email-001-001", "title": "Subtask 1", "status": "completed"},
    {"id": "email-001-002", "title": "Subtask 2", "status": "in_progress"}
  ]
}
```

## Progress Notes Format

Plain text file with:
- Date headers
- Completed items
- Key decisions
- Challenges encountered
- Next steps
- Context for next session

## Git Checkpoint Protocol

After completing a feature:
```bash
git add .
git commit -m "feat(email): Complete feature X - [brief description]"
git push  # If ready to share
```

## Integration with Development

The harness system integrates with:
- Git for version control
- npm scripts for testing
- Development server for verification
- Task tracking for progress

## Best Practices

1. **Granularity**: Break features into 20+ subtasks
2. **One Feature**: Work on ONE feature per session
3. **Frequent Commits**: Commit after each feature
4. **Progress Notes**: Document decisions and learnings
5. **Test Preservation**: Never remove or edit tests
6. **Context Management**: Use files, not prompts, for state

