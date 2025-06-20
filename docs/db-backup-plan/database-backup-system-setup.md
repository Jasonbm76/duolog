# Database Backup System Setup Guide

> **For implementing comprehensive database backup and restore capabilities in new projects**

## Overview

This guide provides step-by-step instructions for implementing a robust database backup system with daily backups, 7-day retention, and disaster recovery capabilities. This system was battle-tested in CareMap and provides multiple layers of protection against data loss.

## Prerequisites

- PostgreSQL database (local Supabase or remote)
- PostgreSQL client tools installed (`pg_dump`, `psql`)
- Node.js project with npm scripts

## 1. Directory Structure Setup

Create the backup directory structure:

```bash
mkdir -p backups/production
echo "backups/" >> .gitignore
```

Update your `.gitignore` to protect backup files:

```gitignore
# Database dumps and backups (but not migrations)
/*.sql
*_data.sql
*_backup.sql
*_dump.sql
*facilities_data*.sql
*production_backup*.sql
*.backup
*.dump
/backups/
```

## 2. Environment Variables

Add these to your `.env.local` (and update production environment):

```bash
# Production Database Backup (only if backing up remote DB)
SUPABASE_PROD_DB_HOST=db.your-project.supabase.co
SUPABASE_PROD_DB_PASSWORD=your-production-db-password
```

**⚠️ Security Note:** Never commit these to source control.

## 3. Database Safety Script

Create `scripts/db-safety.sh`:

```bash
#!/bin/bash

# Database Safety Check Script
# Prevents accidental operations on production data

echo "🏠 [Your Project] Database Safety Check"
echo "⚠️  This affects REAL [your business context] data"

# Check if we're in production
if [ "$NODE_ENV" = "production" ] || [ "$VERCEL_ENV" = "production" ]; then
    echo "❌ FORBIDDEN: Cannot run database operations in production"
    echo "⚠️  This would affect live [your business] data"
    exit 1
fi

# Check for production-like database URLs
if [[ "$DATABASE_URL" == *"amazonaws.com"* ]] || [[ "$DATABASE_URL" == *"supabase.co"* ]]; then
    echo "❌ FORBIDDEN: Production database URL detected"
    echo "⚠️  This would affect live data"
    exit 1
fi

echo "✅ Local development environment confirmed"
echo "✅ Safe to modify test data"
```

Make it executable:

```bash
chmod +x scripts/db-safety.sh
```

## 4. Backup Scripts

### A. Cleanup Script

Create `scripts/cleanup-backups.js`:

```javascript
#!/usr/bin/env node

/**
 * [Your Project] Backup Cleanup
 * Maintains 7-day retention policy for database backups
 */

const fs = require('fs');
const path = require('path');

const BACKUPS_DIR = path.join(__dirname, '../backups');
const RETENTION_DAYS = 7;

console.log('🧹 [Your Project] Backup Cleanup');
console.log('=================================');

if (!fs.existsSync(BACKUPS_DIR)) {
  console.log('📁 No backups directory found, nothing to clean');
  process.exit(0);
}

const files = fs.readdirSync(BACKUPS_DIR)
  .filter(file => file.endsWith('.sql'))
  .map(file => {
    const filePath = path.join(BACKUPS_DIR, file);
    const stats = fs.statSync(filePath);
    return {
      name: file,
      path: filePath,
      age: Math.floor((Date.now() - stats.mtime) / (1000 * 60 * 60 * 24))
    };
  })
  .filter(file => file.age > RETENTION_DAYS);

if (files.length === 0) {
  console.log('✅ No old backups to clean (keeping 7 days)');
  process.exit(0);
}

console.log(`🗑️  Removing ${files.length} backup(s) older than ${RETENTION_DAYS} days:`);

files.forEach(file => {
  console.log(`   - ${file.name} (${file.age} days old)`);
  fs.unlinkSync(file.path);
});

console.log('✅ Cleanup complete');
```

### B. Restore Script

Create `scripts/restore-backup.js`:

