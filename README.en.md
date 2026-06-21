# MarTech Open Hub

**Open-source project discovery and empirical analysis platform for Marketing × Consumer Behavior research**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)

31 academic-grade open-source projects · 36 statistical tests · 18 interactive tools · 11 LLM APIs · Pure browser-side computation

> **[中文文档](README.md)**

---

## Core Features

- **Project Discovery**: 31 marketing research open-source projects, 9 categories, radar chart scoring, health ratings
- **Statistical Analysis**: 36 test methods, APA format output, auto-annotated results (plain-language explanation + application advice)
- **Marketing Templates**: 10 preset research scenarios (brand awareness, A/B testing, satisfaction, market segmentation, etc.)
- **Evidence Direction**: Input hypothesis → search literature → visualize support/mixed/oppose percentages
- **Structured Extraction**: Auto-extract sample size, method, industry, effect size from papers → export CSV
- **Research Workflow**: Visual process orchestration, 4 preset templates, step dependency management
- **AI Assistant**: 11 LLM APIs supported, conversational research guidance
- **Paper Assistance**: APA format output, paper writing, AI trace detection and polish
- **Data Security**: Pure browser-side computation, data never leaves your device

---

## Quick Start

### Prerequisites

- **Node.js** ≥ 18
- **pnpm** ≥ 8 (recommended) or npm / yarn

### Install & Run

```bash
# 1. Clone the repo
git clone https://github.com/linkingoscar/marketing-open-hub.git
cd marketing-open-hub

# 2. Install dependencies
pnpm install

# 3. Start dev server
pnpm dev
```

Open browser and visit http://localhost:3000

### Other Commands

```bash
pnpm build    # Build for production
pnpm start    # Start production server
pnpm lint     # Run linter
```

---

## Usage Guide

### Step 1: Configure API Key (Optional)

If you need AI features (paper writing, sentiment analysis, research assistant, etc.), configure an LLM API Key:

