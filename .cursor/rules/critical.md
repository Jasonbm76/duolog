# 🔥 Critical Rules - NEVER BREAK THESE - AT THE CREATION OF EVERY NEW CHAT I WANT YOU TO SUMMARIZE THAT YOU READ ALL OF THIS FILE AND WILL ADHERE TO THEM.

📋 **Essential Reading**: Always reference `/CLAUDE.md` for comprehensive project guidelines and best practices established from CodeRabbit feedback and development learnings.

## 🚨 File Naming Conventions - STRICTLY ENFORCED
- **Component Directories**: MUST use PascalCase: `components/Auth/`, `components/UI/`, `components/Facilities/`
- **Component Files**: MUST use PascalCase: `Header.tsx`, `Button.tsx`, `AddFacilityModal.tsx`
- **Type Files**: MUST use camelCase: `facility.ts`, `savedLists.ts`, `userRoles.ts`
- **Utility Files**: MUST use camelCase: `utils.ts`, `mapUtils.ts`, `buttonClasses.ts`
- **❌ NEVER CREATE**: kebab-case files (`button.tsx`, `saved-lists.ts`), snake_case (`user_roles.ts`), or mixed case directories (`components/ui/`)
- **❌ NEVER DUPLICATE**: modals or components across directories - consolidate into `components/UI/Modals/`
- **✅ ALWAYS**: Use `git mv` when renaming files to preserve history
- **✅ ALWAYS**: Update ALL import statements immediately after file/directory changes
- **✅ ALWAYS**: Remove unused imports and variables

## 🚨 Next.js 15 Compatibility Rules
- **✅ ALWAYS** use Next.js 15 compatible parameter handling in API routes
- **❌ NEVER** use old Next.js 14 style: `{ params }: { params: { id: string } }`
- **✅ ALWAYS** use Promise-based params: `{ params }: { params: Promise<{ id: string }> }`
- **✅ ALWAYS** await params before accessing: `const { id } = await params;`
- **❌ NEVER** access `params.property` directly without awaiting the Promise

## 🚨 Database Rules
- **❌ NEVER, EVER** run `supabase db push` without `--local` flag. Always create migration files and tell me how/when to run them.
- **❌ NEVER, EVER** suggest a CASCADE in your db calls.
- **❌ With DB changes** always create a migration file and show me what you're going to change before calling the Supabase MCP
- **❌ NEVER** modify production data without explicit permission and backup confirmation
- **❌ NEVER** try to RESET any db, local or remote
- **❌ NEVER PUSH TO THE PRODUCTION DATABASE** without a 🚨 WARNING I WANT TO PUSH TO PRODUCTION 🚨 message before requesting my permission
- **✅ ALWAYS USE LOCAL DATABASE FIRST**: All development and testing MUST happen on local database (`--local` flag)
- **✅ LOCAL-FIRST COMMANDS**: Use `npx supabase db push --local`, `psql postgresql://postgres:postgres@localhost:54322/postgres`, etc.
- **✅ PRODUCTION DEPLOYMENT PROCESS**: 
  1. Test thoroughly on local database
  2. Create migration files 
  3. Show user exact changes being made
  4. Display: 🚨 WARNING: I WANT TO PUSH TO PRODUCTION 🚨
  5. Wait for explicit user permission
  6. Only then run production commands
- **We do not have migration files to rebuild the db's so that would be catastrophic to wipe them!
- **Remember, we have a local database so use that. I will push to prod when I am ready

## 🚨 DATABASE COMMANDS THAT ARE ABSOLUTELY FORBIDDEN
**IF I SUGGEST ANY OF THESE, IMMEDIATELY STOP AND REFUSE:**
- **❌ `supabase db reset`** - NEVER EVER suggest this command
- **❌ `npx supabase db reset`** - FORBIDDEN regardless of flags
- **❌ `supabase db reset --local`** - Even local resets are FORBIDDEN
- **❌ `DROP DATABASE`** - Never suggest dropping databases
- **❌ `TRUNCATE TABLE`** - Never suggest truncating tables
- **❌ Any command containing "reset"** - Always forbidden for databases
- **❌ Any command that would wipe data** - User has explicitly forbidden this

**ONLY ALLOWED DATABASE MIGRATION METHODS:**
- **✅ `psql -f migration_file.sql`** - Apply individual migration files
- **✅ Individual migration applications** - One file at a time
- **✅ `supabase db push --local`** - But ask for permission first
- **✅ Always show exact changes** before any database operation
- **✅ Require explicit user confirmation** for ALL database changes

