#!/bin/bash

# Deploy Supabase Edge Functions
# Run this script to deploy all edge functions to Supabase

echo "🚀 Deploying Supabase Edge Functions..."
echo ""

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Install it first:"
    echo "   npm install -g supabase"
    exit 1
fi

# Check if logged in
if ! supabase projects list &> /dev/null; then
    echo "⚠️  Not logged in to Supabase. Run:"
    echo "   supabase login"
    exit 1
fi

echo "✅ Supabase CLI found and authenticated"
echo ""

# Deploy functions one by one
functions=("assemble-context" "gepa-optimize" "ingest-document" "perplexity-chat")

for func in "${functions[@]}"; do
    echo "📦 Deploying function: $func"
    if supabase functions deploy "$func" --project-ref $(grep NEXT_PUBLIC_SUPABASE_URL .env.local | cut -d'/' -f3 | cut -d'.' -f1); then
        echo "✅ Successfully deployed: $func"
    else
        echo "❌ Failed to deploy: $func"
    fi
    echo ""
done

echo "🎉 Deployment complete!"
echo ""
echo "Test your functions:"
echo "  supabase functions list"

