#!/usr/bin/env node

/**
 * DuoLog Backup Cleanup
 * Maintains 7-day retention policy for database backups
 */

const fs = require('fs');
const path = require('path');

const BACKUPS_DIR = path.join(__dirname, '../backups');
const RETENTION_DAYS = 7;

console.log('🧹 DuoLog Backup Cleanup');
console.log('========================');

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