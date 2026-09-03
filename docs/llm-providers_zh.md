# 大模型提供商支持与安全代理架构

[English](./llm-providers.md) | [中文](./llm-providers_zh.md)

Marketing Open Hub 内置支持 10 家主流大模型提供商及 1 个自定义兼容端点，用于科研指导对话、学术文献分析与论文润色改写。

---

## 1. 支持的模型提供商列表

| 提供商                       | 默认 Base URL                                       | 认证机制                       | 推荐模型                             |
| ---------------------------- | --------------------------------------------------- | ------------------------------ | ------------------------------------ |
| **OpenAI**                   | `https://api.openai.com/v1`                         | Bearer Token (`Authorization`) | `gpt-4o`, `gpt-4o-mini`              |
| **DeepSeek (深度求索)**      | `https://api.deepseek.com`                          | Bearer Token (`Authorization`) | `deepseek-chat`, `deepseek-reasoner` |
| **Anthropic**                | `https://api.anthropic.com/v1`                      | `x-api-key`                    | `claude-3-5-sonnet-20241022`         |
| **Google Gemini**            | `https://generativelanguage.googleapis.com/v1beta`  | API Key param / header         | `gemini-2.5-flash`, `gemini-2.5-pro` |
| **Alibaba Qwen (通义千问)**  | `https://dashscope.aliyuncs.com/compatible-mode/v1` | Bearer Token (`Authorization`) | `qwen-plus`, `qwen-max`              |
| **Moonshot Kimi (月之暗面)** | `https://api.moonshot.cn/v1`                        | Bearer Token (`Authorization`) | `moonshot-v1-8k`                     |
| **ByteDance Doubao (豆包)**  | `https://ark.cn-beijing.volces.com/api/v3`          | Bearer Token (`Authorization`) | `doubao-pro-32k`                     |
| **iFlytek Spark (科大讯飞)** | `https://spark-api-open.xf-yun.com/v1`              | Bearer Token (`Authorization`) | `spark-max`                          |
| **Zhipu GLM (智谱清言)**     | `https://open.bigmodel.cn/api/paas/v4`              | Bearer Token (`Authorization`) | `glm-4-plus`, `glm-4-flash`          |
| **Xiaomi MiMo (小米)**       | `https://api.xiaomimimo.com/v1`                     | Bearer Token (`Authorization`) | `mimo-v1`                            |
| **自定义兼容端点 (Custom)**  | 用户自定义（仅限 HTTPS）                            | Bearer Token (`Authorization`) | 自定义                               |

---

## 2. 服务端安全代理架构 (`/api/chat`)

为解决前端直连大模型的跨域 (CORS) 限制，同时防止开放代理 (Open Relay) 滥用风险：

- **白名单锁定**：内置的 10 家官方提供商严格锁定至官方指定根域名，防止前端篡改目标地址。
- **防 SSRF 严格过滤**：自定义端点受到严格的防 SSRF 校验：拦截环回地址（`127.0.0.1`, `localhost`）、RFC 1918 私网网段（`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`）及云元数据端点（`169.254.169.254`）。
- **超时与熔断**：所有经代理转发的外发请求均强制施加 30 秒超时控制（`AbortSignal.timeout(30000)`）。
