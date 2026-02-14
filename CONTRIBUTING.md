# Contributing to AI Isometric Icon Generator

Thank you for your interest in contributing to this project! We welcome contributions from the community.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Commit Messages](#commit-messages)

## Code of Conduct

This project adheres to a [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## Getting Started

### Prerequisites

- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 9.0.0 or higher
- **Git**: For version control

### Development Setup

1. **Fork the repository** on GitHub

2. **Clone your fork locally**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/isometricon.git
   cd isometricon
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Set up environment variables**:
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` and add your API keys (see README.md for details).

5. **Run the development server**:
   ```bash
   npm run dev
   ```

6. **Verify everything works**:
   ```bash
   npm run test
   npm run lint
   ```

## Development Workflow

### Branch Naming Convention

Always create a new branch for your changes:

- `feature/description` - New features
- `bugfix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring
- `test/description` - Test additions or improvements

Example:
```bash
git checkout -b feature/add-dark-mode
git checkout -b bugfix/fix-rate-limiter
git checkout -b docs/update-api-docs
```

### Making Changes

1. **Create a branch** from `main`:
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following our coding standards

3. **Test your changes**:
   - Run all tests: `npm run test`
   - Run linting: `npm run lint`
   - Test manually: `npm run dev`

4. **Commit your changes** (see [Commit Messages](#commit-messages))

5. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Open a Pull Request** on GitHub

## Pull Request Process

1. **Ensure your PR includes**:
   - Clear description of what changed and why
   - Any related issue numbers (e.g., "Fixes #123")
   - Screenshots/gifs for UI changes
   - Updated tests if applicable
   - Updated documentation if needed

2. **PR Requirements**:
   - All tests must pass
   - No linting errors
   - Code review approval from at least one maintainer
   - Branch must be up to date with `main`

3. **Review Process**:
   - Maintainers will review within 3-5 business days
   - Address any requested changes
   - Once approved, a maintainer will merge your PR

4. **After Merge**:
   - Your contribution will be part of the next release
   - You'll be credited in the release notes

## Coding Standards

### TypeScript

- Enable strict mode (already configured)
- Use explicit types for function parameters and return values
- Avoid `any` type - use `unknown` if necessary
- Prefer interfaces over type aliases for object shapes

Example:
```typescript
// Good
interface User {
  id: string;
  name: string;
}

function getUser(id: string): User | null {
  // implementation
}

// Avoid
function getUser(id: any): any {
  // implementation
}
```

### React Components

- Use functional components with hooks
- Keep components focused and small
- Use proper TypeScript types for props
- Follow existing naming conventions

Example:
```typescript
interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}

export function Button({ onClick, children, disabled }: ButtonProps) {
  return (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}
```

### Styling (Tailwind CSS)

- Use Tailwind utility classes
- Follow mobile-first responsive design
- Maintain consistent spacing using the design system
- Use semantic color names from the theme

Example:
```tsx
// Good
<div className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover">

// Avoid
<div style={{ padding: '8px 16px', backgroundColor: '#6366f1' }}>
```

### File Organization

```
app/                 # Next.js pages
components/          # React components
hooks/               # Custom React hooks
lib/                 # Utility functions
  providers/         # AI provider implementations
types/               # TypeScript type definitions
__tests__/           # Test files
  properties/        # Property-based tests
  integration/       # Integration tests
```

## Testing

### Running Tests

```bash
# Run all tests once
npm run test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test -- --coverage
```

### Writing Tests

We use **Vitest** for testing and **fast-check** for property-based testing.

**Unit Tests**:
```typescript
import { describe, it, expect } from 'vitest';
import { myFunction } from './my-module';

describe('myFunction', () => {
  it('should return expected result', () => {
    expect(myFunction('input')).toBe('expected');
  });
});
```

**Property-Based Tests**:
```typescript
import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import { myFunction } from './my-module';

describe('myFunction properties', () => {
  it('should handle all valid inputs', () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        const result = myFunction(input);
        expect(result).toBeDefined();
      })
    );
  });
});
```

### Test Coverage

- All new features must include tests
- Aim for >80% code coverage
- Test edge cases and error conditions
- Property-based tests for complex logic

## Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

### Format

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `test`: Test additions or updates
- `chore`: Build process, dependencies, etc.

### Examples

```
feat(generator): add monochrome style preset

fix(api): handle rate limit error gracefully

docs(readme): update API key instructions

refactor(providers): simplify error handling logic

test(rate-limiter): add property-based tests

chore(deps): update next.js to 15.1.0
```

### Guidelines

- Use present tense ("add feature" not "added feature")
- Use imperative mood ("move cursor to..." not "moves cursor to...")
- Don't capitalize first letter
- No period at the end
- Keep the first line under 72 characters

## Questions?

If you have questions or need help:

1. Check existing [GitHub Issues](https://github.com/ryansutrisno/isometricon/issues)
2. Open a new issue with the "question" label
3. Start a [GitHub Discussion](https://github.com/ryansutrisno/isometricon/discussions)

## Recognition

Contributors will be:
- Listed in the project README
- Mentioned in release notes
- Credited in the commit history

Thank you for contributing!
