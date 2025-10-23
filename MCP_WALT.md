### WALT MCP Integration

**Purpose**: Automatic tool discovery from websites for LLM agents with persistent storage and pattern learning

## Triggers
- Tool discovery needs: "discover tools from website", "find tools for domain"
- Automatic tool operations: "automate website interaction", "extract website tools"
- E-commerce automation: Amazon, eBay, shopping sites
- Financial data extraction: Stock prices, crypto data, market info
- Research automation: arXiv, Google Scholar, paper search
- Travel booking: Airbnb, Booking.com, flight search

## Choose When
- **Over manual tool creation**: When you need tools from websites automatically
- **For web automation**: When tasks require browser interaction
- **For large-scale tool needs**: When 5+ tools are needed across domains
- **Not for**: Simple API calls, static tools, non-web tasks

## Works Best With
- **Sequential**: WALT discovers tools → Sequential analyzes tool usage patterns
- **Playwright**: WALT tools use Playwright for browser automation
- **Context7**: WALT for custom sites → Context7 for official documentation
- **ACE Framework**: WALT tools learn usage patterns via ACE playbook evolution

## Architecture

### Python Bridge Service
- **Location**: `scripts/walt-service.py`
- **Port**: 5000 (default)
- **Endpoints**:
  - `GET /health` - Service health check
  - `POST /discover` - Discover tools from URL
  - `POST /generate` - Generate specific tool
  - `GET /tools` - List all discovered tools
  - `GET /tools/:domain/:name` - Get specific tool
  - `DELETE /tools/:domain/:name` - Delete tool

### Node.js Client
- **Location**: `frontend/lib/walt/client.ts`
- **Features**: Retry logic, error handling, timeout management
- **Singleton**: `getWALTClient()`

### Discovery Orchestrator
- **Location**: `frontend/lib/walt/discovery-orchestrator.ts`
- **Features**: Domain-based discovery, priority scheduling, 24h caching
- **Singleton**: `getDiscoveryOrchestrator()`

### Storage Layer
- **Location**: `frontend/lib/walt/storage.ts`
- **Database**: Supabase `walt_discovered_tools` table
- **Features**: Semantic search, quality scoring, execution tracking
- **Singleton**: `getWALTStorage()`

### Tool Integration
- **Location**: `frontend/lib/walt/tool-integration.ts`
- **Features**: Auto-registration with ToolCallingSystem, IRT routing
- **Singleton**: `getWALTToolIntegration()`

### ACE Integration
- **Location**: `frontend/lib/walt/ace-integration.ts`
- **Features**: Pattern learning, playbook evolution, success/failure tracking
- **Singleton**: `getWALTACEIntegration()`

## API Routes

### Discovery
```typescript
POST /api/walt/discover
{
  "domain": "financial",  // OR
  "url": "https://finance.yahoo.com",
  "goal": "search stock prices",
  "force": false,
  "maxTools": 10
}

// Response
{
  "success": true,
  "domain": "financial",
  "tools_discovered": 5,
  "tools": [...]
}
```

### Execution
```typescript
POST /api/walt/execute
{
  "tool_name": "walt_yahoo_finance_search",
  "parameters": { "ticker": "AAPL" },
  "context": {
    "query": "What's Apple stock price?",
    "domain": "financial",
    "user_id": "user123",
    "session_id": "session456"
  }
}

// Response
{
  "success": true,
  "result": { "price": 150.25 },
  "execution_time_ms": 2500,
  "cost": 0.002,
  "cached": false
}
```

### Management
```typescript
// List tools
GET /api/walt/tools?domain=financial&limit=10

// Search tools
GET /api/walt/tools?search=stock+price&limit=5

// Initialize tools
POST /api/walt/tools
{
  "action": "initialize",
  "domain": "financial"  // OR
  "domains": ["financial", "e-commerce"],  // OR
  "high_priority_only": true
}

// Refresh tools
POST /api/walt/tools
{
  "action": "refresh",
  "domain": "financial"  // optional
}

// Delete tool
DELETE /api/walt/tools?tool_name=yahoo_finance_search
```

## Domain Configurations

### Financial
- **URLs**: Yahoo Finance, CoinMarketCap, Investing.com, MarketWatch, Bloomberg
- **Priority**: 1 (high)
- **Cache TTL**: 24 hours
- **Max Tools**: 5 per site

### E-commerce
- **URLs**: Amazon, eBay, Etsy, Walmart, BestBuy
- **Priority**: 2
- **Cache TTL**: 24 hours
- **Max Tools**: 8 per site

### Research
- **URLs**: arXiv, Google Scholar, ResearchGate, PubMed, JSTOR
- **Priority**: 1 (high)
- **Cache TTL**: 7 days
- **Max Tools**: 6 per site

### Travel
- **URLs**: Airbnb, Booking.com, Expedia, Kayak, Hotels.com
- **Priority**: 3
- **Cache TTL**: 2 days
- **Max Tools**: 6 per site

