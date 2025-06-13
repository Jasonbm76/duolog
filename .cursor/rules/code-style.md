# 📐 Code Style & Structure

## General Patterns
- Use TypeScript for all code.
- Write functional, declarative code. Avoid classes.
- Prefer modular, reusable logic over duplication.
- Use named exports.
- Follow React functional component patterns with typed props (interfaces > types).
- Structure files: main export, subcomponents, helpers, constants, types (in that order).

## 📁 Project Structure & Organization
- Configuration files belong in `/config/` directory (not `/lib/`)
- Import configuration using `@/config/` path alias
- Config files: `features.ts`, `metadata.ts`, `plans.ts`, `session.ts`
- Keep `/lib/` for utilities, database helpers, and shared logic
- Follow established import patterns when adding new config

## Naming Conventions
- Use kebab-case for folders (e.g. `components/auth-wizard`).
- Use camelCase for variables; include auxiliary verbs (`isLoading`, `hasError`).
- Avoid enums — use objects/maps.

## 💅 Syntax & Formatting
- Use the function keyword for pure functions.
- Omit curly braces for single-line conditionals.
- Use declarative JSX; keep it readable.
- Always use semantic, accessible HTML and CSS.

## ⚙️ TypeScript Rules
- Prefer `interface` over `type` for object shapes.
- Never use `enum`; use object maps instead with `as const`.
- Keep all logic strongly typed; no `any` or `unknown` without proper type guards.
- Use utility types: `Partial<T>`, `Pick<T, K>`, `Omit<T, K>`, `Record<K, V>`
- Implement proper type guards for runtime type checking
- Use branded types for IDs and sensitive data: `type UserId = string & { __brand: 'UserId' }`
- Prefer union types over inheritance for data modeling
- Use `satisfies` operator for better type inference when appropriate

## 🧠 Data & Logic
- Use React Query (`useQuery`) for fetching; keep data logic modular.
- Use React Hook Form + Zod for forms and validation.
- Avoid unnecessary state.
- Always validate user input.

## 🚨 Error Handling Patterns
- Use try-catch blocks for async operations
- Return meaningful error messages to users (sanitized of sensitive info)
- Log errors with context using the logger utility
- Use React Error Boundaries for component-level error handling
- Implement graceful degradation for non-critical features
- Use Zod for runtime type validation at API boundaries

## 🔄 State Management
- Prefer server state (React Query) over client state
- Use React's built-in hooks (`useState`, `useReducer`) for local state
- Lift state up only when necessary for component communication
- Consider using `useCallback` and `useMemo` only when needed for performance