```javascript
#!/usr/bin/env node

/**
 * [Your Project] Database Restore Script
 * Safely restores database from backup files
 * Protects against production restoration accidents
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BACKUPS_DIR = path.join(__dirname, '../backups');

function isLocalEnvironment() {
  const nodeEnv = process.env.NODE_ENV;
  const vercelEnv = process.env.VERCEL_ENV;
  
  if (nodeEnv === 'production' || vercelEnv === 'production') {
    console.error('🚨 FORBIDDEN: Cannot restore backups in production environment');
    console.error('❌ This would overwrite real [your business context] data');
    process.exit(1);
  }
  
  return true;
}

function getBackupFiles() {
  if (!fs.existsSync(BACKUPS_DIR)) {
    console.error('❌ No backups directory found');
    console.error(`Expected: ${BACKUPS_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(BACKUPS_DIR)
    .filter(file => file.endsWith('.sql'))
    .map(file => {
      const filePath = path.join(BACKUPS_DIR, file);
      const stats = fs.statSync(filePath);
      return {
        name: file,
        path: filePath,
        size: stats.size,
        modified: stats.mtime
      };
    })
    .sort((a, b) => b.modified - a.modified); // Newest first

  return files;
}

function formatFileSize(bytes) {
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)}MB`;
}

function listBackups() {
  const backups = getBackupFiles();
  
  if (backups.length === 0) {
    console.log('❌ No backup files found');
    console.log(`Create a backup first: npm run db:backup:local`);
    return;
  }

  console.log('📁 Available [Your Project] backups:');
  console.log('====================================');
  
  backups.forEach((backup, index) => {
    const age = Math.floor((Date.now() - backup.modified) / (1000 * 60 * 60));
    console.log(`${index + 1}. ${backup.name}`);
    console.log(`   Size: ${formatFileSize(backup.size)}, Age: ${age} hours ago`);
    console.log('');
  });
}

function restoreBackup(backupFile) {
  isLocalEnvironment();
  
  if (!fs.existsSync(backupFile)) {
    console.error(`❌ Backup file not found: ${backupFile}`);
    process.exit(1);
  }

  console.log('🏠 [Your Project] Database Restore');
  console.log('===================================');
  console.log(`📁 Restoring from: ${path.basename(backupFile)}`);
  console.log('⚠️  This will overwrite your current local database');
  console.log('');

  // Check if Supabase is running
  try {
    execSync('npx supabase status', { stdio: 'pipe' });
  } catch (error) {
    console.error('❌ Supabase is not running locally');
    console.error('Run: npx supabase start');
    process.exit(1);
  }

  try {
    console.log('🧹 Dropping existing local database...');
    execSync('./scripts/db-safety.sh', { stdio: 'inherit' });
    execSync('npx supabase db reset --local', { stdio: 'inherit' });
    
    console.log('📥 Restoring from backup...');
    // Update these connection details for your database setup
    const restoreCommand = `PGPASSWORD=postgres /opt/homebrew/opt/postgresql@15/bin/psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -f "${backupFile}"`;
    execSync(restoreCommand, { stdio: 'inherit' });
    
    console.log('✅ Database restored successfully!');
    console.log(`📊 Restored from: ${path.basename(backupFile)}`);
    
    // Run a quick verification - update this query for your main tables
    const countCommand = `PGPASSWORD=postgres /opt/homebrew/opt/postgresql@15/bin/psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -c "SELECT COUNT(*) as records FROM your_main_table;"`;
    console.log('🔍 Verification:');
    execSync(countCommand, { stdio: 'inherit' });
    
  } catch (error) {
    console.error('❌ Restore failed:', error.message);
    console.error('💡 Try: npm run db:backup:local && npm run db:restore:latest');
    process.exit(1);
  }
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--latest')) {
    const backups = getBackupFiles();
    if (backups.length === 0) {
      console.error('❌ No backups found');
      process.exit(1);
    }
    restoreBackup(backups[0].path);
    return;
  }
  
  if (args.includes('--list') || args.length === 0) {
    listBackups();
    console.log('Usage:');
    console.log('  npm run db:restore -- --latest     # Restore from newest backup');
    console.log('  npm run db:restore -- --list       # List available backups');
    console.log('  npm run db:restore -- filename.sql # Restore from specific backup');
    return;
  }
  
  // Restore from specific file
  const filename = args[0];
  const backupPath = path.isAbsolute(filename) 
    ? filename 
    : path.join(BACKUPS_DIR, filename);
  
  restoreBackup(backupPath);
}

if (require.main === module) {
  main();
}

module.exports = { restoreBackup, listBackups };
```

