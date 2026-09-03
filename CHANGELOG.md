# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added

- Modular statistics engine in `src/lib/statistics/` with isolated math, formatters, and test runners.
- Benchmark verification test suite (`tests/reference/stats-reference.test.ts`) validating Student's t, ANOVA, Chi-square, Pearson correlation, and Mann-Whitney U against R and SciPy ground truth.
- Standardized `ValidationLevel` metadata tags (`validated`, `beta`, `experimental`) on all tests.
- UI status badges for statistical maturity in the analysis selection panel and APA report cards.
- Complete GitHub CI pipeline (`.github/workflows/ci.yml`) enforcing linting, type-checking, reference tests, and production build gates.
- Dependabot configuration (`.github/dependabot.yml`) for automated dependency vulnerability management.
- Architectural and scientific documentation (`docs/architecture.md`, `docs/statistics-validation.md`, `docs/security-model.md`).

### Changed

- Replaced Chi-square distribution calculation with an exact Regularized Incomplete Gamma function implementation (`regIncGamma(k/2, x/2)`).
- Renamed skewness-kurtosis heuristic to transparently state "偏度-峰度正态性检验（探索性）" rather than mislabeling as Shapiro-Wilk.
- Refactored `src/app/workspace/statistics/page.tsx` from 2,532 lines down to 975 lines (61.5% size reduction).
- Hardened SSRF defense on `/api/chat`: blocked private IP subnets, loopback addresses, and cloud metadata endpoints.
- Upgraded Web Crypto API encryption to use true cryptographically random 96-bit IVs (`crypto.getRandomValues`) and eliminated silent plaintext fallbacks.
- Corrected Content Security Policy (CSP) headers to support PostHog analytics integration.
