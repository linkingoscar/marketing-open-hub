# Supported LLM Providers & Security Proxy Architecture

[English](./llm-providers.md) | [中文](./llm-providers_zh.md)

Marketing Open Hub supports 10 built-in leading LLM providers plus 1 custom OpenAI-compatible endpoint for conversational marketing research guidance, literature synthesis, and paper writing polish.

---

## 1. Supported Providers

| Provider                     | Default Base URL                                    | Auth Mechanism                 | Default Model Recommendation         |
| ---------------------------- | --------------------------------------------------- | ------------------------------ | ------------------------------------ |
| **OpenAI**                   | `https://api.openai.com/v1`                         | Bearer Token (`Authorization`) | `gpt-4o`, `gpt-4o-mini`              |
| **DeepSeek**                 | `https://api.deepseek.com`                          | Bearer Token (`Authorization`) | `deepseek-chat`, `deepseek-reasoner` |
| **Anthropic**                | `https://api.anthropic.com/v1`                      | `x-api-key`                    | `claude-3-5-sonnet-20241022`         |
| **Google Gemini**            | `https://generativelanguage.googleapis.com/v1beta`  | API Key param / header         | `gemini-2.5-flash`, `gemini-2.5-pro` |
| **Alibaba Qwen (通义千问)**  | `https://dashscope.aliyuncs.com/compatible-mode/v1` | Bearer Token (`Authorization`) | `qwen-plus`, `qwen-max`              |
| **Moonshot Kimi**            | `https://api.moonshot.cn/v1`                        | Bearer Token (`Authorization`) | `moonshot-v1-8k`                     |
| **ByteDance Doubao (豆包)**  | `https://ark.cn-beijing.volces.com/api/v3`          | Bearer Token (`Authorization`) | `doubao-pro-32k`                     |
| **iFlytek Spark (星火)**     | `https://spark-api-open.xf-yun.com/v1`              | Bearer Token (`Authorization`) | `spark-max`                          |
| **Zhipu GLM (智谱清言)**     | `https://open.bigmodel.cn/api/paas/v4`              | Bearer Token (`Authorization`) | `glm-4-plus`, `glm-4-flash`          |
| **Xiaomi MiMo**              | `https://api.xiaomimimo.com/v1`                     | Bearer Token (`Authorization`) | `mimo-v1`                            |
| **Custom OpenAI-Compatible** | User Configured (HTTPS Only)                        | Bearer Token (`Authorization`) | Custom                               |

---

## 2. Server-Side Security Proxy (`/api/chat`)

To protect users against CORS limitations while preventing Open Relay abuse:

- Built-in providers **lock** their target destination to official endpoints, preventing client-side `baseUrl` tampering.
- Custom endpoints are subjected to strict anti-SSRF filtering: loopback interfaces (`127.0.0.1`, `localhost`), RFC 1918 private subnets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), and cloud metadata (`169.254.169.254`) are blocked.
- All outbound proxy requests enforce a strict 30-second timeout (`AbortSignal.timeout(30000)`).
