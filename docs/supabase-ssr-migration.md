# Supabase SSR Migration Guide

## Overview

This guide documents the migration from the legacy Supabase client pattern to the new SSR-optimized pattern for Next.js 15.

## New Client Structure

### 1. Browser Client (`utils/supabase/client.ts`)
Use this for:
- Client Components (`"use client"`)
- Browser-side operations
- Real-time subscriptions

```typescript
import { createClient } from '@/utils/supabase/client'

const supabase = createClient()
```

### 2. Server Client (`utils/supabase/server.ts`)
Use this for:
- Server Components
- Route Handlers (API routes)
- Server Actions

```typescript
import { createClient } from '@/utils/supabase/server'

const supabase = await createClient()
```

### 3. Service Role Client
For admin operations requiring elevated privileges:

```typescript
import { createServiceRoleClient } from '@/utils/supabase/server'

const supabase = await createServiceRoleClient()
```

## Migration Steps

### 1. Update Imports

#### Old Pattern
```typescript
import { supabase } from '@/lib/supabase'
```

#### New Pattern - Client Components
```typescript
import { createClient } from '@/utils/supabase/client'

export default function ClientComponent() {
  const supabase = createClient()
  // Use supabase client
}
```

#### New Pattern - Server Components
```typescript
import { createClient } from '@/utils/supabase/server'

export default async function ServerComponent() {
  const supabase = await createClient()
  // Use supabase client
}
```

### 2. Update API Routes

#### Old Pattern
```typescript
// app/api/example/route.ts
import { supabase } from '@/lib/supabase'

export async function GET() {
  const { data } = await supabase.from('table').select()
  // ...
}
```

#### New Pattern
```typescript
// app/api/example/route.ts
import { createClient } from '@/utils/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data } = await supabase.from('table').select()
  // ...
}
```

### 3. Update Real-time Subscriptions

Real-time subscriptions should only be used in Client Components:

```typescript
"use client"

import { useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'

export default function RealtimeComponent() {
  const supabase = createClient()
  
  useEffect(() => {
    const channel = supabase
      .channel('realtime-channel')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'table_name' 
      }, (payload) => {
        console.log('Change received!', payload)
      })
      .subscribe()
      
    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])
  
  return <div>...</div>
}
```

### 4. Authentication Patterns

#### Client-side Auth
```typescript
"use client"

import { createClient } from '@/utils/supabase/client'

export function LoginForm() {
  const supabase = createClient()
  
  const handleLogin = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    // Handle response
  }
}
```

#### Server-side Auth Check
```typescript
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function ProtectedPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }
  
  return <div>Protected content</div>
}
```

## Benefits

1. **Better Performance**: Server Components can fetch data during SSR
2. **Improved Security**: Service role keys never exposed to client
3. **Type Safety**: Full TypeScript support with Database types
4. **Session Management**: Automatic session refresh via middleware
5. **Cookie Handling**: Proper cookie management for auth

## Common Pitfalls

1. **Don't use server client in Client Components**
   - Will throw an error about cookies() being unavailable

2. **Don't use createClient() at module level**
   - Always create inside components/functions

3. **Remember to await server clients**
   - Server client creation is async

4. **Update middleware.ts**
   - Must include updateSession for auth to work properly