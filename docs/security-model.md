# Security & Privacy Model

## Overview

`marketing-open-hub` adheres to a local-first, privacy-respecting architecture for academic and commercial marketing analysis.

---

## 1. Threat Model & Boundaries

### In-Scope Protections

- **SSRF Prevention**: `/api/chat` strictly restricts outbound requests to official LLM provider domains (`api.openai.com`, `api.anthropic.com`, `api.deepseek.com`, etc.). Loopback addresses (`127.0.0.1`, `localhost`), RFC 1918 private subnets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), and AWS/cloud metadata services (`169.254.169.254`) are blocked at server dispatch.
- **Local Data Confidentiality**: Research datasets loaded into memory are processed 100% on the client device. They are not transmitted across the network unless the user explicitly requests an external AI interpretation.
- **Encrypted-at-Rest Storage**: User-provided LLM API keys are encrypted via standard AES-GCM (256-bit key) with a freshly generated, cryptographically secure 96-bit random IV before being persisted in the browser.

### Threat Model Limitations

- **Same-Origin Context**: Browser-side encryption stores the derived key and ciphertext in browser IndexedDB/LocalStorage. It protects credentials from casual inspection or plain-text file leaks, but cannot defend against arbitrary code execution (XSS) running in the same origin. Users requiring maximum security should use session-only mode or enter keys on demand.

---

## 2. Content Security Policy (CSP)

The application enforces a strict Content Security Policy defined in `next.config.ts`:

- Scripts are restricted to self and authorized analytics domains.
- Outbound fetch connections are limited to designated academic and telemetry endpoints.
- Inline frame embedding is prohibited (`frame-ancestors 'none'`).

---

## 3. Reporting Vulnerabilities

Please refer to [`SECURITY.md`](../SECURITY.md) for vulnerability reporting procedures.
