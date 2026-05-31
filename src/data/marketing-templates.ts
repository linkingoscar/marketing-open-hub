/**
 * 营销研究模板库
 * 每个模板包含：场景描述、推荐统计方法、示例数据结构、解释模板、参考文献
 */

export interface MarketingTemplate {
  id: string;
  name: string;
  nameCN: string;
  icon: string;
  category: "品牌" | "消费者" | "产品" | "渠道" | "定价" | "广告";
  scenario: string;
  description: string;
  recommendedTests: {
    testId: string;
    reason: string;
    whenToUse: string;
  }[];
  sampleDataStructure: {
    columns: { name: string; type: "numeric" | "categorical" | "likert"; description: string }[];
    sampleRows: number;
  };
  interpretationGuide: {
    keyMetrics: string[];
    whatToLookFor: string[];
    commonPitfalls: string[];
  };
  references: { title: string; authors: string; year: number; journal: string }[];
  workflow: { step: number; action: string; tool: string }[];
}

export const MARKETING_TEMPLATES: MarketingTemplate[] = [
  {
    id: "brand-awareness",
    name: "Brand Awareness Study",
    nameCN: "品牌认知度研究",
    icon: "🏷️",
    category: "品牌",
    scenario: "评估广告活动前后品牌认知度变化，或比较不同品牌的认知度差异",
    description: "通过前后测设计或组间比较，量化品牌认知度、品牌回忆率和品牌联想的变化。适用于广告效果评估、品牌定位研究。",
    recommendedTests: [
      { testId: "paired-ttest", reason: "前后测设计比较同一组被试的认知度变化", whenToUse: "有广告前后的配对数据" },
      { testId: "ttest", reason: "比较实验组与对照组的品牌认知度差异", whenToUse: "有独立的两组数据" },
      { testId: "cronbach", reason: "检验品牌认知量表的内部一致性", whenToUse: "使用多题项量表测量认知度" },
      { testId: "descriptive", reason: "了解各维度的基本分布情况", whenToUse: "任何情况，作为第一步" },
    ],
    sampleDataStructure: {
      columns: [
        { name: "participant_id", type: "numeric", description: "被试编号" },
        { name: "group", type: "categorical", description: "组别（实验组/对照组）" },
        { name: "pre_awareness_1", type: "likert", description: "广告前认知度题项1（1-7）" },
        { name: "pre_awareness_2", type: "likert", description: "广告前认知度题项2（1-7）" },
        { name: "pre_awareness_3", type: "likert", description: "广告前认知度题项3（1-7）" },
        { name: "post_awareness_1", type: "likert", description: "广告后认知度题项1（1-7）" },
        { name: "post_awareness_2", type: "likert", description: "广告后认知度题项2（1-7）" },
        { name: "post_awareness_3", type: "likert", description: "广告后认知度题项3（1-7）" },
      ],
      sampleRows: 200,
    },
    interpretationGuide: {
      keyMetrics: ["Cohen's d（效应量）", "p 值（显著性）", "均值差", "置信区间"],
      whatToLookFor: ["前后测均值是否有显著差异", "效应量是否达到中等以上（d>0.5）", "置信区间是否不包含0"],
      commonPitfalls: ["混淆统计显著性与实际意义", "忽略效应量只看 p 值", "样本量过小导致检验力不足"],
    },
    references: [
      { title: "Measuring Brand Awareness", authors: "Aaker, D.A.", year: 1996, journal: "Journal of Marketing Research" },
      { title: "The Effect of Advertising on Brand Awareness", authors: "Keller, K.L.", year: 2001, journal: "Journal of Consumer Psychology" },
    ],
    workflow: [
      { step: 1, action: "清洗数据，检查缺失值", tool: "/workspace/data-clean" },
      { step: 2, action: "计算量表均值（多题项合并）", tool: "/workspace/data-clean" },
      { step: 3, action: "检验量表信度（Cronbach's α）", tool: "/workspace/statistics" },
      { step: 4, action: "进行配对 t 检验或独立 t 检验", tool: "/workspace/statistics" },
      { step: 5, action: "查看效应量和置信区间", tool: "/workspace/statistics" },
      { step: 6, action: "导出 APA 格式结果", tool: "/workspace/statistics" },
    ],
  },
  {
    id: "customer-satisfaction",
    name: "Customer Satisfaction (NPS/CSAT)",
    nameCN: "客户满意度分析",
    icon: "⭐",
    category: "消费者",
    scenario: "测量客户对产品/服务的满意度水平，计算 NPS 净推荐值，识别满意度驱动因素",
    description: "使用 NPS（净推荐值）和 CSAT（客户满意度评分）量化客户体验，通过回归分析识别影响满意度的关键因素。",
    recommendedTests: [
      { testId: "descriptive", reason: "了解满意度评分的整体分布", whenToUse: "任何情况，作为第一步" },
      { testId: "likert-freq", reason: "查看各满意度等级的频率分布", whenToUse: "使用 Likert 量表时" },
      { testId: "regression", reason: "识别影响满意度的关键驱动因素", whenToUse: "有多个预测变量时" },
      { testId: "pearson", reason: "检验各因素与满意度的相关性", whenToUse: "初步探索关系时" },
    ],
    sampleDataStructure: {
      columns: [
        { name: "customer_id", type: "numeric", description: "客户编号" },
        { name: "nps_score", type: "numeric", description: "NPS 评分（0-10）" },
        { name: "csat_product", type: "likert", description: "产品满意度（1-7）" },
        { name: "csat_service", type: "likert", description: "服务满意度（1-7）" },
        { name: "csat_price", type: "likert", description: "价格满意度（1-7）" },
        { name: "csat_delivery", type: "likert", description: "配送满意度（1-7）" },
        { name: "repurchase_intent", type: "likert", description: "复购意愿（1-7）" },
      ],
      sampleRows: 500,
    },
    interpretationGuide: {
      keyMetrics: ["NPS 值（推荐者%-贬损者%）", "CSAT 均值", "回归系数 β", "R²"],
      whatToLookFor: ["NPS 是否为正数（>0 为良好）", "哪个因素的 β 系数最大（最强驱动因素）", "R² 解释了多少变异"],
      commonPitfalls: ["NPS 的行业基准差异很大", "满意度数据通常偏态，需注意正态性假设", "相关不等于因果"],
    },
    references: [
      { title: "The One Number You Need to Grow", authors: "Reichheld, F.F.", year: 2003, journal: "Harvard Business Review" },
      { title: "Customer Satisfaction and Stock Prices", authors: "Fornell, C. et al.", year: 2006, journal: "Journal of Marketing" },
    ],
    workflow: [
      { step: 1, action: "上传满意度调查数据", tool: "/workspace/statistics" },
      { step: 2, action: "查看描述性统计和 Likert 频率表", tool: "/workspace/statistics" },
      { step: 3, action: "计算 NPS 值", tool: "/workspace/statistics" },
      { step: 4, action: "进行相关分析和回归分析", tool: "/workspace/statistics" },
      { step: 5, action: "识别关键驱动因素", tool: "/workspace/statistics" },
    ],
  },
  {
    id: "ab-testing",
    name: "A/B Testing Analysis",
    nameCN: "A/B 测试分析",
    icon: "🧪",
    category: "产品",
    scenario: "比较两个或多个版本（网页、广告、定价）的效果差异，确定最优方案",
    description: "通过随机对照实验设计，量化不同版本之间的转化率、点击率或收入差异。适用于 UI 优化、广告创意测试、定价实验。",
    recommendedTests: [
      { testId: "chi-square", reason: "比较两组的转化率差异（分类数据）", whenToUse: "结果是转化/未转化" },
      { testId: "ttest", reason: "比较两组的连续指标差异（如停留时间）", whenToUse: "结果是连续数值" },
      { testId: "fisher", reason: "小样本时的精确检验", whenToUse: "样本量<30 或期望频数<5" },
      { testId: "power", reason: "计算所需样本量", whenToUse: "实验设计阶段" },
    ],
    sampleDataStructure: {
      columns: [
        { name: "user_id", type: "numeric", description: "用户编号" },
        { name: "variant", type: "categorical", description: "版本（A/B）" },
        { name: "converted", type: "categorical", description: "是否转化（0/1）" },
        { name: "revenue", type: "numeric", description: "消费金额" },
        { name: "time_spent", type: "numeric", description: "停留时间（秒）" },
        { name: "clicks", type: "numeric", description: "点击次数" },
      ],
      sampleRows: 1000,
    },
    interpretationGuide: {
      keyMetrics: ["转化率差异", "χ² 值", "p 值", "Cramér's V（效应量）", "置信区间"],
      whatToLookFor: ["两组转化率是否有显著差异", "效应量大小（Cramér's V > 0.1 为小效应）", "实际业务意义（提升 X% 转化率值多少收入）"],
      commonPitfalls: ["多次检验需要 Bonferroni 校正", "样本量不均衡影响检验力", "不要提前停止实验（peeking problem）"],
    },
    references: [
      { title: "Trustworthy Online Controlled Experiments", authors: "Kohavi, R. et al.", year: 2020, journal: "Cambridge University Press" },
      { title: "A/B Testing: The Most Powerful Way to Turn Clicks Into Customers", authors: "Siroker, D. & Koomen, P.", year: 2013, journal: "Wiley" },
    ],
    workflow: [
      { step: 1, action: "确认实验设计（样本量、随机化）", tool: "/workspace/statistics" },
      { step: 2, action: "上传实验数据", tool: "/workspace/statistics" },
      { step: 3, action: "进行卡方检验或 t 检验", tool: "/workspace/statistics" },
      { step: 4, action: "查看效应量和置信区间", tool: "/workspace/statistics" },
      { step: 5, action: "计算功效分析（是否需要更多数据）", tool: "/workspace/statistics" },
    ],
  },
  {
    id: "market-segmentation",
    name: "Market Segmentation",
    nameCN: "市场细分分析",
    icon: "👥",
    category: "消费者",
    scenario: "基于消费者行为和态度数据，识别不同的市场细分群体",
    description: "通过聚类分析和 RFM 模型，将消费者分为不同细分群体，为精准营销提供数据支持。",
    recommendedTests: [
      { testId: "efa", reason: "提取消费者态度的潜在维度", whenToUse: "有大量态度题项需要降维" },
      { testId: "cronbach", reason: "检验各维度量表的信度", whenToUse: "确认量表可靠性" },
      { testId: "anova", reason: "比较不同细分群体在各维度上的差异", whenToUse: "已确定细分群体后" },
      { testId: "chi-square", reason: "检验细分群体与人口统计变量的关联", whenToUse: "分析群体特征时" },
    ],
    sampleDataStructure: {
      columns: [
        { name: "customer_id", type: "numeric", description: "客户编号" },
        { name: "age", type: "numeric", description: "年龄" },
        { name: "income", type: "numeric", description: "收入" },
        { name: "purchase_freq", type: "numeric", description: "购买频率" },
        { name: "avg_order_value", type: "numeric", description: "平均订单金额" },
        { name: "attitude_1", type: "likert", description: "态度题项1（1-7）" },
        { name: "attitude_2", type: "likert", description: "态度题项2（1-7）" },
        { name: "attitude_3", type: "likert", description: "态度题项3（1-7）" },
      ],
      sampleRows: 500,
    },
    interpretationGuide: {
      keyMetrics: ["KMO 值（>0.7 适合因子分析）", "Bartlett 检验 p 值", "方差解释率", "因子载荷"],
      whatToLookFor: ["KMO 是否大于 0.7", "提取的因子能解释多少总方差", "各题项在目标因子上的载荷是否大于 0.5"],
      commonPitfalls: ["因子数量选择需结合碎石图和理论", "旋转方法选择影响解释", "样本量至少是题项数的 5 倍"],
    },
    references: [
      { title: "Market Segmentation", authors: "Wedel, M. & Kamakura, W.A.", year: 2000, journal: "Springer" },
      { title: "Consumer Behavior", authors: "Solomon, M.R.", year: 2019, journal: "Pearson" },
    ],
    workflow: [
      { step: 1, action: "清洗数据，处理缺失值", tool: "/workspace/data-clean" },
      { step: 2, action: "进行探索性因子分析（EFA）", tool: "/workspace/statistics" },
      { step: 3, action: "检验各维度信度", tool: "/workspace/statistics" },
      { step: 4, action: "使用聚类分析识别细分群体", tool: "/workspace/statistics" },
      { step: 5, action: "比较各群体特征（ANOVA + 卡方）", tool: "/workspace/statistics" },
    ],
  },
  {
    id: "price-sensitivity",
    name: "Price Sensitivity Analysis",
    nameCN: "价格敏感度分析",
    icon: "💰",
    category: "定价",
    scenario: "确定消费者对价格的敏感程度，找到最优定价点",
    description: "使用 Van Westendorp 价格敏感度模型或联合分析，量化消费者对不同价格水平的接受度。",
    recommendedTests: [
      { testId: "conjoint", reason: "联合分析评估价格与其他属性的权衡", whenToUse: "需要考虑多属性决策时" },
      { testId: "descriptive", reason: "了解价格接受度的基本分布", whenToUse: "任何情况" },
      { testId: "regression", reason: "分析价格对购买意愿的影响", whenToUse: "有连续价格数据时" },
      { testId: "anova", reason: "比较不同价格水平的购买意愿差异", whenToUse: "有多个价格水平时" },
    ],
    sampleDataStructure: {
      columns: [
        { name: "respondent_id", type: "numeric", description: "受访者编号" },
        { name: "too_cheap", type: "numeric", description: "太便宜的价格（元）" },
        { name: "cheap", type: "numeric", description: "便宜的价格（元）" },
        { name: "expensive", type: "numeric", description: "贵的价格（元）" },
        { name: "too_expensive", type: "numeric", description: "太贵的价格（元）" },
        { name: "purchase_intent", type: "likert", description: "购买意愿（1-7）" },
      ],
      sampleRows: 300,
    },
    interpretationGuide: {
      keyMetrics: ["最优价格点（PMC）", "可接受价格范围", "价格弹性系数"],
      whatToLookFor: ["PMC（Point of Marginal Cheapness）在哪里", "PME（Point of Marginal Expensiveness）在哪里", "可接受价格范围是否足够宽"],
      commonPitfalls: ["假设消费者能准确报告价格偏好", "忽略竞争产品价格", "价格敏感度因细分群体而异"],
    },
    references: [
      { title: "Measuring Price Sensitivity", authors: "Van Westendorp, P.", year: 1976, journal: "ESOMAR Congress" },
      { title: "Conjoint Analysis in Marketing", authors: "Green, P.E. & Srinivasan, V.", year: 1990, journal: "Journal of Marketing" },
    ],
    workflow: [
      { step: 1, action: "上传价格调查数据", tool: "/workspace/statistics" },
      { step: 2, action: "查看描述性统计", tool: "/workspace/statistics" },
      { step: 3, action: "进行联合分析（如适用）", tool: "/workspace/statistics" },
      { step: 4, action: "进行回归分析", tool: "/workspace/statistics" },
    ],
  },
  {
    id: "ad-effectiveness",
    name: "Advertising Effectiveness",
    nameCN: "广告效果评估",
    icon: "📢",
    category: "广告",
    scenario: "评估广告活动的传播效果、态度影响和行为转化",
    description: "综合评估广告的注意力、记忆度、态度改变和购买行为，建立广告效果的因果链条。",
    recommendedTests: [
      { testId: "mediation", reason: "检验广告→态度→购买的中介路径", whenToUse: "有理论假设的中介效应" },
      { testId: "moderation", reason: "检验不同人群的广告效果差异", whenToUse: "假设效果因人群而异" },
      { testId: "repeated-anova", reason: "比较广告暴露前后的态度变化", whenToUse: "有多时间点的测量" },
      { testId: "regression", reason: "分析广告频次对购买意愿的影响", whenToUse: "有连续的广告暴露数据" },
    ],
    sampleDataStructure: {
      columns: [
        { name: "participant_id", type: "numeric", description: "被试编号" },
        { name: "ad_exposure", type: "numeric", description: "广告暴露次数" },
        { name: "attention", type: "likert", description: "注意力（1-7）" },
        { name: "recall", type: "likert", description: "品牌回忆（1-7）" },
        { name: "attitude_pre", type: "likert", description: "广告前态度（1-7）" },
        { name: "attitude_post", type: "likert", description: "广告后态度（1-7）" },
        { name: "purchase_intent", type: "likert", description: "购买意愿（1-7）" },
        { name: "age_group", type: "categorical", description: "年龄组" },
      ],
      sampleRows: 300,
    },
    interpretationGuide: {
      keyMetrics: ["中介效应大小", "间接效应置信区间", "调节效应交互项 p 值", "简单斜率"],
      whatToLookFor: ["间接效应的置信区间是否不包含0", "调节效应是否显著（交互项 p<.05）", "不同组别的简单斜率方向和大小"],
      commonPitfalls: ["中介效应需要理论支撑", "样本量要求较高（>200）", "调节效应需要中心化处理"],
    },
    references: [
      { title: "Introduction to Mediation, Moderation, and Conditional Process Analysis", authors: "Hayes, A.F.", year: 2022, journal: "Guilford Press" },
      { title: "Advertising Effectiveness", authors: "Tellis, G.J.", year: 2004, journal: "Journal of Advertising Research" },
    ],
    workflow: [
      { step: 1, action: "上传广告实验数据", tool: "/workspace/statistics" },
      { step: 2, action: "检验量表信度", tool: "/workspace/statistics" },
      { step: 3, action: "进行中介效应分析", tool: "/workspace/statistics" },
      { step: 4, action: "进行调节效应分析", tool: "/workspace/statistics" },
      { step: 5, action: "使用 PROCESS 模型进行综合分析", tool: "/workspace/empirical" },
    ],
  },
  {
    id: "consumer-behavior-funnel",
    name: "Consumer Behavior Funnel",
    nameCN: "消费者行为漏斗",
    icon: "🔽",
    category: "消费者",
    scenario: "分析消费者从认知到购买的行为转化路径",
    description: "构建 AIDA（注意→兴趣→欲望→行动）漏斗，识别各阶段的转化率和流失原因。",
    recommendedTests: [
      { testId: "chi-square", reason: "检验各阶段转化率的差异", whenToUse: "比较不同渠道/人群的转化率" },
      { testId: "logistic", reason: "预测哪些因素影响转化", whenToUse: "有多个预测变量" },
      { testId: "regression", reason: "分析各阶段的影响因素", whenToUse: "结果是连续变量" },
      { testId: "descriptive", reason: "了解各阶段的基本情况", whenToUse: "任何情况" },
    ],
    sampleDataStructure: {
      columns: [
        { name: "user_id", type: "numeric", description: "用户编号" },
        { name: "channel", type: "categorical", description: "来源渠道" },
        { name: "awareness", type: "categorical", description: "是否认知（0/1）" },
        { name: "interest", type: "categorical", description: "是否产生兴趣（0/1）" },
        { name: "desire", type: "categorical", description: "是否有购买欲望（0/1）" },
        { name: "action", type: "categorical", description: "是否购买（0/1）" },
        { name: "time_to_convert", type: "numeric", description: "转化时间（天）" },
      ],
      sampleRows: 1000,
    },
    interpretationGuide: {
      keyMetrics: ["各阶段转化率", "流失率", "OR 值（优势比）", "转化时间中位数"],
      whatToLookFor: ["哪个阶段流失最严重", "哪些因素显著影响转化（OR>1）", "不同渠道的转化路径差异"],
      commonPitfalls: ["漏斗数据可能存在选择偏差", "忽略时间因素", "多触点归因问题"],
    },
    references: [
      { title: "Consumer Behavior: Buying, Having, and Being", authors: "Solomon, M.R.", year: 2019, journal: "Pearson" },
      { title: "Marketing Funnel Optimization", authors: "Court, D. et al.", year: 2009, journal: "McKinsey Quarterly" },
    ],
    workflow: [
      { step: 1, action: "上传行为数据", tool: "/workspace/statistics" },
      { step: 2, action: "计算各阶段转化率", tool: "/workspace/statistics" },
      { step: 3, action: "进行 Logistic 回归", tool: "/workspace/statistics" },
      { step: 4, action: "使用用户行为分析工具", tool: "/workspace/user-behavior" },
    ],
  },
  {
    id: "scale-development",
    name: "Scale Development & Validation",
    nameCN: "量表开发与验证",
    icon: "📏",
    category: "消费者",
    scenario: "开发新的测量量表并验证其信度和效度",
    description: "通过 EFA/CFA 两步法开发和验证量表，确保测量工具的科学性。",
    recommendedTests: [
      { testId: "efa", reason: "探索性因子分析确定因子结构", whenToUse: "量表开发初期" },
      { testId: "cfa", reason: "验证性因子分析验证因子结构", whenToUse: "量表验证阶段" },
      { testId: "cronbach", reason: "检验内部一致性信度", whenToUse: "任何阶段" },
      { testId: "cr-ave", reason: "检验收敛效度（CR>0.7, AVE>0.5）", whenToUse: "验证阶段" },
      { testId: "htmt", reason: "检验区别效度（HTMT<0.85）", whenToUse: "有多个构念时" },
      { testId: "item-analysis", reason: "题项分析（鉴别度、item-total 相关）", whenToUse: "筛选题项时" },
    ],
    sampleDataStructure: {
      columns: [
        { name: "respondent_id", type: "numeric", description: "受访者编号" },
        { name: "item_1", type: "likert", description: "题项1（1-7）" },
        { name: "item_2", type: "likert", description: "题项2（1-7）" },
        { name: "item_3", type: "likert", description: "题项3（1-7）" },
        { name: "item_4", type: "likert", description: "题项4（1-7）" },
        { name: "item_5", type: "likert", description: "题项5（1-7）" },
      ],
      sampleRows: 300,
    },
    interpretationGuide: {
      keyMetrics: ["KMO 值", "Cronbach's α", "CR", "AVE", "HTMT", "因子载荷"],
      whatToLookFor: ["KMO>0.7", "α>0.7", "CR>0.7", "AVE>0.5", "HTMT<0.85", "因子载荷>0.5"],
      commonPitfalls: ["EFA 和 CFA 需要不同样本", "样本量至少是题项数的 10 倍", "反向题需要先反向编码"],
    },
    references: [
      { title: "Scale Development", authors: "DeVellis, R.F.", year: 2016, journal: "SAGE" },
      { title: "SEM with Latent Variables", authors: "Bollen, K.A.", year: 1989, journal: "Wiley" },
    ],
    workflow: [
      { step: 1, action: "收集数据（N≥300）", tool: "外部工具" },
      { step: 2, action: "进行项目分析", tool: "/workspace/statistics" },
      { step: 3, action: "进行 EFA（样本1）", tool: "/workspace/statistics" },
      { step: 4, action: "进行 CFA（样本2）", tool: "/workspace/statistics" },
      { step: 5, action: "检验信效度（CR/AVE/HTMT）", tool: "/workspace/statistics" },
      { step: 6, action: "使用 SEM 验证模型", tool: "/workspace/sem" },
    ],
  },
  {
    id: "social-media-sentiment",
    name: "Social Media Sentiment Analysis",
    nameCN: "社媒情感分析",
    icon: "💬",
    category: "渠道",
    scenario: "分析社交媒体上的品牌口碑和消费者情感",
    description: "通过 NLP 技术分析社媒评论的情感倾向、主题分布和关键观点。",
    recommendedTests: [
      { testId: "descriptive", reason: "了解情感分数的整体分布", whenToUse: "任何情况" },
      { testId: "ttest", reason: "比较不同品牌/产品的情感差异", whenToUse: "有两组数据" },
      { testId: "anova", reason: "比较多组的情感差异", whenToUse: "有三组以上" },
      { testId: "chi-square", reason: "检验情感类别与品牌的关联", whenToUse: "分类数据" },
    ],
    sampleDataStructure: {
      columns: [
        { name: "comment_id", type: "numeric", description: "评论编号" },
        { name: "platform", type: "categorical", description: "平台（微博/小红书/抖音）" },
        { name: "brand", type: "categorical", description: "品牌" },
        { name: "text", type: "categorical", description: "评论文本" },
        { name: "sentiment_score", type: "numeric", description: "情感分数（-1 到 1）" },
        { name: "sentiment_label", type: "categorical", description: "情感类别（正面/中性/负面）" },
      ],
      sampleRows: 500,
    },
    interpretationGuide: {
      keyMetrics: ["情感分数均值", "正面/负面比例", "情感极性分布"],
      whatToLookFor: ["情感分数是否显著偏向正面或负面", "不同平台的情感差异", "负面评论的主要主题"],
      commonPitfalls: ["NLP 模型对中文的支持可能不够好", "讽刺和反语难以识别", "样本可能不代表整体"],
    },
    references: [
      { title: "Sentiment Analysis and Opinion Mining", authors: "Liu, B.", year: 2012, journal: "Morgan & Claypool" },
      { title: "Social Media Analytics", authors: "Zeng, D. et al.", year: 2010, journal: "IEEE Intelligent Systems" },
    ],
    workflow: [
      { step: 1, action: "上传社媒评论数据", tool: "/workspace/sentiment" },
      { step: 2, action: "进行情感分析", tool: "/workspace/sentiment" },
      { step: 3, action: "进行统计检验", tool: "/workspace/statistics" },
      { step: 4, action: "可视化情感分布", tool: "/workspace/statistics" },
    ],
  },
  {
    id: "conjoint-analysis",
    name: "Conjoint Analysis",
    nameCN: "联合分析",
    icon: "🎯",
    category: "产品",
    scenario: "评估消费者对产品属性的偏好和权衡",
    description: "通过正交设计和联合分析，量化各产品属性的效用值和相对重要性。",
    recommendedTests: [
      { testId: "conjoint", reason: "计算各属性水平的效用值", whenToUse: "有正交设计数据" },
      { testId: "maxdiff", reason: "最好-最差评分法", whenToUse: "简化版偏好测量" },
      { testId: "descriptive", reason: "了解各属性的重要性分布", whenToUse: "任何情况" },
      { testId: "regression", reason: "分析属性对偏好的影响", whenToUse: "有连续数据时" },
    ],
    sampleDataStructure: {
      columns: [
        { name: "respondent_id", type: "numeric", description: "受访者编号" },
        { name: "profile_1", type: "likert", description: "产品组合1评分（1-7）" },
        { name: "profile_2", type: "likert", description: "产品组合2评分（1-7）" },
        { name: "profile_3", type: "likert", description: "产品组合3评分（1-7）" },
        { name: "profile_4", type: "likert", description: "产品组合4评分（1-7）" },
        { name: "profile_5", type: "likert", description: "产品组合5评分（1-7）" },
      ],
      sampleRows: 200,
    },
    interpretationGuide: {
      keyMetrics: ["效用值", "属性重要性百分比", "模型拟合度"],
      whatToLookFor: ["哪个属性的重要性最高", "各属性水平的效用值排序", "模型是否拟合数据"],
      commonPitfalls: ["正交设计需要专业设置", "假设属性效用可加", "忽略交互效应"],
    },
    references: [
      { title: "Conjoint Analysis in Marketing", authors: "Green, P.E. & Srinivasan, V.", year: 1990, journal: "Journal of Marketing" },
      { title: "MaxDiff Analysis", authors: "Orme, B.K.", year: 2010, journal: "Sawtooth Software" },
    ],
    workflow: [
      { step: 1, action: "设计正交实验", tool: "外部工具" },
      { step: 2, action: "收集偏好数据", tool: "外部工具" },
      { step: 3, action: "进行联合分析", tool: "/workspace/statistics" },
      { step: 4, action: "查看效用值和重要性", tool: "/workspace/statistics" },
    ],
  },
];

export function getTemplateById(id: string): MarketingTemplate | undefined {
  return MARKETING_TEMPLATES.find((t) => t.id === id);
}

export function getTemplatesByCategory(category: string): MarketingTemplate[] {
  return MARKETING_TEMPLATES.filter((t) => t.category === category);
}

export const TEMPLATE_CATEGORIES = [...new Set(MARKETING_TEMPLATES.map((t) => t.category))];
