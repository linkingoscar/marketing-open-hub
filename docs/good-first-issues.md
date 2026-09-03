# Good First Issues for New Contributors

[English](./good-first-issues.md) | [中文](./good-first-issues_zh.md)

Welcome! If you are looking to make your first contribution to `marketing-open-hub`, here is a curated list of high-impact, beginner-friendly tasks. Each task has clear scope, low architectural coupling, and well-defined verification steps.

---

## 1. Add Reference Datasets to `tests/reference/`

- **Area**: Statistical Testing & Quality
- **Description**: Add fixed benchmark test cases from published literature or standard R packages (e.g. `datasets::mtcars`, `datasets::iris`) to `tests/reference/stats-reference.test.ts`.
- **Skills Needed**: Basic TypeScript, familiarity with R or SciPy.
- **Verification**: Run `pnpm test` to ensure values match within tolerance.

---

## 2. Accessibility & ARIA Labels in Workspace Navigation

- **Area**: Frontend & UX Accessibility
- **Description**: Audit buttons, dropdowns, and modal dialogs in `src/components/workspace/` and ensure all interactive elements without text have clear `aria-label` tags.
- **Skills Needed**: React, Tailwind CSS, Accessibility best practices.
- **Verification**: Ensure keyboard tab navigation works smoothly with visual focus rings.

---

## 3. Bilingual Documentation Polish & Proofreading

- **Area**: Documentation & i18n
- **Description**: Review `README.md` and `README_EN.md` for consistent wording, typo fixes, and clarity of feature descriptions.
- **Skills Needed**: Markdown, English / Chinese bilingual reading.
- **Verification**: Ensure all links resolve correctly and formatting is clean.

---

## 4. Enrich Sample Datasets for Marketing Scenarios

- **Area**: Marketing Research & Data
- **Description**: Provide realistic synthetic CSV sample datasets (e.g. A/B testing campaign conversion rates, customer satisfaction Likert survey responses) in `public/datasets/`.
- **Skills Needed**: Basic marketing research knowledge, CSV formatting.
- **Verification**: Ensure datasets can be uploaded and calculated cleanly in the statistics workbench.

---

## 5. APA Report Text Formatting Edge Cases

- **Area**: Statistical Reporting
- **Description**: Check `src/lib/statistics/formatters/apa.ts` for APA 7th edition alignment (e.g. leading zero rules: $p < .001$ without leading zero, $t$-statistic decimal precision).
- **Skills Needed**: TypeScript, APA 7th edition manual familiarity.
- **Verification**: Run `pnpm test` to ensure APA reports adhere to academic formatting guidelines.
