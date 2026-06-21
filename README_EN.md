# MarTech Open Hub

**Open-source project discovery and empirical analysis platform for marketing × consumer behavior research**

[English](./README_EN.md) | [中文](./README.md)

<!-- Core Status -->
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Build Status](https://img.shields.io/github/actions/workflow/status/linkingoscar/marketing-open-hub/update-projects.yml?label=build)](https://github.com/linkingoscar/marketing-open-hub/actions)
[![Vercel](https://img.shields.io/badge/Vercel-deployed-black?logo=vercel)](https://martech-open-hub.vercel.app)

<!-- Framework & Language -->
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38BDF8?logo=tailwindcss)](https://tailwindcss.com/)

<!-- Tools & Libraries -->
[![Zustand](https://img.shields.io/badge/Zustand-5.x-FF6B35?logo=zustand)](https://zustand-demo.pmnd.rs/)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-12.x-0055FF?logo=framer)](https://www.framer.com/motion/)
[![Recharts](https://img.shields.io/badge/Recharts-3.8-FF6B6B)](https://recharts.org/)
[![Vitest](https://img.shields.io/badge/Vitest-3.2-6E9F18?logo=vitest)](https://vitest.dev/)

<!-- Testing & Quality -->
[![Tests](https://img.shields.io/badge/Tests-60%20passed-brightgreen)](#testing)
[![Coverage](https://img.shields.io/badge/Coverage-statistics%20%2B%20workflow-brightgreen)](#testing)

<!-- GitHub -->
[![GitHub Stars](https://img.shields.io/github/stars/linkingoscar/marketing-open-hub?style=social)](https://github.com/linkingoscar/marketing-open-hub/stargazers)
[![GitHub Forks](https://img.shields.io/github/forks/linkingoscar/marketing-open-hub?style=social)](https://github.com/linkingoscar/marketing-open-hub/network/members)
[![GitHub Issues](https://img.shields.io/github/issues/linkingoscar/marketing-open-hub)](https://github.com/linkingoscar/marketing-open-hub/issues)
[![GitHub Pull Requests](https://img.shields.io/github/issues-pr/linkingoscar/marketing-open-hub)](https://github.com/linkingoscar/marketing-open-hub/pulls)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/linkingoscar/marketing-open-hub/pulls)

<!-- Feature Tags -->
[![PWA](https://img.shields.io/badge/PWA-supported-5A0FC8)](https://martech-open-hub.vercel.app)
[![i18n](https://img.shields.io/badge/i18n-zh%20%7C%20en-blue)](#internationalization)
[![SEO](https://img.shields.io/badge/SEO-JSON--LD%20%2B%20RSC-green)](#tech-stack)
[![Security](https://img.shields.io/badge/Security-AES--GCM%20encrypted-orange)](#security)

31 academic-grade open-source projects · 36 statistical tests · 18 interactive tools · 11 LLM APIs · Browser-only computation

---

## ✨ Core Features

- **Project Discovery**: 31 marketing research open-source projects, 9 categories, radar chart scoring, health scores
- **Statistical Analysis**: 36 test methods, APA format output, auto-annotation (plain-language explanation + practical advice)
- **Marketing Templates**: 10 preset research scenarios (brand awareness, A/B testing, satisfaction, market segmentation, etc.)
- **Scenario Comparison**: 7 research scenarios with auto-recommended tools, multi-dimensional radar comparison
- **Evidence Direction**: Input hypothesis → search literature → support/mixed/oppose percentage visualization
- **Structured Extraction**: Auto-extract sample size, method, industry, effect size from papers → export CSV
- **Research Workflow**: Visual workflow orchestration, 4 preset templates, step dependency management
- **AI Assistant**: 11 LLM API providers, conversational research guidance
- **Paper Writing**: APA format output, paper writing, AI trace detection & polishing
- **Onboarding**: 6-step guided tour on first visit
- **Favorites**: One-click project favorites, config export/import support
- **Data Security**: AES-GCM encrypted API key storage, browser-only computation

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** ≥ 18
- **pnpm** ≥ 8 (recommended) or npm / yarn

### Installation & Running

```bash
# 1. Clone the repository
git clone https://github.com/linkingoscar/marketing-open-hub.git
cd marketing-open-hub

# 2. Install dependencies
pnpm install

# 3. Start development server
pnpm dev
```

Open browser and visit http://localhost:3000

### Other Commands

```bash
pnpm dev          # Start development server
pnpm build        # Build production version
pnpm start        # Start production server
pnpm lint         # Run code linting
pnpm test         # Run tests (60 tests)
pnpm test:watch   # Run tests in watch mode
pnpm test:coverage # Generate test coverage report
```

### Update Project Data

```bash
# Update stars/forks for 31 projects from GitHub API
node scripts/update-projects.js

# Dry run mode (preview without writing)
node scripts/update-projects.js --dry-run
```

> Set `GITHUB_TOKEN` environment variable for higher API rate limits. GitHub Actions updates weekly.

---

## 📖 User Guide

### Step 1: Configure API Key (Optional)

To use AI features (paper writing, sentiment analysis, research assistant, etc.), configure an LLM API Key:

1. Visit [Settings page](http://localhost:3000/settings)
2. Select a provider (recommended: **DeepSeek** for best value)
3. Enter your API Key
4. Select a model
5. Click "Test Connection" to verify

> API Keys are encrypted with AES-GCM and stored locally. Encryption keys are saved in IndexedDB.

**Recommended Providers**:

| Provider | Recommended Model | Price | Notes |
|----------|------------------|-------|-------|
| DeepSeek | deepseek-v4-flash | ¥0.14/MTok | Best value |
| Qwen | qwen3.6-plus | ¥1.60/MTok | Best Chinese |
| OpenAI | gpt-4.1 | $2.00/MTok | Best English |
| Anthropic | claude-sonnet-4-6 | $5.00/MTok | Best academic writing |

### Step 2: Browse Open-Source Projects

1. Visit [Homepage](http://localhost:3000), browse 31 marketing research projects
2. Filter by category (AI Simulation, Sentiment Analysis, User Behavior, etc.)
3. Click projects for details (radar chart, health score, features)
4. Use `Cmd+K` / `Ctrl+K` for quick search

### Step 3: Use Statistical Analysis

1. Visit [Statistical Analysis](http://localhost:3000/workspace/statistics)
2. Upload CSV/JSON data files (or use built-in datasets)
3. Select variables (click variable canvas for X/Y)
4. Choose test method (36 types, filterable by group)
5. Click "Calculate" to view results
6. Results include: APA format, statistics, **plain-language explanation**, **practical advice**
7. One-click copy or export report

**Supported Test Methods**:

| Group | Methods |
|-------|---------|
| Descriptive | Descriptive statistics, Likert frequency table |
| Prerequisites | Normality test, homogeneity of variance |
| Comparison | t-test, ANOVA, Mann-Whitney U, Wilcoxon |
| Categorical | Chi-square test, Fisher's exact test |
| Correlation | Pearson r, Spearman ρ |
| Regression | Multiple linear regression, Binary logistic |
| Reliability | Cronbach's α, Item analysis, Split-half reliability |
| Validity | CR + AVE, HTMT, Common method bias |
| Factor | EFA, CFA |
| Mediation/Moderation | Mediation effect, Moderation effect |
| Bayesian | Bayesian t-test, Bayesian correlation |
| Power | Power analysis (sample size estimation) |

### Step 4: Use Marketing Templates

1. Visit [Template Library](http://localhost:3000/workspace/templates)
2. Select a research scenario (e.g., "Brand Awareness Research")
3. View recommended methods, data structure, analysis workflow
4. Follow step-by-step guidance to complete analysis

### Step 5: Literature Search & Analysis

1. Visit [Literature Search](http://localhost:3000/workspace/literature)
2. **Literature Search**: Enter keywords, filter by field and year
3. **Evidence Direction**: Input research hypothesis, view literature support direction
4. **Structured Extraction**: Auto-extract key paper fields, export CSV

### Step 6: Research Workflow

1. Visit [Research Workflow](http://localhost:3000/workspace/workflow)
2. Select preset template (Brand Awareness, A/B Test, Scale Development, Satisfaction)
3. Execute step by step, mark completion status
4. Workflow automatically tracks progress

### Step 7: AI Assistance

- [AI Research Assistant](http://localhost:3000/workspace/ai-assistant): Conversational research guidance
- [Paper Writing](http://localhost:3000/workspace/paper-writer): Auto-generate 6 chapter types
- [Paper Polishing](http://localhost:3000/workspace/writing-polish): AI trace detection + smart rewriting
- [Sentiment Analysis](http://localhost:3000/workspace/sentiment): Batch text sentiment analysis

### Step 8: Project Comparison

1. Visit [Project Comparison](http://localhost:3000/compare)
2. **Scenario Comparison**: Select research scenario (sentiment analysis, causal inference, etc.), auto-recommend tools
3. **Manual Comparison**: Search and select 2-4 projects, view radar chart and detailed comparison table

---

## 📁 Project Structure

```
marketing-open-hub/
├── src/
│   ├── app/                          # Next.js App Router pages
│   │   ├── layout.tsx                # Global layout (onboarding, analytics, error boundary)
│   │   ├── page.tsx                  # Homepage
│   │   ├── project/[id]/page.tsx     # Project detail (Server Component + SEO)
│   │   ├── compare/page.tsx          # Project comparison (scenario + manual)
│   │   ├── settings/page.tsx         # API settings
│   │   └── workspace/               # Workspace (18 tool pages)
│   ├── components/
│   │   ├── charts/                   # Chart components (distribution, box, scatter, heatmap)
│   │   ├── effects/                  # Animation effects (scroll progress, 3D tilt, ripple)
│   │   ├── empirical/                # Empirical analysis (variable bubbles, framework canvas)
│   │   ├── home/                     # Homepage components (Hero, BentoGrid, trending)
│   │   ├── layout/                   # Layout components (Navbar, Footer, MobileTabBar)
│   │   ├── search/                   # Search components (Cmd+K command palette)
│   │   ├── ui/                       # Base UI components (shadcn/ui)
│   │   ├── workspace/                # Workspace components (file upload, export, templates)
│   │   ├── analytics-provider.tsx    # Analytics init (Sentry + PostHog)
│   │   ├── error-boundary.tsx        # Global error boundary
│   │   └── project-detail-client.tsx # Project detail client interactions
│   ├── data/
│   │   ├── projects.ts               # Project data entry
│   │   ├── projects-data.json        # 31 project data (JSON, auto-updatable)
│   │   ├── categories.ts             # 9 categories
│   │   ├── marketing-templates.ts    # 10 marketing templates
│   │   ├── datasets.ts               # Built-in datasets
│   │   └── types.ts                  # TypeScript type definitions
│   ├── hooks/                        # Custom Hooks
│   ├── lib/
│   │   ├── api/                      # API layer (LLM calls, config, history, literature)
│   │   ├── crypto.ts                 # Web Crypto API encryption
│   │   ├── analytics.ts              # Error tracking + user analytics
│   │   ├── config-export.ts          # Config export/import
│   │   ├── db/                       # Database interface (abstract + mock)
│   │   │   ├── types.ts              # Data model definitions
│   │   │   ├── interface.ts          # Abstract interface
│   │   │   ├── mock.ts               # localStorage implementation
│   │   │   └── README.md             # Interface documentation
│   │   ├── stores/                   # Zustand Stores
│   │   │   ├── favorites.ts          # Favorites functionality
│   │   │   └── workspace.ts          # Workspace state (onboarding, data transfer)
│   │   ├── empirical/                # Empirical analysis (construct detection, PROCESS)
│   │   ├── statistics/               # Statistical annotation system
│   │   ├── workflow/                 # Workflow engine
│   │   ├── i18n/                     # Internationalization (modular)
│   │   │   ├── index.ts              # Entry point
│   │   │   └── locales/              # Translation files (by feature)
│   │   └── utils.ts                  # Utility functions
│   └── scripts/
│       └── update-projects.js        # Project data auto-update script
├── public/
│   ├── sw.js                         # Service Worker (tiered caching)
│   ├── manifest.json                 # PWA manifest
│   └── favicon.svg                   # Favicon
├── scripts/
│   └── update-projects.js            # GitHub data update script
├── .github/
│   └── workflows/
│       └── update-projects.yml       # GitHub Actions auto-update
├── vitest.config.ts                  # Vitest test config
├── next.config.ts                    # Next.js config (with CSP headers)
├── tsconfig.json                     # TypeScript config
└── package.json                      # Dependency management
```

---

## 🔧 Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router + RSC) | 16.2.6 |
| Language | TypeScript (strict) | 5.x |
| Styling | Tailwind CSS | 4.x |
| UI Library | shadcn/ui + Radix UI | Latest |
| Animation | Framer Motion | 12.x |
| Charts | Recharts | 3.8 |
| State Management | Zustand (persist) | 5.x |
| Search | cmdk + Fuse.js | 1.x / 7.x |
| Testing | Vitest | 3.2.x |
| Encryption | Web Crypto API (AES-GCM) | Browser native |
| Analytics | Sentry + PostHog (optional) | - |
| Literature API | Semantic Scholar | Free |
| LLM API | 11 providers (OpenAI/Anthropic/Gemini/DeepSeek etc.) | - |

---

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage report
pnpm test:coverage
```

**Test Coverage**:
- `src/lib/statistics/annotations.test.ts` — 44 tests (statistical annotation system)
- `src/lib/workflow/engine.test.ts` — 16 tests (workflow engine)

---

## 🔐 Security

- **API Key Encryption**: Encrypted with Web Crypto API (AES-GCM), keys stored in IndexedDB
- **CSP Headers**: Strict Content-Security-Policy limiting external resource loading
- **Browser-only Computation**: Statistical data processed locally, never uploaded
- **Privacy Analytics**: Sentry/PostHog anonymized by default, supports Do Not Track

---

## 🌐 Internationalization

Supports Chinese/English bilingual, translation files organized by feature:

```
src/lib/i18n/
├── index.ts              # Entry point
└── locales/
    ├── nav.ts            # Navigation translations
    ├── home.ts           # Homepage translations
    ├── workspace.ts      # Workspace translations
    ├── settings.ts       # Settings translations
    └── common.ts         # Common translations
```

---

## 📊 Data Updates

Project data stored in `src/data/projects-data.json`, supports auto-update:

- **Manual Update**: `node scripts/update-projects.js`
- **Auto Update**: GitHub Actions updates stars/forks weekly from GitHub API
- **Updated Fields**: stars, forks, lastUpdated, description, homepage

---

## ⚠️ Disclaimer

1. **Academic Reference**: Statistical results are for academic research only. Verify with professional software (SPSS/R/Stata/Mplus) before publication.
2. **Calculation Precision**: Some tests use approximate algorithms, may have minor differences from professional software.
3. **AI Output**: LLM-generated content may contain errors or bias. Human review required.
4. **Data Security**: Data processed locally in browser, but LLM features send text to API providers.
5. **No Warranty**: Software provided "as is" without any warranty.

---

## 🙏 Acknowledgements

This platform is built on these excellent open-source projects:

### Core Framework

- [Next.js](https://github.com/vercel/next.js) — React full-stack framework
- [React](https://github.com/facebook/react) — UI rendering engine
- [TypeScript](https://github.com/microsoft/TypeScript) — Type safety
- [Tailwind CSS](https://github.com/tailwindlabs/tailwindcss) — Atomic CSS
- [shadcn/ui](https://github.com/shadcn-ui/ui) — Reusable component library
- [Radix UI](https://github.com/radix-ui/primitives) — Unstyled component primitives

### Visualization & Animation

- [Recharts](https://github.com/recharts/recharts) — React chart library
- [Framer Motion](https://github.com/framer/motion) — React animations
- [Lucide](https://github.com/lucide-icons/lucide) — Icon library

### State Management & Search

- [Zustand](https://github.com/pmndrs/zustand) — Lightweight state management
- [cmdk](https://github.com/pacocoursey/cmdk) — Command palette
- [Fuse.js](https://github.com/krisk/Fuse) — Fuzzy search

### Academic Data Source

- [Semantic Scholar](https://www.semanticscholar.org/) — 200M+ academic paper API

### Inspiration

- [JASP](https://jasp-stats.org/) — Open-source statistical analysis platform
- [jamovi](https://www.jamovi.org/) — R-based statistical suite
- [Elicit](https://elicit.com/) — AI literature research assistant
- [Consensus](https://consensus.app/) — Academic search engine
- [Research Rabbit](https://www.researchrabbit.ai/) — Literature discovery tool
- [Scite](https://scite.ai/) — Smart citation analysis

---

## 📄 License

[MIT](./LICENSE) © [linkingoscar](https://github.com/linkingoscar)
