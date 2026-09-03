# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.2.0] - 2026-09-03

### 🎯 核心变更 (Core Improvements)

- **统计假设统一 (FINAL-001)**：重构独立样本 t 检验为标准 Welch's t-test，统一 $t$ 统计量、Welch-Satterthwaite 自由度、Student $t$ 分布 CDF 以及基于分位数函数 $t_{\text{crit}}$ 的置信区间。配对样本 t 检验统一使用 Student $t$ CDF 及 $t_{\text{crit}}$ 临界值，彻底移除正态近似及固定 1.96 临界值。
- **Pearson 相关 p 值修正 (FINAL-002)**：Pearson $r$ 显著性推断切换为精确 Student $t$ 分布 CDF：`p = 2 * (1 - tDistCDF(abs(t), n - 2))`。
- **中介效应推断一致性 (FINAL-003)**：Bootstrap 中介分析回归方程（路径 a、b、c、c'）统一采用 Student $t$ 分布及对应自由度的临界值计算置信区间，消除 1.96 与 normalCDF 混用。
- **持久化加密适配器归一化 (FINAL-004)**：移除 `config.ts` 中的重复加密适配器与明文降级逻辑，统一复用 `src/lib/crypto.ts` 的 `createEncryptedStorage()`，加密失败时拒绝明文写入。
- **模型提供商注册一致性 (FINAL-005)**：移除未实现适配的 `wenxin` 提供商，确保 `API_PROVIDERS` 列表中的每个内置 Provider 在同源代理和调用链路上真实可用，新增注册一致性测试 `tests/provider-registry.test.ts`。
- **统计成熟度标识收敛 (FINAL-006 & FINAL-007)**：收紧 `validated` 标准，将未覆盖多组基准用例的计算器降级为 `beta`；扩充 `tests/reference/stats-reference.test.ts`，为每个验证方法补充显著性边界用例（$p \approx .05$）。
- **错误监控与 CSP 清理 (FINAL-010)**：移除因 CSP 未配置 CDN 域名而引发拦截报错的 Sentry 动态加载脚本，保留简洁可靠的控制台日志与可选 PostHog 分析。
- **冒烟测试与 CI 规范 (FINAL-008 & FINAL-009)**：将测试套件规范命名为 `Research Pipeline Smoke Tests`，CI Badge 分支对齐 `master`。
- **社区 Discussions 开启 (FINAL-012)**：正式启用 GitHub Discussions，对齐 Issues 与学术问答通道。

### 📊 统计方法成熟度状态 (Validation Status)

#### 1. Validated (基准校验通过)

经与 R / SciPy 成熟科学计算实现多组参考用例（含显著性临界边界用例）对拍校验：

- `descriptive` (描述性统计与标准矩)
- `ttest` (Welch 独立样本 t 检验)
- `paired-ttest` (配对样本 t 检验)
- `anova` (单因素方差分析)
- `chi-square` (卡方独立性检验)
- `pearson` (Pearson 积差相关与 Fisher z 置信区间)
- `mann-whitney` (Mann-Whitney U 非参数两组检验)
- `cronbach` (Cronbach's α 内部一致性信度)

#### 2. Beta & Experimental (测试中与探索性方法)

供研究探索与教学参考，正式发表前建议使用专业统计软件复核：

- `mediation` (参考 Hayes PROCESS Model 4 框架之非参数 Bootstrap Percentile CI 中介分析)
- `regression` (多元线性回归 OLS / Logistic)
- `spearman` (秩相关非参数检验)
- `normality` (偏度-峰度探索性正态性检验)
- `repeated-anova`, `kruskal-wallis`, `wilcoxon`, `ancova`, `manova`, `efa`, `cfa`, `htmt`, `cmv` 等

### ⚠️ 已知局限 (Known Limitations)

1. **中介模型架构**：当前中介分析基于单中介模型（参考 PROCESS Model 4 框架），采用非参数 Percentile Bootstrap 重抽样。暂未实现 BCa (Bias-Corrected and Accelerated) 偏差校正 Bootstrap，亦未支持多中介、并行中介或有调节的中介模型。
2. **纯前端计算性能边界**：统计与 Bootstrap 重抽样完全在浏览器 Web Worker / 单线程内存中运算，若单次样本量大于 50,000 行或重抽样次数设置超过 5,000 次，在低配设备上可能会出现短暂计算延迟。
3. **本地静态加密边界 (Threat Model)**：API Key 加密存储基于浏览器 Web Crypto API (AES-GCM 256-bit + 96-bit 随机 IV) 并存储于 IndexedDB/localStorage，有效抵御本地硬盘物理读取和普通开发者工具明文查看；但无法绝对防御完全同源上下文下的恶意 XSS 注入攻击。

---

## [0.1.0] - 2026-08-30

- 初始开源版本发布。
