# Claude Code Guidelines for Next.js/Supabase Projects

## 🚨 CRITICAL: Semantic Styling & UI Standards

### ✅ **ALWAYS Use Semantic Color Classes**
Modern applications should use semantic color systems. **NEVER use hardcoded Tailwind color classes.**

```typescript
// ❌ ABSOLUTELY FORBIDDEN - Hardcoded colors
<span className="text-red-500">Error message</span>
<span className="text-blue-500">Info message</span>
<span className="text-green-500">Success message</span>
<span className="text-yellow-500">Warning message</span>

// ✅ REQUIRED - Semantic color system
<span className="text-error">Error message</span>
<span className="text-info">Info message</span>
<span className="text-success">Success message</span>
<span className="text-warning">Warning message</span>
<span className="text-primary">Primary brand</span>
<span className="text-secondary">Secondary brand</span>
<span className="text-on-dark">Muted text</span>
```

#### **Complete Semantic Color Reference:**
- `text-error` / `bg-error` / `border-error` - Error states
- `text-success` / `bg-success` / `border-success` - Success states  
- `text-warning` / `bg-warning` / `border-warning` - Warning states
- `text-info` / `bg-info` / `border-info` - Info states
- `text-primary` / `bg-primary` / `border-primary` - Primary brand colors
- `text-secondary` / `bg-secondary` / `border-secondary` - Secondary brand colors
- `text-on-dark` - Muted/secondary text

### ✅ **Button Component Standards**

**CRITICAL: When using custom Button components, follow established patterns for icons**

```typescript
// ❌ AVOID - Manual icon placement (if your Button supports icon props)
<Button className="flex items-center gap-2">
  <Icon className="w-4 h-4 mr-2" />
  Button Text
</Button>

// ✅ PREFERRED - Use iconLeft/iconRight props (if available)
<Button iconLeft={<Icon className="w-4 h-4" />}>
  Button Text
</Button>

// ✅ ACCEPTABLE - Standard Tailwind approach
<Button className="flex items-center gap-2">
  <Icon className="w-4 h-4" />
  Button Text
</Button>
```

#### **Button Icon Rules:**
- **CHECK** if your Button component supports `iconLeft`/`iconRight` props
- **USE** consistent spacing between icons and text
- **MAINTAIN** standard icon sizing (`w-4 h-4` or `w-5 h-5`)
- **ENSURE** accessibility with proper aria-labels

### ✅ **Page Layout Standards**

**CRITICAL: Maintain consistent page layouts with proper containment**

```typescript
// ❌ INCONSISTENT - Raw page content
export default function SomePage() {
  return (
    <div className="container mx-auto p-6">
      <h1>Page Title</h1>
      <div>Page content...</div>
    </div>
  );
}

// ✅ CONSISTENT - Proper containment pattern
export default function SomePage() {
  return (
    <div className="container mx-auto max-w-4xl">
      <Card className="bg-background shadow-sm">
        <CardHeader>
          <h1 className="text-2xl font-bold">Page Title</h1>
        </CardHeader>
        <CardContent>
          <div>Page content...</div>
        </CardContent>
      </Card>
    </div>
  );
}
```

#### **Layout Rules:**
- **USE** consistent container patterns across pages
- **APPLY** proper card containment for content sections
- **MAINTAIN** consistent spacing and visual hierarchy
- **ENSURE** responsive design with proper max-widths
- **ENSURE** that you always apply semantic color classes for all elements, using our tailwind system, that contrast well with the background color.
- **ENSURE** Only use glass cards on the frontend / public pages and make sure to use the following appropriate colors - text-on-dark for primary text (headings, important content), text-on-dark-muted for secondary text (descriptions, captions)
- **ENSURE** For the admin section use white cards with appropriate text and bg classes. Don't be afraid to use colors other than black or gray for text where appropriate.

## 🚨 CRITICAL: Hydration Safety & React Patterns

### ✅ **Hydration-Safe Component Patterns**

**CRITICAL: Follow these patterns to prevent hydration mismatches and broken interactivity**

```typescript
// ❌ FORBIDDEN - Causes hydration mismatches
function MyComponent() {
  const [date] = useState(new Date().toISOString()); // Different server/client
  const [isClient] = useState(typeof window !== 'undefined'); // Server/client mismatch
  
  return <div>{date}</div>;
}

// ✅ REQUIRED - Hydration-safe patterns
function MyComponent() {
  const [date, setDate] = useState(''); // Start with empty/static value
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setDate(new Date().toISOString()); // Set dynamic value after hydration
    setIsClient(true);
  }, []);
  
  // Always check window existence
  if (typeof window !== 'undefined' && isClient) {
    // Client-only logic here
  }
  
  return <div>{date || 'Loading...'}</div>;
}
```

