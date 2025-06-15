#!/bin/bash

# Database safety wrapper for DuoLog.ai
# Prevents destructive operations in production

if [ "$VERCEL_ENV" = "production" ] || [ "$NODE_ENV" = "production" ]; then
  echo "🚨 PRODUCTION ENVIRONMENT DETECTED"
  echo "❌ Database reset operations are FORBIDDEN"
  echo "❌ Only migration files allowed: psql -f migration.sql"
  echo "❌ Operation blocked for data protection"
  exit 1
fi

if [ "$VERCEL_ENV" = "preview" ]; then
  echo "⚠️  PREVIEW ENVIRONMENT - Proceed with caution"
  read -p "Continue? (y/N): " confirm
  if [ "$confirm" != "y" ]; then
    exit 1
  fi
fi

echo "✅ Local development environment confirmed"
echo "✅ Database operation allowed"