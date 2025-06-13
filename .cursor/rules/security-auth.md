# 🔒 Security & Authentication

📋 **Security Guidelines**: Reference `/CLAUDE.md` for comprehensive security patterns and environment variable validation learned from CodeRabbit feedback.

## 🛡️ Authentication Patterns
- Never hard-code emails, UIDs, or roles (e.g., no `jasonbm76@gmail.com`).
- Always use Supabase roles, metadata, or JWT claims for permissions.
- Use dynamic RBAC patterns; do not hardcode logic.

## 🍪 Cookie Handling
- Do not call `cookies().get(...)` directly.
- Instead, pass cookies to `createServerComponentClient()` or `createRouteHandlerClient()`.

## 🔐 Security Best Practices
- Always validate user input.
- Never expose or log secrets and keys.
- Never commit secrets or keys to the repository.
- Follow principle of least privilege for user permissions.

## 🌍 Environment Variables
- **✅ ALWAYS** validate environment variables at module load time
- **❌ NEVER** use non-null assertions (`!`) for env vars - validate explicitly
- **✅ ALWAYS** provide clear error messages for missing environment variables
- **✅ ALWAYS** handle env var validation before creating clients or connections

## 🔒 Row Level Security (RLS)
- **✅ ALWAYS** trust RLS policies for access control - don't add manual `.eq('user_id')` filters
- **❌ NEVER** create overly permissive policies (`WITH CHECK (true)` for INSERT/UPDATE)
- **✅ ALWAYS** restrict data modification to service role when appropriate
- **✅ ALWAYS** allow public read access for features like suggestions when safe

## 🚫 Input Validation
- **✅ ALWAYS** validate required fields (e.g., `name` cannot be empty)
- **✅ ALWAYS** handle empty strings by storing `null` for optional fields
- **✅ ALWAYS** sanitize user input before database operations
- **❌ NEVER** trust client-side data without server-side validation