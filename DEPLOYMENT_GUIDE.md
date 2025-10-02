# 🚀 Deployment Guide: Enterprise AI Context Engineering

## Prerequisites

1. **GitHub Account**: Create a free account at [github.com](https://github.com)
2. **Supabase Account**: Create a free account at [supabase.com](https://supabase.com)
3. **Vercel Account**: Create a free account at [vercel.com](https://vercel.com)
4. **OpenAI API Key**: Get your API key from [platform.openai.com](https://platform.openai.com)

## Step 1: Create GitHub Repository

1. Go to [github.com/new](https://github.com/new)
2. Repository name: `enterprise-ai-context-demo`
3. Description: `Enterprise AI Context Engineering with GEPA-DSPy`
4. Make it **Public** (for free Vercel deployment)
5. Click "Create repository"

## Step 2: Push Code to GitHub

```bash
# Add GitHub remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/enterprise-ai-context-demo.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Step 3: Setup Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note down your:
   - Project URL
   - Anon (public) key
   - Service role key (optional)

3. In your Supabase dashboard, go to SQL Editor and run this SQL to create tables:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable vector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    roles TEXT[] DEFAULT '{}',
    security_level TEXT DEFAULT 'internal',
    permissions TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Context items table
CREATE TABLE context_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    session_id TEXT,
    content TEXT NOT NULL,
    source TEXT NOT NULL,
    relevance_score FLOAT DEFAULT 0.0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI sessions table
CREATE TABLE ai_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    session_name TEXT,
    context_data JSONB DEFAULT '{}',
    gepa_optimizations JSONB DEFAULT '{}',
    performance_metrics JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Metrics table
CREATE TABLE metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_name TEXT NOT NULL,
    value FLOAT NOT NULL,
    metadata JSONB DEFAULT '{}',
    tags JSONB DEFAULT '{}',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Knowledge base table with vector embeddings
CREATE TABLE knowledge_base (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    content_type TEXT DEFAULT 'text',
    source TEXT,
    metadata JSONB DEFAULT '{}',
    embedding VECTOR(1536),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vector embeddings table
CREATE TABLE vector_embeddings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content TEXT NOT NULL,
    embedding VECTOR(1536),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_context_items_user_id ON context_items(user_id);
CREATE INDEX idx_context_items_session_id ON context_items(session_id);
CREATE INDEX idx_ai_sessions_user_id ON ai_sessions(user_id);
CREATE INDEX idx_metrics_metric_name ON metrics(metric_name);
CREATE INDEX idx_metrics_timestamp ON metrics(timestamp);
CREATE INDEX idx_knowledge_base_embedding ON knowledge_base USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_vector_embeddings_embedding ON vector_embeddings USING ivfflat (embedding vector_cosine_ops);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE context_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE vector_embeddings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (basic - adjust based on your needs)
CREATE POLICY "Users can view their own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own data" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can view their own context items" ON context_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own context items" ON context_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own sessions" ON ai_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own sessions" ON ai_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
```

4. Go to Authentication > Settings and configure:
   - Site URL: `https://your-vercel-app.vercel.app`
   - Redirect URLs: `https://your-vercel-app.vercel.app/auth/callback`

## Step 4: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click "New Project"
3. Import your `enterprise-ai-context-demo` repository
4. Configure the project:
   - Framework Preset: `Next.js`
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `.next`

5. Add Environment Variables in Vercel:
   ```
   OPENAI_API_KEY=your_openai_api_key
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SECRET_KEY=your_random_secret_key
   ```

6. Click "Deploy"

## Step 5: Configure Authentication

1. In your Supabase dashboard, go to Authentication > Providers
2. Enable Google OAuth (or other providers you prefer)
3. Add your Vercel domain to allowed redirect URLs

## Step 6: Test Your Deployment

1. Visit your Vercel URL: `https://your-app-name.vercel.app`
2. Try signing in with your configured OAuth provider
3. Test the GEPA optimization dashboard
4. Check the context management features

## 🎉 You're Done!

Your enterprise AI context engineering platform is now deployed and ready to use!

### Next Steps:
- Customize the UI components in `frontend/components/`
- Add more AI agents in `src/agents/`
- Configure additional data sources in `src/enterprise/`
- Set up monitoring and analytics
- Scale based on your business needs

### Support:
- Check the logs in Vercel dashboard if you encounter issues
- Monitor your Supabase usage in the dashboard
- Review the application logs for debugging

Happy coding! 🚀
