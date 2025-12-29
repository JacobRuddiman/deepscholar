# Contributing to DeepScholar

Thank you for your interest in contributing to DeepScholar! This guide will help you get started.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)
- [Documentation](#documentation)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+
- Git

### Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/your-username/deepscholar.git
   cd deepscholar/deepscholar
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Set Up Database**
   ```bash
   # Copy environment variables
   cp .env.example .env

   # Edit .env with your database credentials
   # Then run migrations
   npx prisma migrate dev
   ```

4. **Seed Database (Optional)**
   ```bash
   npm run db:seed
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

6. **Access Application**
   - Open http://localhost:3000
   - If using LOCAL_MODE=true, authentication is bypassed

## Project Structure

```
deepscholar/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── api/            # API routes
│   │   ├── components/     # Page-specific components
│   │   └── providers/      # Context providers
│   ├── components/          # Reusable components
│   │   ├── accessibility/  # Accessibility components
│   │   ├── dialogs/        # Modal dialogs
│   │   ├── empty-states/   # Empty state components
│   │   └── skeletons/      # Loading skeletons
│   ├── hooks/              # Custom React hooks
│   │   ├── mutations/      # React Query mutations
│   │   └── queries/        # React Query queries
│   ├── lib/                # Utility libraries
│   ├── server/             # Server-side code
│   │   └── actions/        # Server actions
│   ├── styles/             # Global styles
│   └── functions/          # Business logic
├── prisma/                  # Database schema and migrations
├── public/                  # Static assets
└── tests/                   # Test files

```

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Avoid `any` types - use proper typing
- Use interfaces for object shapes
- Export types for reusability

### React

- Use functional components with hooks
- Follow React hooks rules
- Use React Query for data fetching
- Implement proper error boundaries

### Styling

- Use Tailwind CSS utility classes
- Follow existing dark mode patterns
- Ensure responsive design (mobile-first)
- Maintain accessibility (ARIA labels, keyboard navigation)

### File Naming

- Components: `PascalCase.tsx`
- Hooks: `useCamelCase.ts`
- Utilities: `camelCase.ts`
- Server actions: `kebab-case.ts`

### Code Organization

- One component per file
- Group related functionality
- Keep files under 300 lines
- Extract reusable logic into hooks

## Commit Guidelines

We follow conventional commits:

```
type(scope): subject

body (optional)

footer (optional)
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Test additions or changes
- `chore`: Build process or tooling changes

### Examples

```bash
feat(briefs): add draft system UI
fix(auth): resolve session persistence issue
docs(api): update API documentation
refactor(hooks): simplify useKeyboardNavigation logic
```

## Pull Request Process

1. **Create a Branch**
   ```bash
   git checkout -b feat/your-feature-name
   ```

2. **Make Changes**
   - Write clean, documented code
   - Follow coding standards
   - Add tests if applicable

3. **Test Your Changes**
   ```bash
   npm run build        # Ensure build succeeds
   npm run type-check   # Check TypeScript types
   ```

4. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat(scope): description"
   ```

5. **Push and Create PR**
   ```bash
   git push origin feat/your-feature-name
   ```
   Then create a pull request on GitHub.

6. **PR Requirements**
   - Clear description of changes
   - Reference related issues
   - Screenshots for UI changes
   - Passing CI checks
   - Code review approval

## Testing

### Running Tests

```bash
# Unit tests
npm test

# E2E tests (when implemented)
npm run test:e2e

# Type checking
npm run type-check
```

### Writing Tests

- Write tests for new features
- Update tests for bug fixes
- Aim for meaningful test coverage
- Use descriptive test names

## Documentation

### Code Documentation

- Add JSDoc comments for functions
- Document complex logic
- Explain non-obvious decisions
- Keep comments up-to-date

### Documentation Files

- Update README for user-facing changes
- Update API docs for API changes
- Add migration guides for breaking changes

## Best Practices

### Performance

- Use React Query for caching
- Implement code splitting
- Optimize images
- Minimize bundle size

### Accessibility

- Use semantic HTML
- Add ARIA labels
- Support keyboard navigation
- Test with screen readers

### Security

- Sanitize user input
- Use parameterized queries
- Validate all inputs
- Follow OWASP guidelines

### Database

- Use transactions for multi-step operations
- Add indexes for performance
- Write migrations carefully
- Test migrations both ways (up and down)

## Getting Help

- **Issues**: GitHub Issues for bugs and features
- **Discussions**: GitHub Discussions for questions
- **Documentation**: Check existing docs first

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on the code, not the person
- Help others learn and grow

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

Thank you for contributing to DeepScholar!
