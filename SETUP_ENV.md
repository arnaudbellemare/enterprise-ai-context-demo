# 🔑 Environment Setup

## Quick Setup

Copy and paste this into your terminal to create `frontend/.env.local`:

```bash
cd /Users/cno/enterprise-ai-context-demo/enterprise-ai-context-demo-2/enterprise-ai-context-demo/frontend

cat > .env.local << 'EOF'
# Perplexity API (Teacher Model)
PERPLEXITY_API_KEY=[PERPLEXITY_API_KEY]

# Supabase
POSTGRES_URL="postgres://postgres.ofvbywlqztkgugrkibcp:2B6CrtZ0kQ2vf1ty@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x"
POSTGRES_USER="postgres"
POSTGRES_HOST="db.ofvbywlqztkgugrkibcp.supabase.co"
POSTGRES_PASSWORD="2B6CrtZ0kQ2vf1ty"
POSTGRES_DATABASE="postgres"
POSTGRES_PRISMA_URL="postgres://postgres.ofvbywlqztkgugrkibcp:2B6CrtZ0kQ2vf1ty@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true"
POSTGRES_URL_NON_POOLING="postgres://postgres.ofvbywlqztkgugrkibcp:2B6CrtZ0kQ2vf1ty@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require"

# Supabase JWT
SUPABASE_JWT_SECRET="70DrirZbgRLAZjLnGLSsEwi57pZBJ2MkRIfG6AiTos/BjkNJuklOzCufJM3ktcooh4ZLzICqREEV6tJbkMDA8Q=="
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mdmJ5d2xxenRrZ3VncmtpYmNwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODc1NjY5NiwiZXhwIjoyMDc0MzMyNjk2fQ.27G-xBmfI0zGj6UdH7KO_Kz9eyOagl1YaHou5LPXERE"

# Supabase Public
SUPABASE_URL="https://ofvbywlqztkgugrkibcp.supabase.co"
NEXT_PUBLIC_SUPABASE_URL="https://ofvbywlqztkgugrkibcp.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mdmJ5d2xxenRrZ3VncmtpYmNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3NTY2OTYsImV4cCI6MjA3NDMzMjY5Nn0.r3Kw4QEPTkSh0m8UEjuwYPNkx6HhtwO1pghWu2EMulU"

# Ollama (optional)
OLLAMA_URL="http://localhost:11434"
EOF

echo "✅ .env.local created successfully!"
```

## Then Restart the Server

```bash
# Stop current server (Ctrl+C if running)

# Restart with new environment variables
cd frontend
npm run dev
```

## What This Enables

With these API keys configured:

✅ **Perplexity API (Teacher Model)**
- Real-time web search and data
- Actual Hacker News trends (not fallback)
- Live cryptocurrency prices
- Current news and information

✅ **Supabase Database**
- ReasoningBank memory storage
- Vector embeddings for similarity search
- Persistent data across sessions
- Multi-user support

## Verify It's Working

1. Go to http://localhost:3001/chat-reasoning
2. Ask: "What are the top trending discussions on Hacker News?"
3. You should see **REAL** data from Perplexity instead of fallback responses!

## How to Tell If It's Working

**Before (Fallback):**
```
*Note: For real-time data, configure PERPLEXITY_API_KEY...
```

**After (Real API):**
```
Based on current Hacker News data from the last 24 hours:
1. [Actual trending story title]
2. [Another real story]
...
```

## Troubleshooting

If you see fallback responses:
1. Check `.env.local` was created: `ls -la frontend/.env.local`
2. Verify API key is set: `cat frontend/.env.local | grep PERPLEXITY`
3. Restart the dev server completely
4. Check console logs for "Calling Perplexity API..."