#### **Hydration Safety Rules:**
- **NEVER** use dynamic dates/times in `useState` initial values
- **NEVER** use `window`/`document` without checking availability
- **ALWAYS** start with static/empty initial state
- **USE** `useEffect` for dynamic behavior after hydration
- **NEVER** use `window.alert()`, `window.confirm()`, `window.prompt()`

### ✅ **ABSOLUTELY FORBIDDEN: Window Methods**

**These cause hydration mismatches and terrible UX - NEVER USE:**

```typescript
// ❌ ABSOLUTELY FORBIDDEN - Breaks SSR and UX
window.alert('Message');
window.confirm('Are you sure?');
window.prompt('Enter value:');
alert('Message');
confirm('Are you sure?');
prompt('Enter value:');

// ✅ REQUIRED - Use proper UI components
import { toast } from 'sonner'; // or your toast library

function MyComponent() {
  const handleError = () => {
    toast.error('An error occurred');
  };
  
  const handleConfirmation = () => {
    setShowConfirmModal(true);
  };
}
```

## 🚨 CRITICAL: Next.js 15 Compatibility

### ✅ **API Route Parameter Handling**

**CRITICAL: Next.js 15 changed how route parameters work - they are now Promises**

```typescript
// ❌ FORBIDDEN - Old Next.js 14 pattern
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const itemId = params.id; // BREAKS in Next.js 15
  // ...
}

// ✅ REQUIRED - Next.js 15 compatible pattern
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: itemId } = await params; // MUST await params first
  // ...
}
```

#### **Next.js 15 Parameter Rules:**
- **ALWAYS** declare params as `Promise<{ id: string }>`
- **ALWAYS** await params before accessing properties  
- **NEVER** access `params.id` directly without awaiting
- **APPLIES TO** all dynamic route API handlers

## 🚨 CRITICAL: Database Safety Rules

### ✅ **ABSOLUTELY FORBIDDEN Database Commands**

**These commands are CATASTROPHIC and will destroy data - NEVER USE:**

```bash
# ❌ ABSOLUTELY FORBIDDEN - Will destroy everything
supabase db reset
npx supabase db reset  
supabase db reset --local
DROP DATABASE
TRUNCATE TABLE
-- Any reset commands

# ✅ ONLY ALLOWED - Safe incremental changes
psql -f migration_file.sql
supabase db push --local  # Only with explicit permission
```

#### **Database Safety Rules:**
- **NEVER** run any reset commands on any database (local or production)
- **ALWAYS** use individual migration files with `psql -f`
- **NEVER** suggest CASCADE operations without explicit approval
- **NEVER** modify production without explicit permission
- **ALWAYS** use `--local` flag for local database operations
- **PRESERVE** all existing data - migrations cannot rebuild databases

### ✅ **Environment Context Awareness**

```bash
# ❌ WRONG - Using production queries for local issues
SELECT * FROM production_table; # When working locally

# ✅ CORRECT - Use appropriate environment
# For local development:
psql -h localhost -p 54322 -U postgres -d postgres
# For production (only when explicitly requested):
# Use production database connection strings
```

#### **Environment Rules:**
- **ALWAYS** use local database commands when working locally
- **NEVER** switch to production queries without explicit request
- **FOLLOW** established guidelines consistently across sessions
- **MAINTAIN** proper environment separation

## 🚨 CRITICAL: Mobile & Browser Compatibility

### ✅ **useEffect Dependencies - Mobile Safari Critical**

**CRITICAL: Mobile browsers (especially Safari) are sensitive to useEffect infinite loops**

```typescript
// ❌ CAUSES INFINITE LOOPS on mobile
function MyComponent({ user }) {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    fetchData(user); // Function recreates every render when user object changes
  }, [user, fetchData]); // WRONG - function dependency without useCallback
  
  const fetchData = (userObj) => { /* ... */ };
}

// ✅ MOBILE-SAFE PATTERN
function MyComponent({ user }) {
  const [data, setData] = useState(null);
  const fetchingRef = useRef(false);
  const retryCountRef = useRef(0);
  
  const fetchData = useCallback(async (userId: string) => {
    if (fetchingRef.current || retryCountRef.current >= 3) return;
    
    fetchingRef.current = true;
    try {
      // Fetch logic
      retryCountRef.current = 0;
    } catch (error) {
      retryCountRef.current++;
      console.error('Fetch error:', error);
    } finally {
      fetchingRef.current = false;
    }
  }, []); // No dependencies on user object
  
  useEffect(() => {
    if (user?.id) {
      fetchData(user.id); // Only depend on primitive values
    }
  }, [user?.id, fetchData]); // Safe - primitive dependency
}
```

