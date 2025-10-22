# Cache Monitoring Guide

**Audience**: DevOps, SREs, Operations
**Time to Read**: 8 minutes

---

## Key Metrics

### Hit Rate
**Target**: 50-60%
**Formula**: `hits / (hits + misses)`

**Interpretation**:
- **< 30%**: 🔴 Critical - Run warming immediately
- **30-50%**: 🟡 Warning - Consider warming
- **50-60%**: 🟢 Good - Target achieved
- **> 60%**: 🟢 Excellent - Optimal performance

### Utilization
**Target**: 40-60%
**Formula**: `cacheSize / maxSize * 100`

**Interpretation**:
- **< 20%**: Underutilized - Warm cache
- **20-40%**: Low - Consider warming
- **40-60%**: Optimal - Well-balanced
- **> 90%**: High - Consider increasing size

---

## Real-Time Monitoring

### Dashboard Command

```bash
# Watch metrics every 30 seconds
watch -n 30 'curl -s http://localhost:3000/api/brain/cache/monitor | jq .current.metrics'
```

**Output**:
```json
{
  "hitRate": 0.55,
  "utilizationPercent": 45,
  "hitCount": 550,
  "missCount": 450,
  "cacheSize": 450,
  "maxSize": 1000
}
```

### Alert Check

```bash
# Check for alerts
curl -s http://localhost:3000/api/brain/cache/monitor | jq '.current.alerts'
```

**Output**:
```json
[
  {
    "level": "info",
    "message": "Cache performing well: 55.0% hit rate"
  }
]
```

### Get Recommendations

```bash
# Get optimization recommendations
curl -s http://localhost:3000/api/brain/cache/monitor | jq '.current.trends.recommendations'
```

**Output**:
```json
[
  "Cache performing optimally",
  "Continue current warming schedule"
]
```

---

## Alert Levels

### 🔴 CRITICAL Alerts

**Hit Rate < 30%**
```json
{
  "level": "critical",
  "message": "Cache hit rate critically low: 25.0%"
}
```

**Action**:
```bash
# Immediate warming
npm run warm-cache:parallel

# Verify
curl http://localhost:3000/api/brain/cache/monitor
```

### 🟡 WARNING Alerts

**Hit Rate < 50%**
```json
{
  "level": "warning",
  "message": "Cache hit rate below target: 42.0% (target: 50%+)"
}
```

**Action**:
```bash
# Schedule warming
npm run warm-cache

# Add to cron
0 */6 * * * cd /app && npm run warm-cache
```

**Utilization > 90%**
```json
{
  "level": "warning",
  "message": "Cache utilization high: 92.0%"
}
```

**Action**:
```typescript
// Increase cache size
// frontend/lib/brain-skills/skill-cache.ts
maxSize: 2000  // from 1000
```

### 🟢 INFO Alerts

**Hit Rate >= 60%**
```json
{
  "level": "info",
  "message": "Cache performing well: 62.0% hit rate"
}
```

**Action**: No action needed, system optimal

---

## Historical Analysis

### Query Historical Data

```bash
# Last 24 hours
curl "http://localhost:3000/api/brain/cache/monitor?history=true&hours=24" | jq '.history'
```

### Trend Analysis

**Hit Rate Trend**:
```bash
# Extract hit rates over time
curl -s "http://localhost:3000/api/brain/cache/monitor?history=true&hours=24" | \
  jq -r '.history[] | "\(.timestamp | strftime("%H:%M")) \(.hitRate * 100 | round)%"'
```

**Output**:
```
09:00 45%
10:00 48%
11:00 52%
12:00 55%
13:00 58%
```

---

## Automated Monitoring

### Setup Prometheus Metrics

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'cache-metrics'
    scrape_interval: 30s
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/api/brain/cache/monitor'
```

### Grafana Dashboard

**Query Examples**:
```promql
# Hit rate over time
cache_hit_rate{job="cache-metrics"}

# Cache utilization
cache_utilization_percent{job="cache-metrics"}

