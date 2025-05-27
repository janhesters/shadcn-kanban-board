# Contributing to the React Router SaaS Template

Thank you for your interest in contributing to the React Router SaaS Template! This guide outlines the process, standards, and best practices for contributing to the project.

**Boy scout rule:** If you see something that can be improved, please improve it!

> Leave the code better than you found it.

## Table of Contents

* [Code of Conduct](#code-of-conduct)
* [Getting Started](#getting-started)
* [Issue Workflow](#issue-workflow)
* [Development Workflow](#development-workflow)
* [Commit Guidelines](#commit-guidelines)
* [Pull Request Process](#pull-request-process)
* [Testing Guidelines](#testing-guidelines)
* [Style Guide](#style-guide)
* [Additional Sections to Consider](#additional-sections-to-consider)

## Code of Conduct

We expect all contributors to adhere to our code of conduct. Please be respectful, inclusive, and professional in all interactions.

## Getting Started

Follow the steps outlined in the main [README.md](./README.md#getting-started).

## Issue Workflow

1. **Create an issue** describing your proposed feature or bug fix. Include:
   * A clear title
   * Description of the problem or feature
   * Relevant context (screenshots, logs, examples)
2. **Get approval** from one of the maintainers (the ReactSquad team) before opening a pull request, so you don't waste time on a pull request that won't be merged.
3. Once approved, proceed to implement the changes in a new branch.

## Development Workflow

1. **Create a feature/fix branch** off of `main`:

   ```bash
   git checkout -b feat/your-feature-name
   # or
   git checkout -b fix/your-fix-name
   ```
2. **Implement your changes**, adhering to the [Style Guide](#style-guide).
3. **Write tests** (see [Testing Guidelines](#testing-guidelines)).
4. **Run checks**:

   ```bash
   npm run typecheck    # Type checking
   npm run lint         # Linting
   npm run test         # Unit & integration tests
   npm run test:e2e:ui  # End-to-end tests
   ```
5. **Commit changes** following our [Commit Guidelines](#commit-guidelines).

## Commit Guidelines

We use [Conventional Commits](https://www.conventionalcommits.org/) for clarity and automated versioning. Commit message format:

```
type(scope): short description

[optional body]

[optional footer]
```

**Types:**

* `feat`: New feature
* `fix`: Bug fix
* `docs`: Documentation changes
* `style`: Code style (formatting)
* `refactor`: Code restructuring
* `test`: Adding or updating tests
* `chore`: Maintenance tasks

After staging, use Commitizen for consistent formatting:

```bash
npx cz
```

## Pull Request Process

1. Ensure your branch is up to date with `main`:

   ```bash
   git fetch upstream
   git rebase upstream/main
   ```
2. Push your branch to your fork:

   ```bash
   git push origin feat/your-feature-name
   ```
3. Open a pull request against `reactsquad/main`.
4. **Link the approved issue** in your PR description.
5. Ensure all checks pass and the build is green.
6. Request review from at least one maintainer.
7. Address feedback; maintainers may request commit squashing.

## Testing Guidelines

### Test Location

* **Tests live adjacent to implementation files**, for example:

  ```text
  src/components/Button.tsx
  src/components/Button.test.tsx
  ```

### Coverage Requirements

* **New features** must include tests at the appropriate level: unit, integration, component, or E2E.
* **Bug fixes** require a reproducible failing test first. Once the test fails, implement the fix so the test passes.

### Test Style

Follow the project’s testing conventions:

* **Prose style**: `given: ... should: ...`
* **Assertions**: `expect(actual).toEqual(expected)`
* See [5 Questions Every Test Must Answer](https://medium.com/@ericelliott/5-questions-every-test-must-answer-18a03194eeb1).

Run tests with:

```bash
npm run test        # Unit & integration
npm run test:e2e:ui # End-to-end
```

## Style Guide

### TypeScript

* Use strict mode
* Define explicit return types
* Favor `type` for object shapes

### React

* Functional components with hooks
* Follow React Router patterns
* Use React Hook Form for forms
* Implement error boundaries

### Styling

* Tailwind CSS
* shadcn/ui component system
* Maintain dark mode support

### File Structure & Naming

* All files must be named in `kebab-case`.
* All constants must be named in `SCREAMING_SNAKE_CASE`.

### Code Quality

* ESLint & Prettier
* Write self-documenting code
* Add TSDoc to your complex functions
* Comment complex logic
* Keep functions small and focused (DOT principle)

Thank you for helping improve the React Router SaaS Template! We look forward to your contributions.
