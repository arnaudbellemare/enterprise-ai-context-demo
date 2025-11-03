# Test Examples with Full Queries and Answers

## Quick Test Commands

### Single Test Example
```bash
npx tsx test-single-full-example.ts
```
Shows one complete test with full query and full answer.

### Full Test Suite (6 Tests)
```bash
npx tsx test-full-queries-and-answers.ts
```
Runs all 6 comprehensive tests with complete queries and answers.

---

## Test Cases Included

### 1. Art Insurance Premium
**Query:**
```
What should be the insurance premium on a painting of Alec Monopoly valued at $125,000? The painting will be displayed in a private gallery in New York with standard security measures.
```

**Expected Output:**
- Domain: art
- Route: complex
- Answer includes: Premium calculation (1-5% range), risk factors, coverage recommendations

---

### 2. Cross-Border Tax Planning
**Query:**
```
The portable asset tax trap

Jewelry, art, and collectibles can trigger tax events the moment they cross a border.

A $2M art collection moves from New York to London. The family's Delaware LLC structure? Worthless to UK tax authorities.

How can we properly plan for cross-border tax exposure when moving high-value portable assets?
```

**Expected Output:**
- Domain: financial
- Route: complex
- Answer includes: Situs rules, entity recognition, compliance strategies

---

### 3. Collection Management
**Query:**
```
A client has a $10M art collection with 50 pieces stored across 3 locations: New York, London, and Singapore. How should we manage insurance coverage, track valuations, and ensure compliance with tax authorities in all three jurisdictions?
```

**Expected Output:**
- Domain: financial
- Route: complex
- Answer includes: Multi-location management, insurance optimization, compliance frameworks

---

### 4. Estate Planning Strategy
**Query:**
```
Create an estate planning strategy for a family with $200M in assets including art collections, real estate, and trust structures. The family has members in the US, UK, and Singapore, and we need to optimize for tax efficiency across all three jurisdictions while planning for three generations.
```

**Expected Output:**
- Domain: financial
- Route: complex
- Answer includes: Multi-generational planning, tax optimization, trust structures

---

### 5. Insurance Report Generation
**Query:**
```
Generate a comprehensive insurance report for 25 collectible assets with a total value of $15M. The report should include current valuations, premium analysis, coverage gap identification, and specific renewal recommendations for each asset.
```

**Expected Output:**
- Domain: art
- Route: complex
- Answer includes: Valuation breakdown, premium analysis, coverage gaps, recommendations

---

### 6. Art Deco Valuation
**Query:**
```
What should be the insurance premium for a 1925 Art Deco Cartier platinum bracelet valued at $85,000? The bracelet will be worn regularly and occasionally displayed in museum exhibitions. It has original provenance documentation.
```

**Expected Output:**
- Domain: art
- Route: complex
- Answer includes: Premium calculation, risk assessment, provenance considerations

---

## Output Format

Each test shows:

1. **Full Query** - Complete question/request
2. **Processing Status** - Domain detection, routing, optimization
3. **Full Answer** - Complete response from the system
4. **Metadata** - Quality scores, verification status, performance metrics

## Sample Output Structure

```
📝 FULL QUERY:
----------------------------------------
[Complete query text]
----------------------------------------

🔄 Processing...

📋 FULL ANSWER:
========================================
[Complete answer text with detailed analysis]
========================================

📊 RESPONSE METADATA:
----------------------------------------
Domain: financial
Difficulty: 0.662
Quality Score: 1.000
Route: complex (confidence: 0.85)
Verification: ✅ Verified (confidence: 0.77)
Processing Time: 85000ms (85.0s)
Cost: $0.0010
----------------------------------------
```

## Running Tests

### Option 1: Single Quick Test
```bash
npx tsx test-single-full-example.ts
```
- Shows one complete example
- ~85 seconds
- Good for quick demonstration

### Option 2: Full Test Suite
```bash
npx tsx test-full-queries-and-answers.ts
```
- Runs all 6 tests
- Shows complete queries and answers for each
- ~8-10 minutes total
- Saves results to JSON file

### Option 3: Custom Test
Modify `test-single-full-example.ts` with your own query:
```typescript
const query = 'Your custom query here';
const domain = 'financial'; // or 'art', 'technical', or undefined for auto-detect
```

## Results Files

- `single-test-full-result.json` - Single test result
- `full-query-answer-test-results.json` - All test results with summaries

Both files include:
- Complete queries
- Full answers
- Metadata (quality, verification, performance)
- Timestamps

