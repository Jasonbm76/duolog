# 🎨 UI & Styling Guidelines

📋 **UX Patterns**: See `/CLAUDE.md` for user experience improvements and toast notification patterns from CodeRabbit feedback.

## 🎯 Design System
- Use **Tailwind CSS** + **Shadcn UI** + **Radix UI**.
- Use a mobile-first responsive layout approach.
- Prioritize accessibility in all components.

## 🖼️ Placeholder Images
- **✅ ALWAYS** provide placeholder images for empty states to improve UX
- For external placeholders use: `https://placehold.co/600x400?text=Hello+World&font=roboto`
- **✅ PREFERRED**: Use base64 SVG placeholders for better performance and self-contained components
- Example base64 SVG: `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjI1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzllYTNhOCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlIEF2YWlsYWJsZTwvdGV4dD48L3N2Zz4="`

## ♿ Accessibility
- Always use semantic HTML elements.
- Ensure proper ARIA labels and roles.
- Maintain sufficient color contrast.
- Support keyboard navigation.
- Test with screen readers when possible.

## 📱 Responsive Design
- Mobile-first approach (start with mobile styles).
- Use Tailwind breakpoints: `sm:`, `md:`, `lg:`, `xl:`, `2xl:`.
- Ensure touch targets are at least 44px on mobile.
- Test on multiple device sizes.

## 🔔 User Feedback & Notifications
- **❌ NEVER** use blocking `alert()` dialogs - they interrupt user flow
- **✅ ALWAYS** use toast notifications for user feedback instead
- **✅ ALWAYS** provide success/error feedback for user actions
- **✅ ALWAYS** close modals after successful operations to improve UX flow
- Use `addToast()` function with appropriate type: 'success', 'error', 'info', 'warning'

## 🎛️ Feature Flags & Conditional UI
- **✅ ALWAYS** use feature flags from `config/features.ts` instead of hardcoded `true/false`
- **❌ NEVER** hardcode feature visibility - make it configurable
- Example: `{featureFlags.faq && <FaqLink />}` instead of `{true && <FaqLink />}`