#### **Mobile Safety Rules:**
- **NEVER** depend on callback functions in useEffect without useCallback
- **ONLY** depend on primitive values like `user?.id`, not `user` objects
- **ALWAYS** add retry limits (max 3) for network requests
- **USE** `fetchingRef.current` patterns to prevent concurrent requests
- **TEST** thoroughly on mobile Safari - it's most sensitive to these issues

### ✅ **Mobile Debugging - No Console Access**

```typescript
// ❌ USELESS - Mobile has no accessible console
console.log('Debug info');
console.error('Error details');

// ✅ MOBILE-FRIENDLY - Visible debugging
import { toast } from 'sonner';

function MyComponent() {
  const handleError = (error: Error) => {
    // User-visible error
    toast.error(`Debug: ${error.message}`);
    
    // Remote logging for critical errors (if available)
    if (typeof window !== 'undefined') {
      console.error('Mobile error:', { error: error.message, stack: error.stack });
    }
  };
}
```

#### **Mobile Debugging Rules:**
- **NEVER** rely on console.log for mobile debugging
- **USE** toast notifications for critical errors
- **USE** visual loading states instead of console logs
- **USE** error boundaries with user-friendly messages
- **CONSIDER** remote logging services for production debugging

## 🚨 CRITICAL: Development Workflow

### ✅ **Build Testing - Prevent Disruption**

**CRITICAL: Never run builds until user confirms task completion**

```bash
# ❌ FORBIDDEN - Disrupts user workflow
npm run build  # Kills dev server, forces page refresh

# ✅ REQUIRED - Wait for user confirmation
# 1. Complete all changes
# 2. User verifies in dev environment  
# 3. User explicitly says "ready for build"
# 4. THEN run: npm run build
```

#### **Build Safety Rules:**
- **NEVER** run `npm run build` until user confirms task completion
- **LET USER** verify fixes in dev environment first
- **WAIT** for explicit "ready for build" confirmation
- **DON'T DISRUPT** user's active development workflow

### ✅ **Agent Mode Guidelines**

**When user is in agent mode (rapid development):**

```typescript
// ✅ AGENT MODE - Don't prompt, just implement
// - Apply changes immediately without asking confirmation
// - Don't suggest "npm run dev" 
// - Focus on reusable, accessible, semantic code
// - Always validate inputs and handle edge cases
// - Use proper logging patterns
```

#### **Agent Mode Rules:**
- **DON'T** prompt user to run `npm run dev`
- **DON'T** ask for confirmation on code changes
- **DO** apply changes immediately
- **DO** focus on professional, reusable code
- **DO** validate inputs and handle edge cases
- **DO** use proper error handling and logging

## 🚨 CRITICAL: Security & Privacy

### ✅ **Logging Safety - Never Log Sensitive Data**

```typescript
// ❌ FORBIDDEN - Logs sensitive information
console.log('User login:', { user: userObject }); // Contains PII
console.error('Auth error:', { token: authToken }); // Contains secrets
console.log('Database query:', { password: user.password }); // Contains credentials

// ✅ REQUIRED - Sanitized logging
console.log('User login:', { userId: user.id, email: user.email?.split('@')[0] + '@***' });
console.error('Auth error:', { userId: user.id, errorCode: error.code });
console.log('Database query:', { table: 'users', operation: 'UPDATE', userId: user.id });
```

#### **Logging Security Rules:**
- **NEVER** log full user objects (contain PII)
- **NEVER** log tokens, passwords, API keys
- **NEVER** log email addresses in full
- **ALWAYS** sanitize logs of sensitive data
- **ALWAYS** use meaningful context without exposing internals

### ✅ **Git & Commit Safety**

```bash
# ❌ FORBIDDEN - Claude never makes git commands
git add .
git commit -m "Update"
git push origin main

# ✅ REQUIRED - User handles all git operations
# Claude suggests commit messages but never executes
# "Suggested commit: feat: add semantic color system to button components"
```

#### **Git Safety Rules:**
- **NEVER** make git commands for user
- **NEVER** commit sensitive data (API keys, passwords, PII) 
- **NEVER** hard-code personal identifiers or emails
- **ALWAYS** suggest meaningful commit messages explaining why, not just what
- **USER** handles all version control operations

## Coding Conventions

### File and Directory Naming

**CRITICAL: All naming conventions listed below must be strictly followed:**

#### Component Directories
- **MUST use PascalCase**: `components/Header/`, `components/Auth/`, `components/UI/`
- **Examples**: ✅ `Features/`, `UserProfile/`, `ThemeToggle/`
- **Avoid**: ❌ `features/`, `user-profile/`, `theme-toggle/`

