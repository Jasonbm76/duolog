# Debug Reset Usage Button

## Steps to Debug the Reset Button Issue

### 1. Check Local Supabase Status
First, make sure your local Supabase instance is running:

```bash
supabase status
```

You should see services running on:
- API URL: http://127.0.0.1:64321
- DB URL: postgresql://postgres:postgres@127.0.0.1:64322/postgres

### 2. Test Database Connection
Check if you can connect to the database:

```bash
psql postgresql://postgres:postgres@127.0.0.1:64322/postgres -c "SELECT COUNT(*) FROM usage_tracking;"
```

### 3. Test Reset API Directly
With the dev server running, test the API:

```bash
curl -X POST http://localhost:3000/api/dev/reset-usage \
  -H "Content-Type: application/json" \
  -d '{"action": "reset_counts"}' | jq
```

### 4. Check Browser Console
1. Open chat page with full usage
2. Open browser developer tools (F12)
3. Go to Console tab
4. Click the reset usage button
5. Look for debug messages:

Expected sequence:
```
🔄 Starting reset usage...
Reset API response: {success: true, message: "..."}
⏳ Waiting for database commit...
🔄 Refreshing usage status with identifiers...
Generated identifiers: {fingerprint: "...", persistentId: "...", sessionId: "..."}
Making request to: /api/chat/usage?...
Usage API response: {used: 0, limit: 5, hasOwnKeys: false}
Calling onUsageStatusChange with: {used: 0, limit: 5, hasOwnKeys: false}
✅ Usage status refresh completed
🔄 [ChatContainer] handleUsageStatusChange called with: {used: 0, limit: 5, hasOwnKeys: false}
✅ [ChatContainer] UsageStatus state updated
```

### 5. Check Database After Reset
Verify the database was actually updated:

```bash
psql postgresql://postgres:postgres@127.0.0.1:64322/postgres -c "SELECT user_identifier, conversation_count, daily_limit FROM usage_tracking;"
```

### 6. Common Issues & Solutions

#### Issue: "Failed to connect to localhost"
**Cause**: Dev server not running
**Solution**: Run `npm run dev`

#### Issue: "Database not configured"
**Cause**: Supabase local not running
**Solution**: Run `supabase start`

#### Issue: Reset API succeeds but UI doesn't update
**Cause**: User identification mismatch or callback issue
**Check**: Look for the callback chain in console logs

#### Issue: Database connection error
**Cause**: Wrong environment variables
**Check**: Verify `.env.local` has correct Supabase URLs

### 7. Emergency Reset (Development Only)
If the button still doesn't work, manually reset via database:

```bash
psql postgresql://postgres:postgres@127.0.0.1:64322/postgres -c "UPDATE usage_tracking SET conversation_count = 0;"
```

Then refresh the page.

## Current Debug Implementation

The reset button now has comprehensive logging to help identify exactly where the failure occurs. Check the browser console for the debug sequence above.