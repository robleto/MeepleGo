#!/bin/bash

echo "🚀 Testing BGG Hot Games Import with Detailed Output..."

SERVICE_KEY=$(grep "SUPABASE_SERVICE_ROLE_KEY=" .env.local | cut -d'=' -f2)

echo "📡 Making API call..."
curl -X POST \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  "https://dsqceuerzoeotrcatxvb.supabase.co/functions/v1/populate-games" \
  --verbose

echo ""
echo "🔍 Checking what's in our database now:"
node debug-games.js
