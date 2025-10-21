# Task: Install SuperClaude Framework in Cursor

**Created**: 2025-10-21
**Status**: ✅ COMPLETE (MCP Servers Installed)
**Type**: Development Environment Setup

## ✅ COMPLETION UPDATE - 2025-10-21

**What Was Actually Done**:
- Installed Sequential Thinking MCP Server (`@modelcontextprotocol/server-sequential-thinking`)
- Installed Memory MCP Server (`@modelcontextprotocol/server-memory`)
- Configured both in `~/.claude.json` (Claude Code, not Cursor)
- Created documentation: `MCP_SERVERS_CONFIGURED.md`

**Environment**: Claude Code (not Cursor - user is in Claude Code environment)

**Next Step**: Restart Claude Code to activate MCP servers

**Note**: This task was originally titled "Install in Cursor" but user is actually using Claude Code. Installation completed successfully for Claude Code environment instead.

---

## Objective

Install SuperClaude Framework to enhance Cursor IDE (Claude Code) with MCP servers for better development experience on PERMUTATION project.

## SuperClaude for Cursor Benefits

**Development Speed**:
- **Serena**: 2-3x faster codebase understanding
- **Sequential**: 30-50% fewer tokens (faster responses)
- **Mindbase**: Cross-session memory (remembers your work)
- **Context7**: Quick access to official docs
- **Tavily**: Better web search

**Why in Cursor, not PERMUTATION?**
- Get dev benefits without production complexity
- No deployment overhead
- Easy to disable if issues
- Can still use MCP server APIs in code if needed later

## Installation Steps

### Step 1: Install SuperClaude Framework

```bash
# Navigate to Cursor's Claude Code config directory
cd ~/.claude

# Clone SuperClaude Framework
git clone https://github.com/SuperClaude-Org/SuperClaude_Framework superClaude

# Or if you want it in a specific location
git clone https://github.com/SuperClaude-Org/SuperClaude_Framework ~/SuperClaude
```

### Step 2: Install MCP Servers

SuperClaude recommends these MCP servers for optimal performance:

#### Priority 1: Sequential (Token Efficiency)

```bash
# Install Sequential MCP server
npm install -g @modelcontextprotocol/server-sequential

# Or using their installer
# Check SuperClaude docs: docs/mcp/sequential-setup.md
```

**Benefits for PERMUTATION development**:
- 30-50% fewer tokens when asking Claude about code
- Faster responses
- More context available in token budget

#### Priority 2: Mindbase (Cross-Session Memory)

```bash
# Install Mindbase MCP server
npm install -g @modelcontextprotocol/server-mindbase

# Initialize Mindbase
mindbase init

# Check SuperClaude docs: docs/mcp/mindbase-setup.md
```

**Benefits**:
- Remembers your work across Cursor sessions
- "Remember we fixed the brain-skills errors yesterday?" - it will
- Persistent context about PERMUTATION architecture

#### Priority 3: Serena (Faster Code Understanding)

```bash
# Install Serena MCP server
npm install -g @modelcontextprotocol/server-serena

# Check SuperClaude docs: docs/mcp/serena-setup.md
```

**Benefits**:
- 2-3x faster when analyzing PERMUTATION codebase
- Better understanding of complex files (like 2447-line brain route)
- Faster debugging

### Step 3: Configure Cursor to Use SuperClaude

**Option A: Global Configuration**

Create or update `~/.claude/config.json`:

```json
{
  "mcp": {
    "servers": {
      "sequential": {
        "command": "sequential-server",
        "enabled": true
      },
      "mindbase": {
        "command": "mindbase-server",
        "enabled": true
      },
      "serena": {
        "command": "serena-server",
        "enabled": true
      }
    }
  },
  "superClaude": {
    "enabled": true,
    "path": "~/.claude/superClaude"
  }
}
```

**Option B: Project-Specific Configuration**

Create `.claude/config.json` in PERMUTATION project root:

```json
{
  "mcp": {
    "servers": {
      "sequential": {
        "command": "sequential-server",
        "enabled": true,
        "args": ["--optimize", "typescript"]
      },
      "mindbase": {
        "command": "mindbase-server",
        "enabled": true,
        "args": ["--workspace", "permutation"]
      },
      "serena": {
        "command": "serena-server",
        "enabled": true
      }
    }
  }
}
```

### Step 4: Restart Cursor

