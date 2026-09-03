# System Architecture & Technical Design

`marketing-open-hub` is a **Local-First Marketing Research Workbench** built with Next.js 16 (Turbopack), React 19, and TypeScript.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       Next.js App Router                    │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │     Workspace UI      │       │     Public Pages      │  │
│  │ (Statistics, Empirical│       │ (Home, Tools Explore, │  │
│  │  Literature, Writer)  │       │     Project Detail)   │  │
│  └───────────┬───────────┘       └───────────────────────┘  │
└──────────────┼──────────────────────────────────────────────┘
               │ Calls pure functions
┌──────────────▼──────────────────────────────────────────────┐
│                  Statistical Compute Layer                  │
│                     (@/lib/statistics)                      │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────┐  │
│  │  Parametric /    │  │ Correlation /    │  │Reliability│  │
│  │  Non-parametric  │  │ Regression       │  │   & SEM   │  │
│  └────────┬─────────┘  └────────┬─────────┘  └─────┬─────┘  │
│           │                     │                  │        │
│           ▼                     ▼                  ▼        │
│      Math Core (Distributions, Gamma, Incomplete Beta, LU)  │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Design Principles

1. **Decoupled Statistical Computation**:
   All statistical methods are pure TypeScript functions located in `src/lib/statistics/`. They receive standard arrays/matrices and return strongly typed `StatisticalResult` objects. They have **zero** React, DOM, or browser dependencies and can be executed headlessly in Node.js or Vitest.

2. **Local-First Privacy**:
   User datasets uploaded via CSV or Excel are parsed strictly within the browser memory using Web Workers / client parsing. Datasets are **never** uploaded to an external server.

3. **Validation Level Governance**:
   Every statistical test has an explicit `ValidationLevel`:
   - `validated`: Formally benchmarked and verified against SciPy / R reference outputs in `tests/reference/`.
   - `beta`: Classical mathematical implementation with unit tests, under active reference benchmarking.
   - `experimental`: Exploratory heuristics (e.g. skewness-kurtosis normality approximation, iterative CFA approximations) with prominent disclaimer banners.

---

## Directory Structure

- `src/lib/statistics/`:
  - `types.ts`: Core data structures (`ValidationLevel`, `TestType`, `StatisticalResult`, `AnalysisWarning`, `APAReport`).
  - `registry.ts`: Method catalog with metadata, maturity tags, and literature citations.
  - `math.ts`: Mathematical foundations (Gamma function, incomplete beta, regularized incomplete gamma for $\chi^2$, matrix algebra).
  - `formatters/apa.ts`: APA 7th edition result formatting utilities.
  - `tests/`: Domain implementations (descriptive, parametric, non-parametric, correlation, regression, reliability, advanced).
- `src/lib/crypto.ts`: Web Crypto API wrapper (AES-GCM 256-bit encryption with 96-bit random IV for browser-side API keys).
- `src/app/api/chat/route.ts`: Hardened AI assistant proxy with SSRF protection, loopback/private network blocking, and timeout guards.
- `tests/reference/`: Standard benchmark tests cross-referenced against R and SciPy ground truth.