# Total requests
cache_hit_count + cache_miss_count
```

### Alertmanager Rules

```yaml
# alertmanager.yml
groups:
  - name: cache_alerts
    interval: 1m
    rules:
      - alert: CacheHitRateLow
        expr: cache_hit_rate < 0.3
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Cache hit rate critically low"
          description: "Hit rate is {{ $value | humanizePercentage }}"

      - alert: CacheHitRateBelowTarget
        expr: cache_hit_rate < 0.5
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Cache hit rate below target"
```

---

## Log Monitoring

### Cache-Related Logs

```bash
# Filter cache logs
tail -f /var/log/app.log | grep "Cache"
```

**Expected Patterns**:
```
[INFO] Cache HIT for trm_engine (age: 245s)
[INFO] Cache STORED for ace_framework (total: 452)
[WARN] Cache utilization: 92%
[ERROR] Cache warming failed: Network timeout
```

### Log Aggregation

**Elasticsearch Query**:
```json
{
  "query": {
    "bool": {
      "must": [
        { "match": { "message": "Cache" } },
        { "range": { "@timestamp": { "gte": "now-1h" } } }
      ]
    }
  },
  "aggs": {
    "hit_miss_ratio": {
      "terms": { "field": "cache_result.keyword" }
    }
  }
}
```

---

## Performance Monitoring

### Response Time Tracking

```bash
# Measure cache endpoint response time
time curl -s http://localhost:3000/api/brain/cache/monitor > /dev/null
```

**Target**: < 100ms

### Cache Operation Latency

Monitor these metrics:
- **Get (hit)**: < 5ms
- **Get (miss)**: < 5ms
- **Set**: < 10ms
- **Clear**: < 50ms

---

## Scheduled Tasks

### Daily Health Check

```bash
#!/bin/bash
# daily-cache-check.sh

METRICS=$(curl -s http://localhost:3000/api/brain/cache/monitor)
HIT_RATE=$(echo $METRICS | jq -r '.current.metrics.hitRate')

if (( $(echo "$HIT_RATE < 0.3" | bc -l) )); then
  echo "CRITICAL: Hit rate $HIT_RATE"
  npm run warm-cache:parallel
  # Send alert
  curl -X POST https://alerts.example.com/webhook \
    -d '{"text": "Cache hit rate critical: '"$HIT_RATE"'"}'
fi
```

### Weekly Report

```bash
#!/bin/bash
# weekly-cache-report.sh

echo "=== Weekly Cache Report ==="
echo "Period: $(date -d '7 days ago' +%Y-%m-%d) to $(date +%Y-%m-%d)"

METRICS=$(curl -s "http://localhost:3000/api/brain/cache/monitor?history=true&hours=168")

echo $METRICS | jq '{
  avgHitRate: (.history | map(.hitRate) | add / length),
  avgUtilization: (.history | map(.utilizationPercent) | add / length),
  totalRequests: (.history[-1].hitCount + .history[-1].missCount)
}'
```

---

## Troubleshooting Monitoring

### Metrics Not Updating

**Check**:
```bash
# Verify server running
curl http://localhost:3000/api/health

# Check database connection
psql $DATABASE_URL -c "SELECT COUNT(*) FROM cache_metrics_history;"
```

### High Memory Usage

**Monitor cache size**:
```bash
# Check cache memory usage
curl -s http://localhost:3000/api/brain/cache/monitor | jq '.current.metrics.cacheSize'
```

**Action**:
```typescript
// Reduce cache size
maxSize: 500  // from 1000
```

### Database Disk Space

**Check metrics table**:
```sql
SELECT
  pg_size_pretty(pg_total_relation_size('cache_metrics_history')) as size,
  COUNT(*) as rows
FROM cache_metrics_history;
```

**Action**: Run cleanup function
```sql
SELECT cleanup_old_cache_metrics();
```

---

## Best Practices

1. **Monitor Daily**: Check hit rate and utilization
2. **Set Up Alerts**: Configure Prometheus/Alertmanager
3. **Review Weekly**: Analyze trends and patterns
4. **Document Baselines**: Record normal operating metrics
5. **Test Monitoring**: Verify alerts trigger correctly

---

## Next Steps

- **Configuration**: [CONFIGURATION.md](CONFIGURATION.md)
- **Troubleshooting**: [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- **Deployment**: [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