1. Visit [Settings page](http://localhost:3000/settings)
2. Choose a provider (recommended: **DeepSeek** for best value)
3. Enter your API Key
4. Select a model
5. Click "Test Connection" to verify

> API Key is stored only in browser localStorage, never uploaded to any server.

**Recommended Providers**:

| Provider | Recommended Model | Price | Notes |
|----------|------------------|-------|-------|
| DeepSeek | deepseek-v4-flash | ¥0.14/MTok | Best value |
| Qwen | qwen3.6-plus | ¥1.60/MTok | Great Chinese support |
| OpenAI | gpt-4.1 | $2.00/MTok | Best English |
| Anthropic | claude-sonnet-4-6 | $5.00/MTok | Excellent academic writing |

### Step 2: Browse Open-Source Projects

1. Visit [Home](http://localhost:3000), browse 31 marketing research projects
2. Filter by category (AI Survey Simulation, Sentiment Analysis, User Behavior, etc.)
3. Click project for details (radar chart, health score, features)
4. Use `Cmd+K` / `Ctrl+K` for quick search

### Step 3: Statistical Analysis

1. Visit [Statistics](http://localhost:3000/workspace/statistics)
2. Upload CSV/JSON data (or use built-in datasets)
3. Select variables (click variable canvas to choose X/Y)
4. Choose test method (36 methods, filterable by group)
5. Click "Calculate" to view results
6. Results include: APA format, statistics, **plain-language explanation**, **application advice**
7. One-click copy or export report

**Supported Test Methods**:

| Group | Methods |
|-------|---------|
| Descriptive | Descriptive statistics, Likert frequency table |
| Prerequisites | Normality test, homogeneity of variance |
| Comparison | t-test, ANOVA, Mann-Whitney U, Wilcoxon |
| Categorical | Chi-square, Fisher's exact test |
| Correlation | Pearson r, Spearman ρ |
| Regression | Multiple linear regression, binary Logistic |
| Reliability | Cronbach's α, item analysis, split-half reliability |
| Validity | CR + AVE, HTMT, common method bias |
| Factor | EFA, CFA |
| Mediation/Moderation | Mediation effect, moderation effect |
| Bayesian | Bayesian t-test, Bayesian correlation |
| Power | Power analysis (sample size estimation) |

### Step 4: Marketing Templates

1. Visit [Templates](http://localhost:3000/workspace/templates)
2. Choose a research scenario (e.g., "Brand Awareness Research")
3. View recommended methods, data structure, analysis workflow
4. Follow the step-by-step guide to complete analysis

### Step 5: Literature Search & Analysis

1. Visit [Literature Search](http://localhost:3000/workspace/literature)
2. **Literature Search**: Enter keywords, filter by field and year
3. **Evidence Direction**: Input research hypothesis, view literature support direction
4. **Structured Extraction**: Auto-extract key fields from papers, export CSV

### Step 6: Research Workflow

1. Visit [Research Workflow](http://localhost:3000/workspace/workflow)
2. Choose a preset template (Brand Awareness, A/B Testing, Scale Development, Satisfaction)
3. Execute step by step, mark completion status
4. Workflow automatically tracks progress

### Step 7: AI Assistance

- [AI Research Assistant](http://localhost:3000/workspace/ai-assistant): Conversational research guidance
- [Paper Writing](http://localhost:3000/workspace/paper-writer): 6 section types auto-generated
- [Paper Polish](http://localhost:3000/workspace/writing-polish): AI trace detection + smart rewrite
- [Sentiment Analysis](http://localhost:3000/workspace/sentiment): Batch text sentiment analysis

---

## Project Structure

```
marketing-open-hub/
├── src/
│   ├── app/                          # Next.js App Router pages
│   ├── components/                   # UI components
│   ├── data/                         # Project data, categories, templates
│   ├── hooks/                        # Custom hooks
│   └── lib/                          # API, statistics, workflow, i18n
├── public/                           # Static assets
├── next.config.ts                    # Next.js config (with CSP security headers)
├── tsconfig.json                     # TypeScript config
├── tailwind.config.ts                # Tailwind CSS config
└── package.json                      # Dependency management
```

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router + RSC) | 16.2.6 |
| Language | TypeScript (strict) | 5.x |
| Styling | Tailwind CSS | 4.x |
| UI Library | shadcn/ui + Radix UI | Latest |
| Animation | Framer Motion + GSAP | 12.x / 3.15 |
| Charts | Recharts | 3.8 |
| State Management | Zustand (persist) | 5.x |
| Search | cmdk + Fuse.js | 1.x / 7.x |
| Literature API | Semantic Scholar | Free |
| LLM API | 11 providers (OpenAI/Anthropic/Gemini/DeepSeek, etc.) | - |

---

## Disclaimer

1. **Academic Reference**: Statistical results are for academic research reference only. Please verify with professional software (SPSS/R/Stata/Mplus) before formal publication.
2. **Computation Precision**: Some tests use approximate algorithms and may have minor differences from professional software.
3. **AI Output**: LLM-generated content may contain errors or bias. Human review is recommended.
4. **Data Security**: Data is processed locally in the browser, but LLM features send text to API providers.
5. **No Warranty**: This software is provided "as is" without any warranty.

---

## Acknowledgments

This platform was built with these excellent open-source projects:

### Core Framework
- [Next.js](https://github.com/vercel/next.js) — React full-stack framework
- [React](https://github.com/facebook/react) — UI rendering engine
- [TypeScript](https://github.com/microsoft/TypeScript) — Type safety
- [Tailwind CSS](https://github.com/tailwindlabs/tailwindcss) — Atomic CSS
- [shadcn/ui](https://github.com/shadcn-ui/ui) — Reusable component library
- [Radix UI](https://github.com/radix-ui/primitives) — Unstyled component primitives

### Visualization & Animation
- [Recharts](https://github.com/recharts/recharts) — React chart library
- [Framer Motion](https://github.com/framer/motion) — React animation
- [GSAP](https://github.com/greensock/GSAP) — High-performance animation engine
- [Lucide](https://github.com/lucide-icons/lucide) — Icon library

### State Management & Search
- [Zustand](https://github.com/pmndrs/zustand) — Lightweight state management
- [cmdk](https://github.com/pacocoursey/cmdk) — Command palette
- [Fuse.js](https://github.com/krisk/Fuse) — Fuzzy search

### Academic Data Sources
- [Semantic Scholar](https://www.semanticscholar.org/) — 200M+ academic papers API

### Inspiration
- [JASP](https://jasp-stats.org/) — Open-source statistical analysis platform
- [jamovi](https://www.jamovi.org/) — R-based statistical suite
- [Elicit](https://elicit.com/) — AI literature research assistant
- [Consensus](https://consensus.app/) — Academic search engine
- [Research Rabbit](https://www.researchrabbit.ai/) — Literature discovery tool
- [Scite](https://scite.ai/) — Smart citation analysis

---

## License

[MIT](./LICENSE) © [linkingoscar](https://github.com/linkingoscar)
