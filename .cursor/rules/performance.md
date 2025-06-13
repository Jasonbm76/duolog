# ⚡️ Performance & Optimization

📋 **Best Practices**: See `/CLAUDE.md` for comprehensive performance patterns learned from CodeRabbit feedback.

## 🚀 React Performance
- Minimize `use client`, `useEffect`, and `setState`.
- Favor Server Components and SSR.
- Only use client components when absolutely necessary (e.g., for Web APIs).
- Wrap client components in `<Suspense>` with a fallback.
- Use dynamic imports for non-critical UI.

## 🖼️ Image Optimization
- Optimize images: use WebP, include width/height, lazy load.
- Prefer `next/image` over `<img>` tags for automatic optimization.

## 📊 Web Vitals
- Optimize for Core Web Vitals: LCP, CLS, FID.
- Monitor and improve page load performance.
- Use proper loading strategies for above-the-fold content.

## 🔍 Query Optimization
- **❌ NEVER** create N+1 query patterns - use database views or single queries with joins
- **✅ ALWAYS** use `saved_lists_with_details` view for list queries to avoid multiple API calls
- **✅ ALWAYS** throttle scroll/resize events with `requestAnimationFrame`
- **❌ NEVER** make multiple Promise.all calls per item - consolidate data fetching

## 🗄️ Database Performance  
- **✅ ALWAYS** use set-based operations instead of row-by-row loops in triggers
- **✅ ALWAYS** prefer database constraints over application-level validation for data integrity
- **✅ ALWAYS** use proper indexing on frequently queried columns
- **❌ NEVER** use manual RLS filters when RLS policies handle access control