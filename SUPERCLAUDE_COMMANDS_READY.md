# ✅ SuperClaude Commands Now Working!

**Date**: 2025-10-21
**Status**: ✅ All 26 commands installed
**Location**: `~/.claude/commands/sc/`

## How to Use SuperClaude Commands

### In Cursor Chat, type:

```
/sc:
```

You should now see autocomplete with all 26 commands!

## Available Commands

### Code Analysis & Understanding
- `/sc:analyze` - Comprehensive code analysis (quality, security, performance, architecture)
- `/sc:explain` - Detailed code explanations
- `/sc:troubleshoot` - Debug and solve problems

### Planning & Design
- `/sc:brainstorm` - Interactive requirements discovery
- `/sc:design` - System design and architecture planning
- `/sc:spec-panel` - Create technical specifications
- `/sc:estimate` - Estimate effort and complexity

### Implementation
- `/sc:implement` - Implement features with best practices
- `/sc:build` - Build components and systems
- `/sc:improve` - Refactor and improve existing code
- `/sc:test` - Create comprehensive tests

### Project Management
- `/sc:pm` - Project management and task coordination
- `/sc:task` - Task breakdown and planning
- `/sc:workflow` - Workflow automation and optimization

### Documentation
- `/sc:document` - Generate comprehensive documentation
- `/sc:help` - List all SuperClaude commands

### Code Quality
- `/sc:cleanup` - Code cleanup and formatting
- `/sc:reflect` - Code review and reflection

### Research & Learning
- `/sc:research` - Deep research on topics
- `/sc:select-tool` - Choose best tools/libraries

### Business
- `/sc:business-panel` - Business analysis and strategy

### Utilities
- `/sc:git` - Git operations and best practices
- `/sc:save` - Save context and state
- `/sc:load` - Load saved context
- `/sc:spawn` - Spawn new agent instances
- `/sc:index` - Index and organize codebase

## Quick Test

Try this right now in Cursor:

```
/sc:help
```

You should see a full list of commands with descriptions!

## Common Use Cases for PERMUTATION

### 1. Analyze Brain System
```
/sc:analyze frontend/app/api/brain/route.ts
```
**What it does**: Deep analysis of the brain route code quality, security, and architecture

### 2. Document Brain-Enhanced
```
/sc:document brain-enhanced system
```
**What it does**: Generate comprehensive documentation for Brain-Enhanced

### 3. Plan Feature
```
/sc:brainstorm integrate Sequential MCP with brain system
```
**What it does**: Interactive planning session for new feature

### 4. Troubleshoot Issues
```
/sc:troubleshoot TypeScript iterator errors in brain-skills
```
**What it does**: Systematic debugging assistance

### 5. Test Strategy
```
/sc:test create test plan for brain systems comparison
```
**What it does**: Generate comprehensive test strategy

### 6. Improve Code
```
/sc:improve brain route performance
```
**What it does**: Analyze and suggest improvements

## How Commands Work

Each command is a **specialized prompt** that:
1. Activates specific behavior modes
2. Follows structured workflows
3. Uses domain expertise
4. Provides consistent output

**Example - `/sc:analyze`:**
- Analyzes code quality
- Checks security issues
- Evaluates performance
- Reviews architecture
- Provides actionable recommendations

## Commands vs. Natural Language

**You can still use natural language!** SuperClaude commands are optional:

**With command:**
```
/sc:analyze frontend/app/api/brain/route.ts
```

**Without command (still works):**
```
Analyze the brain route for quality, security, and performance issues
```

**Benefit of commands**: More structured, consistent output

## Troubleshooting

### Commands don't appear in autocomplete

**Fix 1: Reload Cursor**
```bash
# Close and reopen Cursor window
# Or: Cmd/Ctrl + Shift + P → "Reload Window"
```

**Fix 2: Check installation**
```bash
ls ~/.claude/commands/sc/ | wc -l
# Should show: 26
```

**Fix 3: Verify command format**
```bash
head -5 ~/.claude/commands/sc/help.md
# Should show YAML frontmatter
```

### Command runs but doesn't work as expected

**Check**: Make sure to type the full command with `:` separator
```
✅ Correct: /sc:help
❌ Wrong: /sc help
❌ Wrong: /schelp
```

## What's Different from Regular Claude?

**Regular Claude:**
- General-purpose responses
- Varies based on phrasing
- No guaranteed structure

**SuperClaude Commands:**
- Specialized workflows
- Consistent output format
- Domain-specific expertise
- Follows best practices automatically

## Example Session

```
User: /sc:analyze frontend/app/api/brain/route.ts

Claude: # Code Analysis Report

## Quality Assessment
- Code complexity: High (2447 lines)
- Maintainability: Moderate
- Test coverage: Unknown

## Security Analysis
- API key handling: ✅ Proper
- Input validation: ⚠️  Needs improvement
- Error handling: ✅ Good

## Performance
- Async operations: ✅ Properly parallelized
- Timeout protection: ✅ Implemented
- Caching: ❌ Not implemented

## Architecture
- Pattern: Subconscious memory
- Coupling: Moderate
- Scalability: Good

## Recommendations
1. Add input validation for query parameter
2. Implement response caching
3. Extract skill execution into separate module
4. Add comprehensive error types
...
```

## Tips for Best Results

1. **Be specific**: `/sc:analyze specific_file.ts` better than `/sc:analyze`
2. **Use context**: Mention what you're trying to achieve
3. **Combine commands**: Use multiple commands in sequence
4. **Review output**: Commands provide structured output - review all sections

## Command Chaining Example

```
# 1. Analyze current code
/sc:analyze frontend/app/api/brain/route.ts

# 2. Based on analysis, improve
/sc:improve brain route based on analysis

# 3. Test improvements
/sc:test create tests for improved brain route

# 4. Document changes
/sc:document changes made to brain route
```

## Success! 🎉

SuperClaude commands are now fully functional in Cursor. Try `/sc:help` to get started!

---

**Status**: ✅ Ready to use
**Commands Installed**: 26
**Location**: ~/.claude/commands/sc/
**Next**: Try `/sc:help` in Cursor chat
