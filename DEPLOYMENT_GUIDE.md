# Enterprise AI Context Engine - Deployment Guide

## 🚀 Quick Start (5 minutes)

### 1. Clone and Setup
```bash
git clone https://github.com/arnaudbellemare/enterprise-ai-context-demo
cd enterprise-ai-context-demo
python setup.py
```

### 2. Configure Environment
```bash
# Copy environment template
cp config/.env.example .env

# Edit .env with your API keys
nano .env
```

### 3. Start Services
```bash
# Terminal 1: Backend
python src/api/inventory.py

# Terminal 2: Frontend
cd frontend && npm run dev
```

### 4. Access Platform
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## 🏗️ Production Deployment

### Vercel Deployment (Recommended)

#### 1. Connect to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

#### 2. Configure Environment Variables
In Vercel dashboard, add:
```
PERPLEXITY_API_KEY=pplx-your-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

#### 3. Deploy Backend Functions
```bash
# Deploy API routes
vercel --prod --cwd backend
```

### Docker Deployment

#### 1. Create Dockerfile
```dockerfile
FROM python:3.9-slim

WORKDIR /app

# Install dependencies
COPY deployment/requirements.txt .
RUN pip install -r requirements.txt

# Copy application
COPY . .

# Expose port
EXPOSE 8000

# Start application
CMD ["python", "src/api/inventory.py"]
```

#### 2. Build and Run
```bash
# Build image
docker build -t enterprise-ai .

# Run container
docker run -p 8000:8000 --env-file .env enterprise-ai
```

## 🔧 Configuration

### Environment Variables

#### Core API Keys
```bash
PERPLEXITY_API_KEY=pplx-your-key
OPENAI_API_KEY=sk-your-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

#### AI Processing
```bash
GEPA_MAX_ITERATIONS=3
GEPA_REFLECTION_DEPTH=3
LANGSTRUCT_EXTRACTION_CONFIDENCE=0.85
RAG_HYBRID_RETRIEVAL=True
```

#### LangGraph Configuration
```bash
LANGGRAPH_CHECKPOINTING=True
LANGGRAPH_PERSISTENCE=True
LANGGRAPH_MAX_CYCLES=10
```

### Database Setup

#### 1. Supabase Setup
```sql
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Run migrations
\i supabase/migrations/001_initial_schema.sql
```

#### 2. Vector Storage
```sql
-- Create vector table
CREATE TABLE vectors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content TEXT NOT NULL,
    embedding VECTOR(1536),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 📊 Monitoring & Observability

### 1. Prometheus Metrics
```bash
# Enable metrics
PROMETHEUS_ENABLED=True
PROMETHEUS_PORT=9090
```

### 2. Logging Configuration
```bash
# Structured logging
LOG_LEVEL=INFO
LOG_FORMAT=json
LOG_FILE=logs/enterprise_ai.log
```

### 3. Analytics Dashboard
- **Metrics**: GEPA optimization scores, LangStruct accuracy
- **Performance**: Processing times, confidence scores
- **Business Impact**: Turnover gains, cost savings

## 🔒 Security Configuration

### 1. Authentication
```bash
JWT_SECRET_KEY=your-secret-key
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24
```

### 2. Rate Limiting
```bash
RATE_LIMIT_REQUESTS_PER_MINUTE=100
RATE_LIMIT_BURST_SIZE=20
```

### 3. CORS Configuration
```bash
CORS_ORIGINS=["https://your-domain.com"]
CORS_CREDENTIALS=True
```

## 🚀 Scaling Configuration

### 1. Multi-tenant Setup
```bash
MULTI_TENANT_ENABLED=True
TENANT_ISOLATION_LEVEL=strict
```

### 2. Agent Swarm Configuration
```bash
SWARM_MAX_AGENTS=10
SWARM_PARALLEL_EXECUTION=True
SWARM_FAULT_TOLERANCE=True
```

### 3. Caching
```bash
REDIS_URL=redis://localhost:6379
CACHE_TTL=3600
```

## 📈 Performance Optimization

### 1. Target Metrics
- **Processing Time**: <2.0 seconds
- **Confidence Score**: >90%
- **Accuracy Score**: >85%
- **Turnover Gain**: 38%+
- **Error Reduction**: 65%+

### 2. Optimization Settings
```bash
# GEPA Optimization
GEPA_POPULATION_SIZE=10
GEPA_MUTATION_RATE=0.1

# LangStruct Processing
LANGSTRUCT_BATCH_SIZE=10
LANGSTRUCT_SCHEMA_OPTIMIZATION=True

# RAG Configuration
RAG_MAX_CHUNKS=5
RAG_CHUNK_SIZE=1000
RAG_CHUNK_OVERLAP=200
```

## 🔧 Troubleshooting

### Common Issues

#### 1. API Key Errors
```bash
# Check environment variables
echo $PERPLEXITY_API_KEY
echo $SUPABASE_URL
```

#### 2. Database Connection
```bash
# Test Supabase connection
python -c "from supabase import create_client; print('Connected')"
```

#### 3. Frontend Build Issues
```bash
# Clear cache and rebuild
cd frontend
rm -rf .next node_modules
npm install
npm run build
```

### Performance Issues

#### 1. Slow Processing
- Check GEPA iteration count
- Verify LangStruct confidence thresholds
- Monitor database query performance

#### 2. High Memory Usage
- Adjust batch sizes
- Enable caching
- Optimize vector storage

## 📋 Health Checks

### 1. Backend Health
```bash
curl http://localhost:8000/health
```

### 2. Frontend Health
```bash
curl http://localhost:3000/api/health
```

### 3. Database Health
```sql
SELECT COUNT(*) FROM graph_states;
SELECT COUNT(*) FROM structured_extractions;
```

## 🎯 Production Checklist

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] API keys validated
- [ ] Frontend built and deployed
- [ ] Backend API running
- [ ] Health checks passing
- [ ] Monitoring configured
- [ ] Security settings applied
- [ ] Performance metrics baseline
- [ ] Backup strategy implemented

## 📞 Support

For deployment issues:
1. Check logs: `tail -f logs/enterprise_ai.log`
2. Verify environment: `python -c "import os; print(os.environ.get('PERPLEXITY_API_KEY'))"`
3. Test API: `curl -X POST http://localhost:8000/optimize-inventory -H "Content-Type: application/json" -d '{"query": "test"}'`

## 🚀 Next Steps

1. **Pilot Deployment**: Start with inventory optimization
2. **Scale Gradually**: Add more agents and workflows
3. **Monitor Performance**: Track metrics and optimize
4. **Expand Features**: Add Graph RAG and multi-modal support
5. **Enterprise Integration**: Connect to existing systems