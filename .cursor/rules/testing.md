# 🧪 Testing Guidelines

## 🎯 Testing Philosophy
- Write tests that provide confidence, not just coverage
- Focus on testing behavior, not implementation details
- Test the user journey and critical business logic
- Use Test-Driven Development (TDD) for complex features

## 🛠️ Testing Stack
- **Unit Tests**: Jest + React Testing Library
- **Integration Tests**: Test API routes and database interactions
- **E2E Tests**: Consider Playwright for critical user flows
- **Type Testing**: TypeScript compiler catches type errors

## 📝 Testing Patterns
- **Arrange, Act, Assert** pattern for test structure
- Use meaningful test descriptions that explain the expected behavior
- Mock external dependencies (APIs, databases) in unit tests
- Test error scenarios and edge cases
- Use factories or test builders for complex test data

## 🚨 What to Test
- **Critical user flows** (registration, payment, facility search)
- **Business logic** (calculations, validations, transformations)
- **Error handling** (network failures, validation errors)
- **Security boundaries** (authorization, input validation)
- **Accessibility** (keyboard navigation, screen reader support)

## 🚫 What NOT to Test
- Third-party library internals
- Implementation details (internal state, private methods)
- Trivial code (getters, setters, simple mappings)
- Generated code or configurations