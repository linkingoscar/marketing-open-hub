export interface SampleDataset {
  id: string;
  name: string;
  nameCN: string;
  description: string;
  rows: number;
  columns: string[];
  category: string;
  source: string;
  useCase: string;
}

export const SAMPLE_DATASETS: SampleDataset[] = [
  {
    id: "customer-survey",
    name: "Customer Satisfaction Survey",
    nameCN: "客户满意度问卷",
    description: "Likert 7 级量表问卷数据，包含品牌信任、感知价值、购买意愿等构念",
    rows: 500,
    columns: ["id", "age", "gender", "income", "trust_1", "trust_2", "trust_3", "pv_1", "pv_2", "pv_3", "purchase_intent", "satisfaction", "loyalty"],
    category: "问卷",
    source: "模拟数据",
    useCase: "信效度检验、SEM、中介调节分析",
  },
  {
    id: "ab-test",
    name: "A/B Test Results",
    nameCN: "A/B 测试结果",
    description: "电商 A/B 测试数据：对照组 vs 实验组的转化率、客单价、停留时长",
    rows: 2000,
    columns: ["user_id", "group", "converted", "revenue", "time_on_page", "pages_viewed", "device", "source"],
    category: "实验",
    source: "模拟数据",
    useCase: "t 检验、卡方检验、Uplift 建模",
  },
  {
    id: "ecommerce-transactions",
    name: "E-commerce Transactions",
    nameCN: "电商交易数据",
    description: "客户交易记录：用户ID、日期、金额、品类，适用于 RFM 和 CLV 分析",
    rows: 5000,
    columns: ["customer_id", "order_date", "amount", "category", "payment_method", "is_repeat"],
    category: "交易",
    source: "模拟数据",
    useCase: "RFM 分群、CLV 预测、留存分析",
  },
  {
    id: "social-media-reviews",
    name: "Social Media Reviews",
    nameCN: "社媒评论数据",
    description: "中英文产品评论数据，带情感标签和品牌字段",
    rows: 1000,
    columns: ["id", "platform", "brand", "text", "rating", "date", "language"],
    category: "社媒",
    source: "模拟数据",
    useCase: "情感分析、主题提取、品牌监测",
  },
  {
    id: "marketing-mix",
    name: "Marketing Spend Data",
    nameCN: "营销支出数据",
    description: "各渠道营销支出 + 销售额时间序列，适用于 MMM 建模",
    rows: 104,
    columns: ["week", "tv_spend", "digital_spend", "social_spend", "search_spend", "sales", "price", "promotions"],
    category: "营销",
    source: "模拟数据",
    useCase: "营销组合建模、因果推断、时间序列分析",
  },
  {
    id: "survey-likert",
    name: "Technology Acceptance Survey",
    nameCN: "技术接受度问卷",
    description: "TAM 模型问卷：感知有用性、感知易用性、使用态度、使用意向",
    rows: 300,
    columns: ["id", "age", "education", "experience", "pu_1", "pu_2", "pu_3", "peou_1", "peou_2", "peou_3", "attitude_1", "attitude_2", "intention_1", "intention_2"],
    category: "问卷",
    source: "模拟数据",
    useCase: "EFA/CFA、SEM 路径分析、中介效应",
  },
];

export function generateSampleCSV(dataset: SampleDataset): string {
  const rng = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
  const rand = (min: number, max: number) => +(min + Math.random() * (max - min)).toFixed(2);

  const header = dataset.columns.join(",");
  const rows: string[] = [header];

  for (let i = 0; i < Math.min(dataset.rows, 200); i++) {
    const row: string[] = [];
    for (const col of dataset.columns) {
      if (col === "id" || col === "user_id" || col === "customer_id" || col === "week") {
        row.push(String(i + 1));
      } else if (col.endsWith("_1") || col.endsWith("_2") || col.endsWith("_3") || col.endsWith("_4")) {
        row.push(String(rng(1, 7)));
      } else if (col === "age") {
        row.push(String(rng(18, 65)));
      } else if (col === "gender") {
        row.push(Math.random() > 0.5 ? "M" : "F");
      } else if (col === "income") {
        row.push(String(rng(3000, 15000)));
      } else if (col === "converted" || col === "is_repeat" || col === "promotions") {
        row.push(Math.random() > 0.7 ? "1" : "0");
      } else if (col === "amount" || col === "revenue" || col === "sales") {
        row.push(String(rand(10, 500)));
      } else if (col === "rating") {
        row.push(String(rng(1, 5)));
      } else if (col.includes("spend") || col === "price") {
        row.push(String(rand(100, 10000)));
      } else if (col === "text") {
        row.push('"Sample review text for analysis"');
      } else if (col === "order_date" || col === "date") {
        const d = new Date(2024, rng(0, 11), rng(1, 28));
        row.push(d.toISOString().slice(0, 10));
      } else if (col === "group") {
        row.push(Math.random() > 0.5 ? "control" : "treatment");
      } else if (col === "platform") {
        row.push(["twitter", "reddit", "weibo", "xiaohongshu"][rng(0, 3)]);
      } else if (col === "brand") {
        row.push(["BrandA", "BrandB", "BrandC"][rng(0, 2)]);
      } else if (col === "language") {
        row.push(Math.random() > 0.5 ? "zh" : "en");
      } else if (col === "device") {
        row.push(Math.random() > 0.5 ? "mobile" : "desktop");
      } else if (col === "source") {
        row.push(["organic", "paid", "referral", "direct"][rng(0, 3)]);
      } else if (col === "category") {
        row.push(["electronics", "fashion", "food", "beauty"][rng(0, 3)]);
      } else if (col === "payment_method") {
        row.push(["credit_card", "alipay", "wechat_pay"][rng(0, 2)]);
      } else if (col === "education") {
        row.push(["high_school", "bachelor", "master", "phd"][rng(0, 3)]);
      } else if (col === "experience") {
        row.push(String(rng(0, 10)));
      } else if (col === "time_on_page") {
        row.push(String(rand(5, 300)));
      } else if (col === "pages_viewed") {
        row.push(String(rng(1, 20)));
      } else {
        row.push(String(rng(0, 100)));
      }
    }
    rows.push(row.join(","));
  }
  return rows.join("\n");
}
