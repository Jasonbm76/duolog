# Database Development Guide

## Supabase Local Development with Docker

This guide covers the complete setup and workflow for Duolog.ai's database using Supabase with Docker.

## Prerequisites

- Docker Desktop installed and running
- Supabase CLI installed (`brew install supabase/tap/supabase`)
- Node.js 18+ and npm

## Local Development Setup

### 1. Environment Variables

Copy the example environment file:
```bash
cp .env.example .env.local
```

For local development, your `.env.local` should contain:
```env
# Local Supabase (already configured)
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:64321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0

# Add your AI API keys
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

### 2. Start Local Supabase

```bash
# Start all Supabase services
supabase start

# This will:
# - Pull and start Docker containers
# - Run migrations from supabase/migrations/
# - Seed data from supabase/seed.sql
# - Start Supabase Studio at http://localhost:64323
```

### 3. Access Local Services

- **Supabase Studio**: http://localhost:64323 (Database GUI)
- **API**: http://localhost:64321
- **Database**: postgresql://postgres:postgres@localhost:64322/postgres
- **Email Testing**: http://localhost:64324

## Database Schema

### Core Tables

#### `users`
- Extends Supabase auth with app-specific fields
- Credit system for AI usage tracking
- Subscription management
- User preferences

#### `conversations`
- AI collaboration sessions
- Multiple collaboration modes (debate, consensus, etc.)
- Status tracking and completion reasons
- Cost and token usage tracking

#### `conversation_rounds`
- Individual ChatGPT ↔ Claude exchanges
- Response metadata and performance metrics
- User feedback and ratings
- Quality scoring system

#### `usage_analytics`
- Hourly analytics aggregation
- Admin dashboard metrics
- Performance monitoring
- Feature usage tracking

## Development Workflow

### Creating Migrations

When you need to modify the database schema:

```bash
# Create a new migration file
supabase migration new your_migration_name

# Edit the generated file in supabase/migrations/
# Example: supabase/migrations/20241206000002_add_feature.sql
```

Example migration:
```sql
-- Add a new column to conversations table
ALTER TABLE public.conversations 
ADD COLUMN tags TEXT[] DEFAULT '{}';

-- Create index for better performance
CREATE INDEX idx_conversations_tags ON public.conversations USING GIN (tags);
```

### Applying Migrations

```bash
# Apply migrations to local database
supabase db push --local

# Or restart to apply all migrations fresh
supabase db reset --local
```

### Database Inspection

```bash
# Connect to local database
psql postgresql://postgres:postgres@localhost:64322/postgres

# Or use Supabase Studio GUI
open http://localhost:64323
```

### Working with Data

```bash
# Generate TypeScript types from schema
supabase gen types typescript --local > types/database.ts

# View logs
supabase logs

# Stop services
supabase stop
```

## Production Deployment

### 1. Create Supabase Project

```bash
# Login to Supabase
supabase login

# Link to production project
supabase link --project-ref your-project-ref

# Push migrations to production
supabase db push
```

### 2. Environment Variables

For production, update your environment variables:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key
```

## Safety Guidelines

### ⚠️ CRITICAL RULES

1. **NEVER run destructive commands:**
   ```bash
   # ❌ FORBIDDEN
   supabase db reset  # (without --local)
   DROP DATABASE
   TRUNCATE TABLE
   ```

2. **Always use --local flag for development:**
   ```bash
   # ✅ SAFE
   supabase db reset --local
   supabase db push --local
   ```

3. **Migration Safety:**
   - Always test migrations locally first
   - Use individual migration files, not bulk operations
   - Never modify existing migration files (create new ones)
   - Backup production before major schema changes

4. **Data Preservation:**
   - All migrations should be additive when possible
   - Use `ALTER TABLE ADD COLUMN` instead of recreating tables
   - Plan for data migration scripts when needed

## Common Commands

```bash
# Development
supabase start                 # Start local environment
supabase stop                  # Stop local environment
supabase db reset --local      # Reset local database
supabase db push --local       # Apply migrations locally

# Production
supabase db push              # Apply migrations to production
supabase db pull              # Pull production schema
supabase migration list       # View migration status

# Utilities
supabase gen types typescript --local > types/database.ts
supabase logs
supabase status
```

## Troubleshooting

### Port Conflicts
If you get port conflicts, stop other Supabase projects:
```bash
supabase stop --project-id other-project
```

### Docker Issues
```bash
# Reset Docker state
docker system prune
supabase stop
supabase start
```

### Migration Errors
```bash
# View migration status
supabase migration list

# Fix and reapply
supabase db reset --local
```

## Best Practices

1. **Migration Naming**: Use descriptive names with timestamps
2. **Small Migrations**: Keep migrations focused and small
3. **Testing**: Always test migrations locally before production
4. **Rollbacks**: Plan rollback strategies for complex changes
5. **Documentation**: Document complex schema changes
6. **Row Level Security**: Always enable RLS on new tables
7. **Indexes**: Add indexes for performance-critical queries

## Integration with Next.js

The database is integrated with your Next.js app through:

- `lib/supabase.ts` - Client configuration and helpers
- `types/database.ts` - TypeScript type definitions
- API routes in `app/api/` - Server-side operations
- Real-time subscriptions for live updates

See the generated TypeScript types for complete API documentation.

## Support

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)
- Project-specific questions: Check CLAUDE.md for guidelines