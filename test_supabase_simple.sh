#!/bin/bash

echo "🔍 Testing Supabase Connection..."

# Load environment variables from .env.local
source frontend/.env.local

echo "📋 Environment Variables:"
echo "  URL: $(echo $NEXT_PUBLIC_SUPABASE_URL | cut -c1-20)..."
echo "  Key: $(echo $SUPABASE_SERVICE_ROLE_KEY | cut -c1-20)..."
echo ""

if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Missing Supabase credentials in .env.local"
    exit 1
fi

echo "🔍 Testing Supabase URL accessibility..."

# Test if the URL is reachable
if curl -s --head "$NEXT_PUBLIC_SUPABASE_URL" | head -n 1 | grep -q "200 OK"; then
    echo "✅ Supabase URL is accessible"
else
    echo "❌ Supabase URL is not accessible"
    echo "   This might be a network issue or the URL is incorrect"
    exit 1
fi

echo "🔍 Testing Supabase API with authentication..."

# Test a simple API call
response=$(curl -s -w "%{http_code}" -o /dev/null \
    -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
    -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
    "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/users?select=count")

if [ "$response" = "200" ]; then
    echo "✅ Supabase API authentication successful"
    echo "✅ Database connection working"
    echo ""
    echo "🎉 Supabase is fully functional!"
    echo "✅ Ready for workflow execution"
else
    echo "❌ Supabase API test failed with status: $response"
    echo "🔧 Troubleshooting:"
    echo "  1. Check your Supabase project is active"
    echo "  2. Verify the service role key is correct"
    echo "  3. Ensure RLS policies allow access"
    exit 1
fi
