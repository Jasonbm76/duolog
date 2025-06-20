#!/usr/bin/env node

/**
 * DuoLog Database Restore Script
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
    console.error('❌ This would overwrite real DuoLog conversation data');
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

  console.log('📁 Available DuoLog backups:');
  console.log('============================');
  
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

  console.log('🤖 DuoLog Database Restore');
  console.log('===========================');
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
    // Using DuoLog's correct port (64322) and PostgreSQL 15
    const restoreCommand = `PGPASSWORD=postgres /opt/homebrew/Cellar/postgresql@15/15.13/bin/psql -h 127.0.0.1 -p 64322 -U postgres -d postgres -f "${backupFile}"`;
    execSync(restoreCommand, { stdio: 'inherit' });
    
    console.log('✅ Database restored successfully!');
    console.log(`📊 Restored from: ${path.basename(backupFile)}`);
    
    // Run a quick verification
    const countCommand = `PGPASSWORD=postgres /opt/homebrew/Cellar/postgresql@15/15.13/bin/psql -h 127.0.0.1 -p 64322 -U postgres -d postgres -c "SELECT COUNT(*) as conversations FROM conversations;"`;
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