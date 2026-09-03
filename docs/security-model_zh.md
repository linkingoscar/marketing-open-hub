# 安全与隐私模型文档

[English](./security-model.md) | [中文](./security-model_zh.md)

## 概述

`marketing-open-hub` 严格遵循面向学术研究与商业营销分析的**本地优先 (Local-first)** 与尊重隐私架构。

---

## 1. 威胁模型与安全防护边界

### 纳入保护范围的设计 (In-Scope Protections)

- **服务端防 SSRF 保护**：`/api/chat` 代理接口严格限制出站请求至官方认证的大模型 API 域名（如 `api.openai.com`, `api.anthropic.com`, `api.deepseek.com` 等）。环回地址（`127.0.0.1`, `localhost`）、RFC 1918 私网网段（`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`）以及云服务商元数据端点（`169.254.169.254`）在服务端分发前被严格校验并拦截。
- **本地数据保密性 (Local Data Confidentiality)**：导入工作台的 CSV/Excel 调研数据集 100% 在用户本地浏览器内存中计算。除用户主动要求外部 AI 助手辅助解读并确认外，原始数据绝不向任何外部网络发送。
- **静态加密持久化存储 (Encrypted-at-Rest)**：用户填写的 LLM API Key 在写入浏览器本地存储前，均通过 Web Crypto API 使用标准 AES-GCM (256-bit) 结合每次新生成的 96-bit 密码学随机 IV 进行静态加密，拒绝任何明文存储降级。

### 威胁模型局限性 (Limitations)

- **同源上下文局限**：浏览器端加密将派生密钥和密文保存在本地 IndexedDB/LocalStorage 中。此机制能有效抵御本地硬盘物理读取和普通开发者工具查看，但无法防御完全同源上下文下的恶意代码注入 (XSS)。对安全要求极高的用户，建议使用即用即输模式或会话临时模式。

---

## 2. 内容安全策略 (Content Security Policy, CSP)

本项目在 `next.config.ts` 中配置了严格的 Content Security Policy 头：

- 脚本加载严格限制为同源和授权的分析域名。
- 出站 fetch 网络连接限制为指定的学术检索及遥测端点。
- 禁止外部网页进行 iframe 嵌入劫持（`frame-ancestors 'none'`）。

---

## 3. 安全漏洞报告方式

有关安全漏洞的报告指引，请参阅 [`SECURITY_ZH.md`](../SECURITY_ZH.md)。