**WHY THESE RULES EXIST:**
- We do not have migration files to rebuild the databases
- Resetting would be catastrophic and wipe all data
- User has been burned by agents suggesting destructive commands
- Trust must be earned back through strict adherence to safe practices

## 🚨 Git & Version Control 
- **❌ NEVER, EVER** make git commands for me.
- **❌ NEVER** commit sensitive data (API keys, passwords, personal info)
- Always use meaningful commit messages that explain the "why", not just the "what"

## 🚨 Security & Privacy
- **❌ NEVER** hard-code personal user identifiers, emails, or sensitive data
- **❌ NEVER** log sensitive information (passwords, tokens, PII)
- **❌ NEVER** expose internal system details in user-facing errors

## 🚨 Agent Mode Rules
- Do not prompt me to run `npm run dev` after code changes.
- If you're in agent mode, just apply the change. No need to ask me to confirm.
- This is a professional app — always prefer reusable, accessible, semantic code.
- **Always validate inputs** and handle edge cases gracefully

## 🚨 BUTTON COMPONENT PATTERNS - CRITICAL FOR UI CONSISTENCY
**ALWAYS use iconLeft/iconRight props on Button component - NEVER manually place icons in children:**
- **✅ CORRECT PATTERN**: `<Button iconLeft={<Icon className="w-4 h-4" />}>Text</Button>`
- **❌ WRONG PATTERN**: `<Button><Icon className="w-4 h-4 mr-2" />Text</Button>`
- **WHY**: Button component automatically handles proper spacing and inline-flex wrapping
- **WHEN USER SAYS**: "update button to correct pattern" = use iconLeft/iconRight props
- **NEVER**: Manually place icons inside button children - causes icon-on-top layout issues
- **REFERENCE**: See "View Facility Listings" button on /advisors page for correct example

## 🚨 React useEffect & Performance Rules - CRITICAL FOR MOBILE
**INFINITE LOOP PREVENTION (especially critical for mobile Safari):**
- **❌ NEVER** put callback functions in useEffect dependencies unless wrapped in `useCallback` with stable deps
- **❌ NEVER** depend on objects like `user` - use primitives like `user?.id` 
- **❌ NEVER** include function references that recreate every render in useEffect deps
- **✅ ALWAYS** use primitive values only: `[user?.id]` instead of `[user, fetchFunction]`
- **✅ ALWAYS** add retry limits for network requests (max 3 attempts)
- **✅ ALWAYS** use `fetchingRef.current` patterns to prevent concurrent requests
- **✅ ALWAYS** test thoroughly on mobile Safari - it's most sensitive to these issues
- **WHY CRITICAL**: Mobile browsers (especially Safari WebKit) have more frequent auth state changes during hydration, making infinite loops worse

**ROOT CAUSE EXAMPLE (NEVER DO THIS):**
```javascript
// ❌ BAD - Causes infinite loops on mobile
useEffect(() => {
  if (user && !fetchingRef.current) {
    fetchFacilities(); // This function recreates every render!
  }
}, [user, fetchFacilities]); // fetchFacilities dependency causes infinite loop
```

**CORRECT PATTERN:**
```javascript
// ✅ GOOD - Stable dependencies prevent infinite loops
useEffect(() => {
  if (user && !fetchingRef.current) {
    fetchFacilities();
  }
}, [user?.id]); // Only depend on stable primitive value
```

## 🚨 User Interface & Experience Rules
- **❌ ABSOLUTELY FORBIDDEN** use `window.alert()`, `window.confirm()`, `window.prompt()`, `alert()`, `confirm()`, or `prompt()` 
  - These cause hydration mismatches and break SSR
  - Replace with proper toast notifications, modals, or confirmation components
  - All instances have been removed from codebase - any new usage must be immediately replaced
- **❌ NEVER** use browser alert dialogs - they break the design and are poor UX
- **✅ ALWAYS** use proper toast notifications, modals, or UI components for user feedback
- **✅ ALWAYS** maintain design consistency with the application's UI patterns

## 🚨 Logging Requirements
- Always use `logger.log|info|error|debug|warn|error` as appropriate for console.logs
- Always add database logging to any actions a user can take and make sure to notify me that you are adding that.
- **Never log sensitive data** - sanitize logs of PII, tokens, passwords

- NEVER PUSH TO THE PRODUCTION DATABASE WITHOUT A 🚨 WARNING I WANT TO PUSH TO PRODUCTION 🚨 MESSAGE BEFORE REQUESTING MY PERMISSION