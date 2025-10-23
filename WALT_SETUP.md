# WALT Integration Setup Guide

This guide will help you set up WALT (Web Agents that Learn Tools) integration with PERMUTATION.

## Prerequisites

- Python 3.11 or higher
- Node.js 18 or higher
- OpenAI API key (for tool discovery LLM)

## Quick Start

### 1. Setup WALT Environment

```bash
# Run the setup script (installs Python dependencies)
npm run walt:setup
```

This will:
- Create a Python virtual environment (`venv-walt`)
- Install WALT and dependencies
- Install Playwright browsers

### 2. Configure Environment Variables

Add to `frontend/.env.local`:

```bash
# WALT Service Configuration
WALT_SERVICE_URL=http://localhost:5000
WALT_SERVICE_PORT=5000
WALT_ENABLED=true

# Optional: Configure timeouts and caching
WALT_MAX_DISCOVERY_TIME=300000  # 5 minutes
WALT_CACHE_TTL=86400000         # 24 hours

# Required: OpenAI API key for tool discovery
OPENAI_API_KEY=sk-...
```

### 3. Start WALT Service

```bash
# Start the Python bridge service
npm run walt:start
```

The service will run on `http://localhost:5000` by default.

### 4. Test the Integration

```bash
# Run basic integration test
npm run test:walt
```

This will:
- Check WALT service health
- Discover tools from a test website
- Validate discovered tools
- Convert to PERMUTATION format

## Manual Setup (Alternative)

If you prefer manual setup:

```bash
# 1. Create virtual environment
python3 -m venv venv-walt

# 2. Activate virtual environment
source venv-walt/bin/activate

# 3. Install dependencies
pip install -r scripts/requirements-walt.txt

# 4. Install Playwright browsers
playwright install chromium

# 5. Start service
python3 scripts/walt-service.py
```

## Using WALT in Your Code

### Basic Tool Discovery

```typescript
import { getWALTClient } from './frontend/lib/walt/client';
import { convertWALTToolToPERMUTATION } from './frontend/lib/walt/adapter';

// Initialize client
const client = getWALTClient();

// Discover tools from a website
const result = await client.discoverTools({
  url: 'https://amazon.com',
  max_tools: 5,
  headless: true
});

// Convert to PERMUTATION format
const tools = result.tools.map(waltTool =>
  convertWALTToolToPERMUTATION(waltTool, ['e-commerce'])
);

// Register with ToolCallingSystem
import { getToolCallingSystem } from './frontend/lib/tool-calling-system';
const toolSystem = getToolCallingSystem();

tools.forEach(tool => toolSystem.registerTool(tool));
```

### Targeted Tool Generation

```typescript
// Generate a specific tool
const result = await client.generateTool({
  url: 'https://airbnb.com',
  goal: 'Search for accommodations',
  headless: true
});

if (result.success && result.tool) {
  const permutationTool = convertWALTToolToPERMUTATION(result.tool);
  toolSystem.registerTool(permutationTool);
}
```

### List and Manage Tools

```typescript
// List all discovered tools
const toolList = await client.listTools();
console.log(`Total tools: ${toolList.total_tools}`);

// Get specific tool
const tool = await client.getTool('amazon_com', 'search_products');

// Delete tool
await client.deleteTool('amazon_com', 'search_products');
```

## Architecture

### Python Bridge Service
- **Location**: `scripts/walt-service.py`
- **Purpose**: Exposes WALT functionality via HTTP API
- **Endpoints**:
  - `GET /health` - Health check
  - `POST /discover` - Discover tools from URL
  - `POST /generate` - Generate specific tool
  - `GET /tools` - List all tools
  - `GET /tools/:domain/:name` - Get specific tool
  - `DELETE /tools/:domain/:name` - Delete tool

### Node.js Client
- **Location**: `frontend/lib/walt/client.ts`
- **Purpose**: TypeScript client for Python bridge
- **Features**: Retry logic, error handling, timeout management

### Adapter Layer
- **Location**: `frontend/lib/walt/adapter.ts`
- **Purpose**: Convert WALT tools → PERMUTATION Tool interface
- **Features**: Validation, quality scoring, domain inference

### Type Definitions
- **Location**: `frontend/lib/walt/types.ts`
- **Purpose**: TypeScript types for WALT integration

## Domain Configuration

WALT can discover tools from various domains:

### Financial
- Stock price lookup
- Crypto market data
- Trading tools
- Financial calculators

### E-commerce
- Product search
- Price comparison
- Shopping cart operations
- Order tracking

### Research
- Academic paper search
- Citation lookup
- Reference management
- Data extraction

### Travel
- Flight search
- Hotel booking
- Accommodation search
- Itinerary planning

## Tool Storage

Discovered tools are stored in:

1. **Local filesystem**: `walt-tools/[domain]/[tool-name].json`
2. **Database**: `walt_discovered_tools` table (Supabase)
3. **ReasoningBank**: Semantic storage with embeddings

## Performance Optimization

### Caching Strategy
- **Tool definitions**: 24-hour TTL
- **Execution results**: Per-tool configuration
- **Discovery results**: Stored for reuse

### Background Discovery
- Schedule tool discovery during low-traffic periods
- Pre-discover tools for common domains
- Refresh tools weekly

### Rate Limiting
- Limit concurrent discoveries
- Throttle browser automation
- Respect website rate limits

## Troubleshooting

### Service Not Starting
```bash
# Check Python version
python3 --version  # Should be 3.11+

# Check virtual environment
source venv-walt/bin/activate
which python3  # Should point to venv

# Check dependencies
pip list | grep walt
```

### Discovery Failures
```bash
# Check Playwright installation
playwright --version

# Test manually
python3 scripts/walt-service.py
# In another terminal:
curl http://localhost:5000/health
```

### Connection Errors
```bash
# Check service is running
lsof -i :5000

# Check environment variables
echo $WALT_SERVICE_URL

# Test connectivity
curl http://localhost:5000/health
```

### Tool Quality Issues
- Validate tools before use: `validateWALTTool(tool)`
- Check quality scores: `calculateToolQualityScore(tool)`
- Review discovered steps for correctness
- Test tools in sandbox environment first

## Best Practices

1. **Discovery Phase**:
   - Start with simple websites
   - Gradually increase complexity
   - Validate each discovered tool
   - Review and approve tools manually

2. **Production Use**:
   - Cache aggressively (24-hour TTL)
   - Monitor tool success rates
   - Implement fallback mechanisms
   - Log tool execution metrics

3. **Maintenance**:
   - Review tools weekly
   - Remove low-quality tools
   - Refresh outdated tools
   - Update tool metadata

4. **Security**:
   - Sandbox tool execution
   - Validate tool parameters
   - Monitor for suspicious activity
   - Limit discovery to trusted sites

## Next Steps

1. **Phase 3**: Tool Discovery Orchestrator
   - Domain-specific discovery configs
   - Automated discovery pipelines
   - ReasoningBank integration

2. **Phase 4**: ToolCallingSystem Integration
   - Automatic tool registration
   - IRT-based routing
   - Performance tracking

3. **Phase 5**: ACE + WALT Evolution
   - Learn tool usage patterns
   - Optimize tool selection
   - Knowledge distillation

See [walt-integration.md](claude/tasks/walt-integration.md) for full implementation plan.