#### Component Files
- **MUST use PascalCase**: `Header.tsx`, `Button.tsx`, `UserProfileModal.tsx`
- **Examples**: ✅ `SaveButton.tsx`, `DeleteConfirmationModal.tsx`
- **Avoid**: ❌ `button.tsx`, `user-profile-modal.tsx`, `save_button.tsx`

#### Type Definition Files
- **MUST use camelCase**: `user.ts`, `apiTypes.ts`, `index.ts`
- **Examples**: ✅ `userRoles.ts`, `dataTypes.ts`
- **Avoid**: ❌ `user-roles.ts`, `data_types.ts`, `UserRoles.ts`

#### Utility and Library Files
- **MUST use camelCase**: `utils.ts`, `supabase.ts`, `dateUtils.ts`
- **Examples**: ✅ `buttonUtils.ts`, `apiHelpers.ts`
- **Avoid**: ❌ `button-utils.ts`, `api_helpers.ts`

### Directory Structure Guidelines

#### Component Organization
```text
components/
├── UI/                    # Reusable UI components
│   ├── Modals/           # All modal components
│   ├── Button.tsx        # Basic UI elements
│   └── Card.tsx
├── Auth/                 # Authentication components
├── Features/             # Feature-specific components
└── Layout/              # Layout components
```

#### Import Conventions
```typescript
// ✅ Correct imports
import { Button } from '@/components/UI/Button';
import { UserModal } from '@/components/UI/Modals/UserModal';
import { userTypes } from '@/types/userTypes';

// ❌ Incorrect imports
import { Button } from '@/components/ui/button';
import { UserModal } from '@/components/features/UserModal';
```

### Code Quality Standards

#### TypeScript Usage
- **ALWAYS use TypeScript** for all files
- **NEVER use `any` type** without explicit reasoning
- **ALWAYS define proper interfaces** for props and data structures
- **USE** strict TypeScript configuration

#### Component Standards
- **PREFER function components** over class components
- **USE proper prop interfaces** for all components
- **FOLLOW React hooks rules** consistently
- **IMPLEMENT proper error boundaries** for critical components

#### Performance Best Practices
- **USE** `useCallback` and `useMemo` appropriately
- **AVOID** unnecessary re-renders with proper dependency arrays
- **IMPLEMENT** proper loading states and error handling
- **OPTIMIZE** bundle size with proper imports

## Environment Variables & Configuration

### ✅ **ALWAYS Validate Environment Variables**
```typescript
// ❌ DON'T DO THIS - Risk runtime errors
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ✅ DO THIS - Validate at module load
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing required Supabase environment variables');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

#### **Key Rules:**
- **NEVER use non-null assertions** (`!`) with `process.env` variables
- **ALWAYS validate at the top** of modules that use environment variables
- **PROVIDE clear error messages** indicating which variables are missing
- **USE validated constants** instead of direct `process.env` access

## Database & API Best Practices

### ✅ **Row Level Security (RLS) Trust**
```sql
-- ❌ DON'T DO THIS - Manual filtering with RLS
SELECT * FROM user_data 
WHERE id = $1 AND user_id = $2; -- Redundant with RLS

-- ✅ DO THIS - Let RLS handle access control
SELECT * FROM user_data WHERE id = $1;
```

### ✅ **Proper API Error Handling**
```typescript
// ❌ DON'T DO THIS - Generic error handling
if (error || !data) {
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}

// ✅ DO THIS - Specific error handling
if (error) {
  console.error('Database error:', error);
  return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
}
if (!data) {
  return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
}
```

### ✅ **Input Validation**
```typescript
// ✅ Comprehensive input validation
const updateData: Partial<UpdateInput> = {};
if (body.name !== undefined) {
  const trimmedName = body.name.trim();
  if (trimmedName.length === 0) {
    return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 });
  }
  updateData.name = trimmedName;
}
```

## Enforcement & Review Process

### Before Committing
1. **RUN** `npm run build` - Must pass
2. **RUN** `npm run lint` - Must pass  
3. **RUN** `npx tsc --noEmit` - Must pass
4. **TEST** all affected functionality
5. **VERIFY** no console errors or warnings

### Code Review Checklist
- [ ] Environment variables properly validated
- [ ] No duplicated code patterns
- [ ] Database queries follow security best practices
- [ ] Input validation handles edge cases
- [ ] Error handling is specific and helpful
- [ ] Types are properly defined
- [ ] Performance considerations addressed
- [ ] Toast notifications used instead of alerts
- [ ] Mobile compatibility verified

### Database Change Process
1. **CREATE** migration files with clear naming
2. **DOCUMENT** changes appropriately
3. **TEST** locally first
4. **COORDINATE** with application code changes
5. **APPLY** to production only after local verification

**REMEMBER: These practices ensure maintainable, secure, and performant Next.js applications with Supabase integration.**