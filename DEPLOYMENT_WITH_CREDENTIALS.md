# 🚀 Deployment Guide with Your Credentials

## ✅ Your Credentials Are Ready!

You have all the necessary credentials for deployment. **IMPORTANT**: Replace the placeholder values below with your actual credentials.

### **Supabase Database:**
- **URL**: `https://your-project-id.supabase.co`
- **Anon Key**: `your_supabase_anon_key_here`
- **Service Role Key**: `your_supabase_service_role_key_here`

### **Perplexity AI:**
- **API Key**: `your_perplexity_api_key_here`

## 🗄️ Step 1: Setup Supabase Database

### **Run SQL Migrations:**

1. **Go to your Supabase Dashboard**: https://supabase.com/dashboard/project/your-project-id
2. **Navigate to SQL Editor**
3. **Copy and paste the contents of `supabase/migrations/001_initial_schema.sql`**
4. **Click "Run" to execute the migrations**

This will create:
- ✅ Users table with authentication
- ✅ Context items for AI context management
- ✅ AI sessions for GEPA optimization tracking
- ✅ Metrics table for analytics
- ✅ Knowledge base with vector embeddings
- ✅ Vector embeddings table for RAG
- ✅ Audit logs for security compliance
- ✅ Row Level Security (RLS) policies
- ✅ Vector similarity search functions

## 🚀 Step 2: Deploy to Vercel

### **1. Go to Vercel:**
- Visit: https://vercel.com/new
- Click "Import Git Repository"
- Select: `arnaudbellemare/enterprise-ai-context-demo`

### **2. Configure Project:**
- **Framework Preset**: Next.js
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `.next`

### **3. Add Environment Variables:**

Click "Environment Variables" and add these **EXACT** values:

```
# Perplexity AI
PERPLEXITY_API_KEY=your_perplexity_api_key_here

# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Frontend Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Database Configuration
POSTGRES_URL=your_postgres_url_here
POSTGRES_USER=your_postgres_user_here
POSTGRES_HOST=your_postgres_host_here
POSTGRES_PASSWORD=your_postgres_password_here
POSTGRES_DATABASE=your_postgres_database_here

# JWT Configuration
SUPABASE_JWT_SECRET=your_supabase_jwt_secret_here

# AI Configuration
DSPY_MODEL_NAME=llama-3.1-sonar-large-128k-online
DSPY_MAX_TOKENS=4000
DSPY_TEMPERATURE=0.7

# Security
SECRET_KEY=your_random_secret_key_here
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=1440
```

### **4. Deploy:**
- Click "Deploy"
- Wait for deployment to complete
- Your app will be available at: `https://your-app-name.vercel.app`

## 🔐 Step 3: Configure Authentication

### **1. Go to Supabase Dashboard:**
- Visit: https://supabase.com/dashboard/project/your-project-id
- Navigate to "Authentication" → "Settings"

### **2. Configure Site URL:**
- **Site URL**: `https://your-vercel-app.vercel.app`
- **Redirect URLs**: `https://your-vercel-app.vercel.app/auth/callback`

### **3. Enable Auth Providers:**
- Go to "Authentication" → "Providers"
- Enable **Google** (recommended for demo)
- Or enable **Email** for password-based auth

## 🧪 Step 4: Test Your Deployment

### **1. Visit Your App:**
- Go to your Vercel URL
- You should see the Enterprise AI Context dashboard

### **2. Test Authentication:**
- Click "Sign in with Google" (or your chosen provider)
- Complete the authentication flow

### **3. Test AI Features:**
- Try the GEPA optimization dashboard
- Test the context management interface
- Check the analytics dashboard

## 🎯 Step 5: Add Sample Data

### **1. Add Knowledge Base Content:**
```sql
INSERT INTO knowledge_base (title, content, source, metadata) VALUES
('GEPA Optimization', 'GEPA is a genetic-pareto optimization framework that uses reflective prompt evolution to improve AI performance.', 'documentation', '{"category": "ai", "importance": "high"}'),
('Context Engineering', 'Context engineering involves assembling relevant information from multiple sources to provide comprehensive context for AI agents.', 'documentation', '{"category": "ai", "importance": "high"}'),
('Enterprise AI', 'Enterprise AI solutions require robust security, compliance, and integration capabilities for production deployment.', 'documentation', '{"category": "enterprise", "importance": "high"}');
```

### **2. Add Sample Metrics:**
```sql
INSERT INTO metrics (metric_name, value, metadata, tags) VALUES
('ai_response_time', 1.2, '{"unit": "seconds"}', '{"model": "perplexity"}'),
('context_accuracy', 94.5, '{"unit": "percentage"}', '{"type": "quality"}'),
('user_satisfaction', 87.3, '{"unit": "percentage"}', '{"type": "user_experience"}'),
('system_uptime', 99.8, '{"unit": "percentage"}', '{"type": "reliability"}');
```

## 🎉 You're Done!

Your Enterprise AI Context Engineering platform is now live with:

- ✅ **Perplexity AI Integration** for real-time information access
- ✅ **Supabase Database** with vector embeddings and RLS security
- ✅ **Next.js Frontend** with modern UI and real-time updates
- ✅ **FastAPI Backend** with GEPA optimization and context assembly
- ✅ **Enterprise Security** with authentication and audit logging
- ✅ **Real-time Analytics** with performance monitoring

## 📊 What You Can Do Now:

1. **Test AI Context Assembly** - Dynamic context from multiple sources
2. **Try GEPA Optimization** - Reflective prompt evolution in action
3. **Explore Analytics** - Real-time performance metrics
4. **Manage Knowledge Base** - Add and search enterprise content
5. **Monitor Security** - Audit logs and compliance tracking

**Your platform is ready to help enterprises achieve better AI results!** 🚀
