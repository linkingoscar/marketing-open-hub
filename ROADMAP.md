# Marketing Open Hub: Public Roadmap & Capability Milestones

This roadmap outlines the past, current, and future milestones of `marketing-open-hub`.
Our primary engineering principle is: **10 rigorously validated statistical methods are far more valuable than 100 unverified ones.**

---

## 🎯 Milestone Overview

```text
[✓] Phase 1: Trust Baseline        (Mathematical accuracy, security boundaries, CI quality gate)
[✓] Phase 2: Maintainable Core     (Statistical decoupling, 61.5% page slimming, R/SciPy ground truth)
[✓] Phase 3: Open Source Ready     (Governance, automated releases, invariant tests, bug templates)
[ ] Phase 4: Research Workflow 1.0 (Advanced CFA/SEM solvers, APA 7th native Word export, UX benchmarking)
```

---

## Phase 1: Trust Baseline (Completed)

- [x] Correct Chi-Square CDF using Regularized Incomplete Gamma function `regIncGamma`.
- [x] Rename pseudo Shapiro-Wilk heuristic to transparent skewness-kurtosis normality check.
- [x] Dynamically determine significance in bootstrap mediation analysis APA reporting.
- [x] Server-side SSRF & open proxy protection in `/api/chat` (block loopback, private RFC 1918, metadata endpoints).
- [x] Upgrade client-side Web Crypto API to 96-bit random IVs and eliminate silent plaintext fallbacks.
- [x] Configure strict CSP and synchronize with PostHog analytics domains.
- [x] Automated CI quality gate (`.github/workflows/ci.yml`) enforcing linting, type-checking, testing, and building.

---

## Phase 2: Maintainable Core (Completed)

- [x] Decouple all 36 statistical methods from React into standalone `@/lib/statistics` modules.
- [x] Reduce `StatisticsPage` by 61.5% (from 2,532 lines to 975 lines).
- [x] Introduce explicit `ValidationLevel` (`validated` / `beta` / `experimental`) tags and UI status indicators.
- [x] Build automated benchmark test suite (`tests/reference/stats-reference.test.ts`) against R and SciPy ground truth.
- [x] Lock Node.js (`>=20.0.0`) and pnpm (`packageManager`) across development environments.
- [x] Provide core architecture, statistical validation, and security model technical documentation.

---

## Phase 3: Open Source Ready (Completed)

- [x] Mathematical property and invariant testing (`tests/invariants.test.ts`).
- [x] Community governance policies (`CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md`, `CHANGELOG.md`).
- [x] Reproducible Statistical Bug issue template (`.github/ISSUE_TEMPLATE/statistical_bug.yml`).
- [x] Technical support & issue triage guide (`SUPPORT.md`).
- [x] Automated SemVer release workflow (`.github/workflows/release.yml`).
- [x] Automated dependency vulnerability scanning via Dependabot (`.github/dependabot.yml`).
- [x] Good First Issues contribution guide (`docs/good-first-issues.md`).

---

## Phase 4: Towards v1.0.0 (Upcoming)

- [ ] **Full OOXML DOCX Generation**: Native `.docx` zip generation replacing Word-compatible HTML export.
- [ ] **Expanded Reference Test Suite**: Additional benchmark fixtures for Two-Way ANOVA, Repeated Measures ANOVA, and Logistic Regression with R `car` / `lme4`.
- [ ] **W3C WCAG 2.2 Accessibility Compliance**: Full keyboard navigation audit and high-contrast color scheme verification.
- [ ] **End-to-End Visual Regression Testing**: Automated visual diffs for marketing charts and canvas diagrams.
