#!/bin/bash

# MeepleGo BGG Hot Games Import Script
# This script triggers the edge function to import BoardGameGeek's current hot games

echo "🚀 Starting BGG Hot Games Import..."

# Get the Supabase URL from .env.local
SUPABASE_URL=$(grep "NEXT_PUBLIC_SUPABASE_URL=" .env.local | cut -d'=' -f2)
if [ -z "$SUPABASE_URL" ]; then
    echo "❌ Error: Could not find NEXT_PUBLIC_SUPABASE_URL in .env.local"
    exit 1
fi

echo "📡 Function URL: ${SUPABASE_URL}/functions/v1/populate-games"
echo ""

# Get the service role key from .env.local
SERVICE_KEY=$(grep "SUPABASE_SERVICE_ROLE_KEY=" .env.local | cut -d'=' -f2)

if [ -z "$SERVICE_KEY" ]; then
    echo "❌ Error: Could not find SUPABASE_SERVICE_ROLE_KEY in .env.local"
    echo "Please make sure your .env.local file contains the service role key."
    exit 1
fi

echo "🔑 Service key found (length: ${#SERVICE_KEY} characters)"
echo "⏳ Triggering import function..."
echo ""

# Make the API call
response=$(curl -s -w "HTTPSTATUS:%{http_code}" \
  -X POST \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  "${SUPABASE_URL}/functions/v1/populate-games")

# Extract HTTP status and body
http_code=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
body=$(echo $response | sed -e 's/HTTPSTATUS:.*//g')

echo "📊 Response Status: $http_code"
echo "📋 Response Body:"
echo "$body" | jq '.' 2>/dev/null || echo "$body"
echo ""

if [ "$http_code" -eq 200 ]; then
    echo "✅ Import completed successfully!"
    echo ""
    echo "🔗 Check your results:"
    echo "   • Supabase Dashboard: https://supabase.com/dashboard/project/dsqceuerzoeotrcatxvb/database/tables"
    echo "   • Function Logs: https://supabase.com/dashboard/project/dsqceuerzoeotrcatxvb/functions/populate-games"
    echo ""
    echo "📈 Next steps:"
    echo "   • Check the 'games' table for imported data"
    echo "   • Run your Next.js app to see the real game data"
    echo "   • The function imported BGG's current 'hot' games list"
else
    echo "❌ Import failed with status $http_code"
    echo ""
    echo "🔧 Troubleshooting:"
    echo "   • Check function logs: https://supabase.com/dashboard/project/dsqceuerzoeotrcatxvb/functions/populate-games"
    echo "   • Verify database schema is applied"
    echo "   • Check if BGG API is accessible"
fi
