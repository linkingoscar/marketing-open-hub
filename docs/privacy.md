# Privacy Policy & Data Handling

Effective Date: September 2026

`marketing-open-hub` is committed to protecting the privacy and confidentiality of academic and commercial researchers. This document details how data is handled across the workbench.

---

## 1. Local-First Processing (Default)

- **Datasets & Files**: Any CSV, Excel, or tabular data uploaded into workspace tools (e.g. Statistics, Data Clean, Empirical Canvas) is parsed and stored **strictly inside your browser memory (RAM)**.
- **Zero Server Upload**: Tabular data is **never** uploaded to or retained by `marketing-open-hub` servers. Calculations are performed locally via client-side WebAssembly / TypeScript algorithms.
- **Local Storage & IndexedDB**:
  - Saved workspace configurations, workflow templates, and favorite projects are stored in browser `localStorage` and `IndexedDB`.
  - Stored credentials (such as LLM API keys) are encrypted using AES-GCM (256-bit key) with standard 96-bit random IVs via the browser Web Crypto API.

---

## 2. External Services & Third-Party AI Providers

When you choose to enable AI assistant features or online literature lookups, specific outbound requests occur:

1. **LLM API Providers (OpenAI, Anthropic, DeepSeek, Google Gemini, Qwen, etc.)**:
   - Only the specific text prompts you send in the AI assistant or writing polish tools are dispatched to the selected provider.
   - We do not share your raw tabular datasets with AI providers unless you explicitly copy/paste summary tables into the chat.
   - Provider terms apply to any data processed through their APIs.

2. **Semantic Scholar / Open Academic APIs**:
   - When searching literature in the Literature Explorer, query search terms are sent to public scholarly APIs (Semantic Scholar, CrossRef, arXiv) to retrieve citation and abstract metadata.

3. **Telemetry & Analytics (Optional / Anonymized)**:
   - PostHog telemetry is enabled only when specific tracking environment variables (`NEXT_PUBLIC_POSTHOG_KEY`) are provisioned during deployment.
   - Respects `Do Not Track (DNT)` browser settings.
   - Telemetry strictly collects anonymized interaction events and page view counts. No uploaded research data, private keys, or prompt texts are ever tracked.

---

## 3. How to Clear Local Data

You can completely remove all locally stored data at any time:

1. Navigate to **Settings** (`/settings`) in the application.
2. Click **Clear Local Data & Credentials**.
3. Alternatively, clear site data and cookies directly via your browser's Privacy & Security settings.
