# Art Collectibles Market Insights Service

Generates comprehensive Market Pulse reports for art collectibles categories using PERMUTATION_LITE. 
Focused on the art collectibles investment market with professional financial analysis format.

## Supported Art Collectibles Categories

- **watches**: Luxury watches and timepieces market
- **cars**: Collectible and classic cars market
- **jewelry**: Fine jewelry and gemstones market
- **sports**: Sports memorabilia and collectibles market
- **nfts**: NFTs and digital art collectibles market

## Features

- Uses PERMUTATION_LITE (lite version) for high-quality art collectibles market analysis
- Generates reports in professional Market Pulse format matching financial market analysis
- Supports daily and weekly updates for all categories
- Automated scheduling system for batch generation
- Structured output with:
  - Market overview with indices, percentages, and projections
  - Specific items with market caps and valuations
  - Index assets analysis with market positioning
  - Future outlook on technology, demographics, and market trajectory
- References auction houses (Sotheby's, Christie's, Heritage, Bonhams, Phillips)
- Includes fractional ownership and market indices analysis

## Usage

### API Endpoints

#### Single Category

```typescript
POST /api/market-insights
{
  "category": "sports",
  "frequency": "weekly",
  "includeItems": true,
  "includeIndex": true,
  "includeOutlook": true,
  "maxItems": 3,
  "maxIndexAssets": 5
}
```

#### Batch Generation (All Categories)

```typescript
POST /api/market-insights/batch
{
  "frequency": "weekly",
  "categories": ["watches", "cars", "jewelry", "sports", "nfts"],
  "includeItems": true,
  "includeIndex": true,
  "includeOutlook": true
}
```

### Programmatic Usage

```typescript
import { marketInsightsService } from './lib/market-insights/market-insights-service';

const insights = await marketInsightsService.generateMarketInsights({
  category: 'sports',
  frequency: 'weekly',
  includeItems: true,
  includeIndex: true,
  includeOutlook: true,
});

const markdown = marketInsightsService.formatAsMarkdown(insights);
```

### Scheduling

```typescript
import { marketInsightsScheduler } from './lib/market-insights/market-insights-scheduler';

// Initialize default schedules for all categories
marketInsightsScheduler.initializeDefaultSchedules('weekly');

// Generate all due reports
const results = await marketInsightsScheduler.generateDueReports();
```

### Scheduler API

```typescript
// Add a schedule
POST /api/market-insights/schedule
{
  "action": "add",
  "category": "watches",
  "frequency": "daily",
  "enabled": true
}

// Generate due reports
POST /api/market-insights/schedule
{
  "action": "generate"
}

// Get all schedules
GET /api/market-insights/schedule
```

## Report Format

The service generates reports in the Market Pulse format:

1. **Market Overview**: Current market conditions, trends, and challenges
2. **Specific Items**: Notable items with market caps, trends, and significance
3. **Index Assets**: Key market positions and analysis
4. **Future Outlook**: Forward-looking analysis on technology, demographics, and market trajectory

Example output matches the professional Market Pulse format with detailed analysis, specific numbers, and data-rich insights.

## Integration with PERMUTATION_LITE

The service uses PERMUTATION_LITE with:
- Teacher-Student system for real-time market data
- GEPA optimization for quality insights
- ReasoningBank for learning from previous reports
- Context engineering for comprehensive analysis

## Testing

Run the test script:

```bash
npx tsx test-market-insights.ts
```

