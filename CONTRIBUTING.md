# Contributing to Marketing Open Hub

[English](./CONTRIBUTING.md) | [中文](./CONTRIBUTING_ZH.md)

Thank you for your interest in contributing to `marketing-open-hub`! We welcome contributions from researchers, marketing scientists, and software engineers.

---

## Development Setup

1. **Prerequisites**:
   - Node.js >= 20.0.0
   - pnpm >= 9.0.0

2. **Installation**:

   ```bash
   pnpm install
   ```

3. **Running the local server**:

   ```bash
   pnpm dev
   ```

4. **Running Quality Checks**:
   Before submitting a Pull Request, please run:
   ```bash
   pnpm lint              # ESLint checks
   pnpm exec tsc --noEmit # TypeScript type checking
   pnpm test              # Unit & statistical reference tests
   pnpm build             # Next.js production build verification
   ```

---

## Contributing Statistical Methods

When contributing or modifying a statistical method:

1. Ensure the method is implemented as a pure function under `src/lib/statistics/tests/`.
2. Do not import React, DOM, or Next.js components into the statistical engine.
3. If proposing a method as `validated`, include a ground-truth reference test in `tests/reference/` matching R or SciPy.
4. Update `src/lib/statistics/registry.ts` with method documentation, references, and limitations.

---

## Code Style & Git Conventions

- Commit messages should follow the Conventional Commits format (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`).
- Open issues or PRs using the provided GitHub templates.
