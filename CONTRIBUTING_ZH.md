# 贡献指南 (Contributing to Marketing Open Hub)

[English](./CONTRIBUTING.md) | [中文](./CONTRIBUTING_ZH.md)

感谢你对 `marketing-open-hub` 的关注与支持！我们热忱欢迎市场营销学者、消费者行为研究人员、数据科学家以及全栈开发者共同参与贡献。

---

## 本地开发环境准备

1. **环境要求**：
   - Node.js >= 20.0.0
   - pnpm >= 9.0.0

2. **安装依赖**：

   ```bash
   pnpm install
   ```

3. **启动本地开发服务器**：

   ```bash
   pnpm dev
   ```

4. **运行质量门禁**：
   在提交 Pull Request 之前，请务必在本地运行并通过以下质量检查：
   ```bash
   pnpm lint              # ESLint 静态代码风格检查
   pnpm format:check      # Prettier 代码格式检查
   pnpm exec tsc --noEmit # TypeScript 严格类型检查
   pnpm test              # 单元测试与统计基准测试 (114 个测试)
   pnpm build             # Next.js 生产环境构建验证
   ```

---

## 统计检验方法的贡献规范

在添加或修改统计检验方法时，请遵循以下规范：

1. 纯算法逻辑必须实现为纯函数，统一放置在 `src/lib/statistics/tests/` 目录下。
2. 统计计算引擎严禁引入 React、DOM 或 Next.js 依赖，确保其可在 Node.js 和浏览器无头环境中独立运行。
3. 若拟将检验方法标记为 `validated`，必须在 `tests/reference/` 中编写与 R 或 SciPy 对拍的基准测试（包含临界显著边界用例）。
4. 在 `src/lib/statistics/registry.ts` 中注册该方法，并补充方法说明、学术文献引用及适用前提局限。

---

## 代码风格与 Git 规范

- Commit 提交信息请遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范（如 `feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`）。
- 提交 Issue 或 PR 时，请按提供的 GitHub 模板填写必要信息。
- 初次贡献者可参考 [Good First Issues](./docs/good-first-issues_zh.md) 寻找适合上手的任务。
