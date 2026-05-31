/**
 * 统计结果注释输出系统
 * 为每种统计检验提供：通俗解释、实际意义、应用建议
 */

export interface Annotation {
  /** 一句话结论（适合直接引用） */
  oneLiner: string;
  /** 通俗解释（非统计专业人员也能理解） */
  plainExplanation: string;
  /** 实际意义（对业务/研究的启示） */
  practicalImplication: string;
  /** 应用建议（下一步该做什么） */
  actionItems: string[];
  /** 常见误读提醒 */
  caveats: string[];
}

/**
 * 根据检验类型和结果生成注释
 */
export function generateAnnotation(
  testType: string,
  result: Record<string, unknown>,
  apa: { p: string; effect?: string; conclusion: string }
): Annotation {
  const isSignificant = apa.p.includes("<") || parseFloat(String(apa.p).replace(/[<>]/g, "")) < 0.05;

  switch (testType) {
    case "descriptive":
      return {
        oneLiner: `数据的集中趋势和离散程度已计算完成。`,
        plainExplanation: `均值反映了数据的中心位置，标准差反映了数据的分散程度。标准差越大，说明个体差异越大。`,
        practicalImplication: `了解数据的基本特征，为后续分析奠定基础。`,
        actionItems: ["检查是否存在异常值", "观察分布是否近似正态", "考虑是否需要数据转换"],
        caveats: ["均值对异常值敏感，中位数更稳健", "标准差不等于标准误"],
      };

    case "normality":
      return isSignificant
        ? {
            oneLiner: `数据显著偏离正态分布（p ${apa.p}）。`,
            plainExplanation: `Shapiro-Wilk 检验表明数据不符合正态分布。这意味着后续可能需要使用非参数检验方法。`,
            practicalImplication: `如果样本量较大（>30），可以使用参数检验（中心极限定理）；如果样本量较小，建议使用非参数检验。`,
            actionItems: ["考虑使用 Mann-Whitney U 代替 t 检验", "考虑使用 Kruskal-Wallis 代替 ANOVA", "检查是否存在异常值导致偏离"],
            caveats: ["大样本时 Shapiro-Wilk 过于敏感", "轻微偏离正态对参数检验影响不大"],
          }
        : {
            oneLiner: `数据符合正态分布假设（p ${apa.p}）。`,
            plainExplanation: `Shapiro-Wilk 检验表明数据近似正态分布，可以放心使用参数检验方法。`,
            practicalImplication: `满足了使用 t 检验、ANOVA 等参数检验的前提条件。`,
            actionItems: ["可以继续使用参数检验方法", "仍需检查方差齐性假设"],
            caveats: ["正态性检验不显著不代表完全正态", "只是没有足够证据拒绝正态假设"],
          };

    case "homogeneity":
      return isSignificant
        ? {
            oneLiner: `各组方差不齐（p ${apa.p}），需使用校正方法。`,
            plainExplanation: `Levene 检验表明各组的方差差异显著。这意味着标准的 t 检验或 ANOVA 可能不适用。`,
            practicalImplication: `需要使用 Welch 校正的 t 检验或 Welch ANOVA，它们对不等方差更稳健。`,
            actionItems: ["使用 Welch t 检验代替标准 t 检验", "使用 Welch ANOVA 代替标准 ANOVA", "报告方差不齐的情况"],
            caveats: ["方差不齐可能暗示组间存在系统性差异", "检查是否有异常值影响"],
          }
        : {
            oneLiner: `各组方差齐性假设满足（p ${apa.p}）。`,
            plainExplanation: `Levene 检验表明各组方差没有显著差异，满足参数检验的方差齐性假设。`,
            practicalImplication: `可以使用标准的 t 检验或 ANOVA 方法。`,
            actionItems: ["继续使用标准参数检验", "报告 Levene 检验结果作为前提检验"],
            caveats: ["方差齐性检验不显著不代表方差完全相等"],
          };

    case "ttest":
    case "paired-ttest":
      return isSignificant
        ? {
            oneLiner: `两组均值存在显著差异（p ${apa.p}${apa.effect ? `，${apa.effect}` : ""}）。`,
            plainExplanation: `统计检验表明，两组之间的差异不太可能是由随机因素造成的。换句话说，我们有足够证据认为两组确实不同。`,
            practicalImplication: `这个差异在统计上是可信的。但还需要考虑效应量来判断差异的实际重要性。`,
            actionItems: ["报告效应量（Cohen's d）判断实际意义", "报告置信区间了解差异范围", "结合领域知识解释差异原因"],
            caveats: ["统计显著 ≠ 实际重要", "p 值不能告诉你差异有多大", "样本量越大越容易得到显著结果"],
          }
        : {
            oneLiner: `两组均值无显著差异（p ${apa.p}）。`,
            plainExplanation: `统计检验表明，没有足够证据认为两组之间存在真实差异。观察到的差异可能只是随机波动。`,
            practicalImplication: `不能断言两组不同，但也需要注意检验力是否足够。`,
            actionItems: ["检查样本量是否足够（功效分析）", "报告效应量和置信区间", "考虑是否存在其他解释"],
            caveats: ["不显著 ≠ 没有差异（可能是检验力不足）", "不能接受零假设（只能说没有足够证据拒绝）"],
          };

    case "anova":
      return isSignificant
        ? {
            oneLiner: `多组均值存在显著差异（p ${apa.p}${apa.effect ? `，${apa.effect}` : ""}）。`,
            plainExplanation: `ANOVA 检验表明，至少有一组的均值与其他组不同。但这不能告诉我们具体哪两组不同。`,
            practicalImplication: `需要进行事后比较（如 Tukey HSD）来确定具体哪些组之间存在差异。`,
            actionItems: ["进行 Tukey HSD 事后比较", "报告各组的均值和标准差", "报告效应量（η²）"],
            caveats: ["ANOVA 只告诉你'至少有一组不同'，不告诉你哪组", "需要事后检验才能做具体比较"],
          }
        : {
            oneLiner: `多组均值无显著差异（p ${apa.p}）。`,
            plainExplanation: `ANOVA 检验表明，没有足够证据认为各组之间存在真实差异。`,
            practicalImplication: `各组可能没有区别，但也可能是检验力不足。`,
            actionItems: ["检查样本量和检验力", "报告效应量", "考虑是否有理论原因预期差异"],
            caveats: ["不显著不代表各组完全相同", "检查各组样本量是否均衡"],
          };

    case "chi-square":
      return isSignificant
        ? {
            oneLiner: `两个分类变量之间存在显著关联（p ${apa.p}）。`,
            plainExplanation: `卡方检验表明，两个变量不是独立的——一个变量的变化与另一个变量的变化有关联。`,
            practicalImplication: `可以基于一个变量来预测另一个变量的分布。但关联不等于因果。`,
            actionItems: ["报告 Cramér's V 判断关联强度", "检查标准化残差找出主要贡献单元", "结合领域知识解释关联原因"],
            caveats: ["关联 ≠ 因果", "卡方检验对样本量敏感", "期望频数<5 时应使用 Fisher 精确检验"],
          }
        : {
            oneLiner: `两个分类变量之间无显著关联（p ${apa.p}）。`,
            plainExplanation: `卡方检验表明，没有足够证据认为两个变量之间存在关联。`,
            practicalImplication: `两个变量可能是独立的。`,
            actionItems: ["检查样本量是否足够", "报告 Cramér's V", "考虑是否有理论原因预期关联"],
            caveats: ["不显著不代表完全独立", "小样本时检验力可能不足"],
          };

    case "pearson":
    case "spearman": {
      const r = result.r ?? result.rho ?? result.correlation;
      const rNum = typeof r === "number" ? r : parseFloat(String(r));
      const strength = Math.abs(rNum) >= 0.7 ? "强" : Math.abs(rNum) >= 0.4 ? "中等" : Math.abs(rNum) >= 0.2 ? "弱" : "极弱";
      const direction = rNum > 0 ? "正" : "负";

      return isSignificant
        ? {
            oneLiner: `两变量存在显著的${direction}相关（r = ${r}，p ${apa.p}）。`,
            plainExplanation: `当一个变量增大时，另一个变量也倾向于${rNum > 0 ? "增大" : "减小"}。相关系数为 ${r}，属于${strength}相关。`,
            practicalImplication: `两个变量之间存在${strength}的${direction}线性关系。相关系数的平方（r² = ${(rNum * rNum).toFixed(3)}）表示一个变量能解释另一个变量 ${(rNum * rNum * 100).toFixed(1)}% 的变异。`,
            actionItems: ["报告相关系数和置信区间", "绘制散点图可视化关系", "注意相关不等于因果"],
            caveats: ["相关 ≠ 因果", "可能受第三变量影响", "Pearson 要求线性关系和正态分布"],
          }
        : {
            oneLiner: `两变量无显著相关（r = ${r}，p ${apa.p}）。`,
            plainExplanation: `没有足够证据认为两个变量之间存在线性相关关系。`,
            practicalImplication: `两个变量可能没有线性关系，但可能存在非线性关系。`,
            actionItems: ["绘制散点图检查非线性关系", "检查样本量和检验力", "考虑是否有理论原因预期相关"],
            caveats: ["不显著不代表没有关系（可能是非线性）", "相关系数只衡量线性关系"],
          };
    }

    case "regression": {
      const r2 = result.rSquared ?? result["R²"] ?? result.r2;
      return isSignificant
        ? {
            oneLiner: `回归模型显著（p ${apa.p}，R² = ${r2}）。`,
            plainExplanation: `自变量能够显著预测因变量的变化。R² 表示模型能解释因变量 ${typeof r2 === "number" ? (r2 * 100).toFixed(1) : r2}% 的变异。`,
            practicalImplication: `模型有预测能力，可以用来解释或预测因变量的变化。`,
            actionItems: ["检查各预测变量的系数和显著性", "检查 VIF 排除多重共线性", "检查残差图验证模型假设"],
            caveats: ["R² 高不代表模型好（可能过拟合）", "回归系数不代表因果", "需要检查多重共线性"],
          }
        : {
            oneLiner: `回归模型不显著（p ${apa.p}）。`,
            plainExplanation: `自变量无法显著预测因变量的变化。模型的预测能力很弱。`,
            practicalImplication: `当前的自变量组合不适合预测因变量。`,
            actionItems: ["考虑增加或更换预测变量", "检查变量间是否存在非线性关系", "检查样本量是否足够"],
            caveats: ["不显著可能是样本量不足", "可能存在非线性关系未被捕捉"],
          };
    }

    case "cronbach": {
      const alpha = result.alpha ?? result.cronbachAlpha;
      const alphaNum = typeof alpha === "number" ? alpha : parseFloat(String(alpha));
      const quality = alphaNum >= 0.9 ? "优秀" : alphaNum >= 0.8 ? "良好" : alphaNum >= 0.7 ? "可接受" : alphaNum >= 0.6 ? "可疑" : "不可接受";

      return {
        oneLiner: `量表信度${quality}（α = ${alpha}）。`,
        plainExplanation: `Cronbach's α 系数为 ${alpha}，表示量表的内部一致性${quality}。α 越接近 1，说明各题项测量的是同一个构念。`,
        practicalImplication: `${alphaNum >= 0.7 ? "量表信度达标，可以放心使用。" : "量表信度不足，需要改进。"}`,
        actionItems: alphaNum >= 0.7
          ? ["报告 α 值和置信区间", "检查删除某题后 α 是否提高", "考虑是否需要更多题项"]
          : ["检查哪些题项拉低了 α", "考虑删除 item-total 相关低的题项", "增加题项数量"],
        caveats: ["α 高不代表效度好（可能只是题项多）", "α 对题项数量敏感", "单维度假设需要验证"],
      };
    }

    case "efa": {
      const kmo = result.kmo;
      const kmoNum = typeof kmo === "number" ? kmo : parseFloat(String(kmo));
      const kmoQuality = kmoNum >= 0.9 ? "极好" : kmoNum >= 0.8 ? "良好" : kmoNum >= 0.7 ? "适合" : kmoNum >= 0.6 ? "一般" : "不适合";

      return {
        oneLiner: `因子分析可行（KMO = ${kmo}，${kmoQuality}）。`,
        plainExplanation: `KMO 值为 ${kmo}，表示数据${kmoQuality}进行因子分析。Bartlett 检验显著说明变量间存在足够的共同变异。`,
        practicalImplication: `可以进行因子分析来降维和提取消费者态度/行为的潜在维度。`,
        actionItems: ["根据碎石图和理论确定因子数量", "检查各题项的因子载荷", "考虑旋转方法（Varimax/Promax）", "为每个因子命名"],
        caveats: ["因子数量选择需要结合理论", "旋转方法影响因子解释", "样本量至少是题项数的 5 倍"],
      };
    }

    case "cfa": {
      const rmsea = result.rmsea;
      const cfi = result.cfi;
      const srmr = result.srmr;
      const rmseaOk = typeof rmsea === "number" && rmsea < 0.08;
      const cfiOk = typeof cfi === "number" && cfi > 0.9;
      const srmrOk = typeof srmr === "number" && srmr < 0.08;
      const fitOk = rmseaOk && cfiOk && srmrOk;

      return {
        oneLiner: `模型拟合${fitOk ? "良好" : "需要改进"}（RMSEA=${rmsea}, CFI=${cfi}, SRMR=${srmr}）。`,
        plainExplanation: `RMSEA=${rmsea}（${rmseaOk ? "<0.08 良好" : "≥0.08 需改进"}），CFI=${cfi}（${cfiOk ? ">0.9 良好" : "≤0.9 需改进"}），SRMR=${srmr}（${srmrOk ? "<0.08 良好" : "≥0.08 需改进"}）。`,
        practicalImplication: fitOk ? "模型与数据拟合良好，验证了理论结构。" : "模型拟合不理想，需要根据修正指数调整。",
        actionItems: fitOk
          ? ["报告三个拟合指标", "报告标准化载荷", "检查信效度"]
          : ["检查修正指数（MI）", "考虑删除载荷低的题项", "检查交叉载荷", "考虑修改模型结构"],
        caveats: ["拟合指标需要综合判断", "不能只看一个指标", "修正需要有理论依据"],
      };
    }

    case "mediation": {
      const indirectEffect = result.indirectEffect ?? result.ab;
      const ciLower = result.ciLower;
      const ciUpper = result.ciUpper;
      const mediated = typeof ciLower === "number" && typeof ciUpper === "number" && (ciLower > 0 || ciUpper < 0);

      return {
        oneLiner: `中介效应${mediated ? "显著" : "不显著"}（间接效应 = ${indirectEffect}）。`,
        plainExplanation: mediated
          ? `中介变量确实传递了自变量对因变量的影响。换句话说，自变量通过影响中介变量，进而影响了因变量。`
          : `没有足够证据认为中介变量传递了自变量对因变量的影响。`,
        practicalImplication: mediated
          ? `存在中介效应，说明影响机制是"自变量→中介→因变量"。`
          : `可能不存在中介效应，或需要更大样本量来检测。`,
        actionItems: ["报告直接效应、间接效应和总效应", "报告间接效应的置信区间", "绘制路径图", "解释中介机制的理论意义"],
        caveats: ["中介效应需要理论支撑", "Baron-Kenny 方法已被批评", "Bootstrap 方法更稳健"],
      };
    }

    case "moderation": {
      const interactionP = result.interactionP ?? result.p_interaction;
      const moderated = typeof interactionP === "number" ? interactionP < 0.05 : isSignificant;

      return {
        oneLiner: `调节效应${moderated ? "显著" : "不显著"}（交互项 p = ${interactionP}）。`,
        plainExplanation: moderated
          ? `自变量对因变量的影响程度取决于调节变量的水平。换句话说，在不同条件下，效应大小不同。`
          : `没有足够证据认为调节变量改变了自变量的效应。`,
        practicalImplication: moderated
          ? `需要进行简单斜率分析，看在调节变量的不同水平下，自变量的效应如何变化。`
          : `自变量的效应在不同条件下可能是一致的。`,
        actionItems: moderated
          ? ["进行简单斜率分析", "绘制交互效应图", "解释在不同条件下的效应差异"]
          : ["报告交互项结果", "检查是否有其他可能的调节变量", "考虑非线性调节"],
        caveats: ["交互项需要中心化处理", "调节效应的解释需要结合理论", "简单斜率分析需要选择有代表性的调节变量水平"],
      };
    }

    case "power":
      return {
        oneLiner: `所需样本量为 ${result.requiredN ?? result.n}。`,
        plainExplanation: `功效分析表明，在给定的效应量和显著性水平下，需要至少 ${result.requiredN ?? result.n} 个样本才能有 80% 的概率检测到真实效应。`,
        practicalImplication: `确保研究有足够的检验力，避免浪费资源或错过真实效应。`,
        actionItems: ["确保实际样本量达到要求", "如果样本量不足，考虑降低效应量预期", "报告功效分析结果"],
        caveats: ["功效分析依赖于效应量估计", "实际效应可能与预期不同", "80% 功效是最低标准"],
      };

    case "effect-size":
      return {
        oneLiner: `效应量为 ${result.cohensD ?? result.etaSquared ?? result.omegaSquared ?? result.fSquared}。`,
        plainExplanation: `效应量告诉你差异或关系的"大小"，不受样本量影响。这是判断实际重要性的关键指标。`,
        practicalImplication: `效应量比 p 值更能说明实际意义。小效应不等于不重要，大效应也不一定有实际价值。`,
        actionItems: ["报告效应量和置信区间", "与领域内的典型效应量比较", "结合实际背景解释效应大小"],
        caveats: ["效应量的大小标准因领域而异", "Cohen's d: 0.2 小/0.5 中/0.8 大", "η²: 0.01 小/0.06 中/0.14 大"],
      };

    case "bayes-ttest":
    case "bayes-correlation": {
      const bf = result.bf10 ?? result.bayesFactor;
      const bfNum = typeof bf === "number" ? bf : parseFloat(String(bf));
      const evidence = bfNum > 100 ? "极强" : bfNum > 30 ? "很强" : bfNum > 10 ? "强" : bfNum > 3 ? "中等" : bfNum > 1 ? "弱" : "不支持";

      return {
        oneLiner: `贝叶斯因子 BF₁₀ = ${bf}，${evidence}支持备择假设。`,
        plainExplanation: `贝叶斯因子为 ${bf}，表示数据支持"存在效应"的程度是"不存在效应"的 ${bfNum.toFixed(1)} 倍。`,
        practicalImplication: `${evidence === "不支持" ? "数据不支持存在效应。" : `数据${evidence}支持存在效应。`}`,
        actionItems: ["报告 BF₁₀ 和证据强度分级", "与频率学派结果对比", "考虑先验敏感性分析"],
        caveats: ["贝叶斯因子不是概率", "BF=1 表示数据不支持任何一方", "先验选择影响结果"],
      };
    }

    default:
      return {
        oneLiner: apa.conclusion,
        plainExplanation: `统计检验已完成，请查看具体的统计量和 p 值。`,
        practicalImplication: `根据结果决定是否支持研究假设。`,
        actionItems: ["报告统计量和 p 值", "报告效应量", "结合领域知识解释结果"],
        caveats: ["统计显著 ≠ 实际重要", "p 值不是效应大小的指标", "需要考虑检验力"],
      };
  }
}
