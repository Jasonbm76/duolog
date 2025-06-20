#!/bin/bash

# Database Safety Check Script
# Prevents accidental operations on production data

echo "🤖 DuoLog Database Safety Check"
echo "⚠️  This affects REAL AI collaboration conversation data"

# Check if we're in production
if [ "$NODE_ENV" = "production" ] || [ "$VERCEL_ENV" = "production" ]; then
    echo "❌ FORBIDDEN: Cannot run database operations in production"
    echo "⚠️  This would affect live DuoLog user conversations"
    exit 1
fi

# Check for production-like database URLs
if [[ "$DATABASE_URL" == *"amazonaws.com"* ]] || [[ "$DATABASE_URL" == *"supabase.co"* ]]; then
    echo "❌ FORBIDDEN: Production database URL detected"
    echo "⚠️  This would affect live user data"
    exit 1
fi

# Check if we're in preview environment
if [ "$VERCEL_ENV" = "preview" ]; then
  echo "⚠️  PREVIEW ENVIRONMENT - Proceed with caution"
  read -p "Continue? (y/N): " confirm
  if [ "$confirm" != "y" ]; then
    exit 1
  fi
fi

echo "✅ Local development environment confirmed"
echo "✅ Safe to modify test conversation data"