### Social
- **URLs**: Twitter, LinkedIn, Reddit, Facebook, Instagram
- **Priority**: 4 (requires auth)
- **Cache TTL**: 12 hours
- **Max Tools**: 4 per site

### News
- **URLs**: Reuters, BBC, CNN, NPR, Guardian
- **Priority**: 2
- **Cache TTL**: 6 hours
- **Max Tools**: 5 per site

### Analytics
- **URLs**: Kaggle, Data.gov, World Bank, Our World in Data, Statista
- **Priority**: 2
- **Cache TTL**: 7 days
- **Max Tools**: 6 per site

## Usage Examples

### Basic Discovery
```typescript
import { getDiscoveryOrchestrator } from '@/lib/walt';

const orchestrator = getDiscoveryOrchestrator();

// Discover financial tools
const tools = await orchestrator.discoverForDomain('financial');
console.log(`Discovered ${tools.length} financial tools`);
```

### Initialize Tools
```typescript
import { initializeWALTTools } from '@/lib/walt';

// Initialize high-priority domains
await initializeWALTTools({ highPriorityOnly: true });

// Initialize specific domains
await initializeWALTTools({ domains: ['financial', 'research'] });
```

### Execute Tool with Learning
```typescript
import { getWALTToolIntegration } from '@/lib/walt';

const integration = getWALTToolIntegration();

const result = await integration.executeWALTTool({
  tool_name: 'walt_yahoo_finance_search',
  parameters: { ticker: 'AAPL' },
  call_id: 'call_123',
  timestamp: Date.now()
}, {
  query: 'Apple stock price',
  domain: 'financial'
});

// Execution is automatically learned by ACE
```

### Semantic Search
```typescript
import { getWALTStorage } from '@/lib/walt';

const storage = getWALTStorage();

const tools = await storage.searchTools(
  'search for academic papers',
  {
    domain: ['research'],
    threshold: 0.7,
    limit: 5
  }
);
```

## Performance Optimization

### Caching Strategy
- **Tool definitions**: 24h TTL (most), 7d (research), 6h (news)
- **Execution results**: Per-tool configuration
- **Cache hit rate**: 40-60% expected

### Batch Processing
- **Max concurrent discoveries**: 2 (configurable)
- **Priority-based scheduling**: High-priority domains first
- **Quality filtering**: Minimum score 0.5

### Cost Management
- **Discovery cost**: $0.001-0.002 per tool (LLM-based)
- **Execution cost**: $0.001 base + time-based
- **Storage cost**: Supabase vector storage
- **Mitigation**: Aggressive caching, background jobs

## Integration with PERMUTATION

### IRT Routing
- Teacher model (Perplexity) for tool discovery (IRT > 0.7)
- Student model (Ollama) for tool execution (IRT < 0.5)

### ACE Framework
- Tool usage patterns stored in `ace_playbook_bullets`
- Success patterns: "Use tool X for domain Y"
- Failure patterns: "Avoid tool X for scenario Y"

### GEPA Optimization
- Tool selection strategies evolved via GEPA
- Multi-objective: quality, cost, latency

### ReasoningBank
- Tools stored with semantic embeddings
- Pattern retrieval for similar queries
- Solution reuse and adaptation

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
- Validate tools: `validateWALTTool(tool)`
- Check quality scores: `calculateToolQualityScore(tool)`
- Review execution history
- Test in sandbox first

## Best Practices

1. **Discovery Phase**:
   - Start with simple websites
   - Validate each discovered tool
   - Review and approve manually

2. **Production Use**:
   - Cache aggressively (24h TTL)
   - Monitor tool success rates
   - Implement fallback mechanisms
   - Log execution metrics

3. **Maintenance**:
   - Review tools weekly
   - Remove low-quality tools
   - Refresh outdated tools
   - Update metadata

4. **Security**:
   - Sandbox tool execution
   - Validate parameters
   - Monitor suspicious activity
   - Limit to trusted sites

## Performance Targets

- **Tool discovery**: 2-5 minutes per site (first time), <100ms (cached)
- **Tool execution**: <3 seconds (p95)
- **Cache hit rate**: 40-60%
- **Quality score**: >0.80 average
- **Success rate**: >90%

## Database Schema

### walt_discovered_tools
- Tool definitions with quality metrics
- Vector embeddings for semantic search
- Execution statistics and performance metrics

### walt_tool_executions
- Execution history with parameters and results
- Success/failure tracking
- Performance and cost metrics

### walt_tool_usage_patterns
- Learned patterns for ACE integration
- Success patterns, failure patterns, optimizations
- Confidence scoring and evidence counting

## Environment Variables

```bash
# Required
WALT_SERVICE_URL=http://localhost:5000
WALT_SERVICE_PORT=5000
WALT_ENABLED=true

# Optional
WALT_MAX_DISCOVERY_TIME=300000  # 5 minutes
WALT_CACHE_TTL=86400000         # 24 hours
```

## Commands

```bash
# Setup
npm run walt:setup

# Start service
npm run walt:start

# Test integration
npm run test:walt
```

See [WALT_SETUP.md](WALT_SETUP.md) for complete setup guide.
