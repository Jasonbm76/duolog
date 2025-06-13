# 🔌 API Route Patterns

📋 **API Best Practices**: Reference `/CLAUDE.md` for DRY principles, error handling patterns, and database optimization learned from CodeRabbit feedback.

## 📁 Next.js App Router API Structure
- Use `route.ts` files in `/app/api/` directory
- Export named functions: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`
- Use TypeScript for all API routes with proper typing

## 🚀 Next.js 15 Compatibility (CRITICAL)
**✅ ALWAYS** use Next.js 15 compatible parameter handling in dynamic routes:

```ts
// ✅ CORRECT (Next.js 15+)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;  // MUST await params
  // ... rest of function
}

// ❌ INCORRECT (Next.js 14 style - will break)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;  // This will cause runtime errors
}
```

**✅ ALWAYS** await the `params` Promise before accessing properties
**❌ NEVER** access `params.property` directly without awaiting
**✅ ALWAYS** destructure awaited params for cleaner code: `const { id } = await params;`

## 🛡️ Request/Response Patterns
- **Always validate inputs** using Zod schemas at the API boundary
- **Sanitize outputs** to prevent data leaks
- Use consistent response formats:
  ```ts
  // Success
  { success: true, data: T }
  
  // Error  
  { success: false, error: string, code?: string }
  ```

## 🔐 Authentication & Authorization
- Check authentication status first in protected routes
- Use middleware for route-level protection when possible
- Verify user permissions before data access
- Use Supabase RLS (Row Level Security) as primary security layer

## 📊 Error Handling
- Use appropriate HTTP status codes (200, 201, 400, 401, 403, 404, 500)
- **✅ ALWAYS** differentiate between database errors (500) and missing data (404)
- **✅ ALWAYS** capture analytics errors without failing main requests
- Log errors with context but sanitize user-facing messages
- Handle rate limiting and abuse prevention
- Implement proper CORS headers for external API access

## 🔄 DRY Principles & Code Reuse
- **✅ ALWAYS** create reusable utility functions for common patterns
- **❌ NEVER** duplicate Supabase client creation code across routes
- **✅ ALWAYS** extract authentication logic into shared functions
- Example: `createAuthenticatedSupabaseClient()` for consistent auth handling

## 🌍 Environment Variables
- **✅ ALWAYS** validate environment variables at module load
- **❌ NEVER** use non-null assertions (`!`) without validation
- **✅ ALWAYS** provide clear error messages for missing environment variables
- Validate before any client/service creation

## 🚀 Performance
- Use database connections efficiently (close connections)
- Implement caching where appropriate
- Use pagination for large datasets
- Consider using streaming for large responses

## 📝 Documentation
- Add JSDoc comments for complex API routes
- Document expected request/response schemas
- Include examples for integration testing