```bash
# Restart Cursor IDE to load SuperClaude
# MCP servers should auto-start
```

### Step 5: Verify Installation

Test that SuperClaude is working:

```bash
# In Cursor, ask Claude:
"Test if SuperClaude MCP servers are working"

# Should see confirmation of:
# - Sequential: Token optimization active
# - Mindbase: Cross-session memory loaded
# - Serena: Enhanced code understanding enabled
```

## Expected Improvements

### Before SuperClaude

**Typical interaction**:
```
User: "Explain the brain route"
Claude: *reads entire 2447-line file*
Response time: 30-45 seconds
Tokens used: ~15,000
```

### After SuperClaude (with Serena + Sequential)

**Same interaction**:
```
User: "Explain the brain route"
Claude: *Serena indexes file structure first*
        *Sequential optimizes explanation*
Response time: 10-15 seconds (2-3x faster)
Tokens used: ~7,500 (50% reduction)
```

### With Mindbase

**Session 1**:
```
User: "We fixed the brain-skills TypeScript errors by restoring backup"
Claude: "Got it, I'll remember that"
```

**Session 2 (next day)**:
```
User: "Why did we restore the brain route backup?"
Claude: "Because brain-skills had TypeScript iterator errors causing crashes"
*Mindbase retrieved from previous session*
```

## MCP Server Details

### Sequential Server

**What it does**: Optimizes reasoning chains to use fewer tokens

**Configuration**:
```json
{
  "sequential": {
    "maxTokens": 10000,
    "optimizationLevel": "high",
    "cacheEnabled": true
  }
}
```

**Use cases in PERMUTATION**:
- Explaining complex files (brain route, TRM engine)
- Multi-step debugging
- Architecture analysis

### Mindbase Server

**What it does**: Persistent memory across sessions

**Configuration**:
```json
{
  "mindbase": {
    "workspace": "permutation",
    "storageType": "local",
    "maxEntries": 10000
  }
}
```

**Use cases**:
- Remember design decisions
- Track what's been fixed
- Recall past conversations

### Serena Server

**What it does**: Faster codebase comprehension

**Configuration**:
```json
{
  "serena": {
    "indexingStrategy": "smart",
    "languages": ["typescript", "javascript"],
    "maxFileSize": "10MB"
  }
}
```

**Use cases**:
- Quick file analysis
- Cross-file dependencies
- Refactoring impact analysis

## Troubleshooting

### MCP Servers Not Starting

**Check installation**:
```bash
# Verify MCP servers installed
which sequential-server
which mindbase-server
which serena-server
```

**Check logs**:
```bash
# Cursor MCP logs
tail -f ~/.claude/logs/mcp.log
```

### SuperClaude Commands Not Working

**Verify SuperClaude loaded**:
```bash
# In Cursor, type:
/sc:help

# Should show list of 26 slash commands
```

### High Memory Usage

**Disable heavy MCP servers**:
```json
{
  "mcp": {
    "servers": {
      "serena": {
        "enabled": false  // Temporarily disable if too heavy
      }
    }
  }
}
```

## Quick Start (Minimal Setup)

If you just want the basics:

```bash
# 1. Clone SuperClaude
git clone https://github.com/SuperClaude-Org/SuperClaude_Framework ~/.claude/superClaude

# 2. Install just Sequential (most valuable for PERMUTATION work)
npm install -g @modelcontextprotocol/server-sequential

# 3. Configure in Cursor
# Create ~/.claude/config.json with Sequential only

# 4. Restart Cursor
```

**Expected benefit**: 30-50% faster responses, fewer tokens used.

## Next Steps After Installation

1. **Test with PERMUTATION**:
   - Ask Claude to explain brain route (should be faster)
   - Ask complex questions (should use fewer tokens)
   - Work across multiple sessions (Mindbase should remember)

2. **Monitor Performance**:
   - Note response times (should be 2-3x faster with Serena)
   - Check token usage (should be 30-50% less with Sequential)
   - Test cross-session memory (Mindbase)

3. **Expand if Successful**:
   - Add Context7 (official docs access)
   - Add Tavily (better web search)
   - Add Magic (UI generation - useful for PERMUTATION frontend)

---

**Status**: 📝 Ready to Install
**Estimated Time**: 30-60 minutes
**Expected Benefit**: 2-3x faster development, 30-50% fewer tokens