## 5. Package.json Scripts

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "backup-local": "npm run db:backup:local",
    "backup-prod": "npm run db:backup:prod",
    "db:backup:local": "mkdir -p backups && /opt/homebrew/opt/postgresql@15/bin/pg_dump postgresql://postgres:postgres@localhost:54322/postgres > backups/yourproject-local-$(date +%Y%m%d-%H%M%S).sql",
    "db:backup:prod": "/opt/homebrew/opt/postgresql@15/bin/pg_dump 'postgresql://postgres:${SUPABASE_PROD_DB_PASSWORD}@${SUPABASE_PROD_DB_HOST}:5432/postgres' > backups/production/yourproject-prod-$(date +%Y%m%d-%H%M%S).sql",
    "db:backup:daily": "mkdir -p backups && /opt/homebrew/opt/postgresql@15/bin/pg_dump postgresql://postgres:postgres@localhost:54322/postgres > backups/yourproject-daily-$(date +%Y%m%d-%H%M%S).sql && node scripts/cleanup-backups.js",
    "db:backup:pre-migration": "mkdir -p backups && /opt/homebrew/opt/postgresql@15/bin/pg_dump postgresql://postgres:postgres@localhost:54322/postgres > backups/yourproject-pre-migration-$(date +%Y%m%d-%H%M%S).sql",
    "db:migrate:safe": "npm run db:backup:pre-migration && ./scripts/db-safety.sh && npx supabase migration up",
    "db:restore": "node scripts/restore-backup.js",
    "db:restore:latest": "node scripts/restore-backup.js --latest",
    "db:reset:local": "if [ \"$NODE_ENV\" != \"production\" ]; then ./scripts/db-safety.sh && supabase db reset --local; else echo 'FORBIDDEN: Cannot reset production database'; exit 1; fi"
  }
}
```

**⚠️ Important:** Update the database connection strings for your specific setup:
- Replace `yourproject` with your actual project name
- Update PostgreSQL paths if different on your system
- Modify connection details for your database setup

## 6. Global CLAUDE.md Rules

Add these rules to your global CLAUDE.md file:

```markdown
## 🛡️ Database Safety Rules

### **NEVER ALLOWED - ZERO TOLERANCE:**
- `npx supabase db reset` without explicit backup first
- Any command that drops/truncates production tables
- `DROP DATABASE` or `DROP TABLE` commands
- Direct SQL that deletes large amounts of data
- Any operation that could cause irreversible data loss

### **REQUIRED SAFETY PROTOCOLS:**
1. **Always backup before migrations:** `npm run db:backup:pre-migration`
2. **Never touch production database directly** - only advise commands
3. **Run safety checks:** Use `./scripts/db-safety.sh` before destructive operations
4. **Test restore capability:** Regularly verify backups can restore successfully

### **Production Database Protection:**
- **NEVER run commands against production** - always advise what to run
- **ALWAYS suggest backup first** before any production operations
- **WARN about dangers** when suggesting production commands
- **Use Supabase MCP** for production changes when available

### **Backup Requirements:**
- **Daily backups:** Automated with 7-day retention
- **Pre-migration backups:** Before any schema changes
- **Production backups:** Weekly or before major deployments
- **Restore testing:** Verify backups work monthly

### **Emergency Procedures:**
If data loss occurs:
1. STOP all operations immediately
2. Assess scope of data loss
3. Restore from most recent backup
4. Verify data integrity
5. Document incident and improve safety measures
```

## 7. Cron Job Setup (Optional)

For automated daily backups, add to your crontab:

```bash
# Daily backup at 2 AM
0 2 * * * cd /path/to/your/project && npm run db:backup:daily
```

## 8. Usage Examples

### Daily Development Workflow

```bash
# Start your day with a backup
npm run backup-local

# Work on features...

# Before migrations
npm run db:migrate:safe

# If something goes wrong
npm run db:restore:latest
```

### Production Backup

```bash
# Create production backup (run locally)
npm run backup-prod

# List available backups
npm run db:restore -- --list

# Test restore from production backup
npm run db:restore -- production/yourproject-prod-20250617-140925.sql
```

## 9. Verification Checklist

After setup, verify:

- [ ] Backup scripts create files in `backups/` directory
- [ ] Safety script prevents production operations
- [ ] Restore script can successfully restore a backup
- [ ] Cleanup script removes old backups
- [ ] `.gitignore` prevents backup files from being committed
- [ ] Environment variables are set correctly
- [ ] All npm scripts work without errors

## 10. Maintenance

### Monthly Tasks
- Test restore process with production backup
- Verify backup file integrity
- Review backup storage usage
- Update retention policy if needed

### When Moving to Production
- Set up automated backups in production environment
- Configure monitoring for backup failures
- Document recovery procedures for your team
- Test disaster recovery scenarios

---

**⚠️ Remember:** This backup system is your safety net. Regular testing and maintenance ensure it will work when you need it most.