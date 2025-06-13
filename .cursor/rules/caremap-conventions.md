# DuoLog Coding Conventions for Cursor

🚨 **CRITICAL: These conventions are MANDATORY and must be followed for every code change.**

## File and Directory Naming Rules

### Component Directories - MUST use PascalCase
```
✅ CORRECT:
components/Auth/
components/UI/
components/Facilities/
components/CustomerStories/

❌ WRONG - DO NOT CREATE:
components/auth/
components/ui/
components/facilities/
components/customer-stories/
```

### Component Files - MUST use PascalCase
```
✅ CORRECT:
Header.tsx
Button.tsx
AddFacilityModal.tsx
SaveToListButton.tsx

❌ WRONG - DO NOT CREATE:
header.tsx
button.tsx
add-facility-modal.tsx
save_to_list_button.tsx
```

### Type Definition Files - MUST use camelCase
```
✅ CORRECT:
facility.ts
savedLists.ts
userRoles.ts

❌ WRONG - DO NOT CREATE:
saved-lists.ts
user_roles.ts
FacilityTypes.ts
```

### Utility Files - MUST use camelCase
```
✅ CORRECT:
utils.ts
supabase.ts
mapUtils.ts
buttonClasses.ts

❌ WRONG - DO NOT CREATE:
button-classes.ts
map_utils.ts
```

## Directory Structure Rules

### Modal Components - MUST be in UI/Modals/
```
✅ CORRECT:
components/UI/Modals/AddFacilityModal.tsx
components/UI/Modals/DeleteConfirmationModal.tsx

❌ WRONG - DO NOT CREATE:
components/Facilities/AddFacilityModal.tsx
components/Listings/DeleteConfirmationModal.tsx
```

### Import Paths - MUST use correct casing
```
✅ CORRECT:
import { Button } from '@/components/UI/Button';
import { AddFacilityModal } from '@/components/UI/Modals/AddFacilityModal';
import { savedLists } from '@/types/savedLists';

❌ WRONG - DO NOT USE:
import { Button } from '@/components/ui/button';
import { AddFacilityModal } from '@/components/facilities/AddFacilityModal';
import { savedLists } from '@/types/saved-lists';
```

## Code Quality Rules

### TypeScript Requirements
- ALWAYS use TypeScript for all files
- NEVER use `any` type without explicit justification
- ALWAYS define proper interfaces for props
- ALWAYS remove unused imports

### Component Standards
- ONE component per file (unless tightly coupled)
- EXPORT components as default when appropriate
- USE named exports for utilities and types
- REMOVE unused imports and variables immediately

### File Organization
- NO duplicate components across directories
- CONSOLIDATE similar functionality
- USE proper error boundaries for critical components

## When Creating New Files

### 1. Choose Correct Naming Convention
- Components: PascalCase
- Types: camelCase
- Utils: camelCase

### 2. Place in Correct Directory
- UI components: `components/UI/`
- Modals: `components/UI/Modals/`
- Feature components: `components/[FeatureName]/`

### 3. Update Imports Immediately
- Use correct casing in import paths
- Remove any unused imports
- Test that build passes

## When Moving/Renaming Files

### 1. Always Use Git
```bash
git mv oldPath newPath
```

### 2. Update All Imports
- Search for all references
- Update import paths
- Remove any unused imports

### 3. Test Build
```bash
npm run build
```

## Enforcement

### Before Every Commit
- Build must pass: `npm run build`
- TypeScript check: `npx tsc --noEmit`
- Remove unused imports
- Follow naming conventions

### Zero Tolerance
- Any file not following these conventions will be refactored
- No exceptions for "quick fixes" or "temporary" code
- Consistency is more important than speed

---

🔥 **REMEMBER: These rules exist because inconsistent naming has caused significant technical debt. Following them is not optional.**