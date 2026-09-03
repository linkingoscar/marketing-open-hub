import { describe, it, expect } from "vitest";
import { POST } from "@/app/api/chat/route";
import { NextRequest } from "next/server";
import { runDescriptive, runTTest, runAnova, runCronbach, formatAPAText } from "@/lib/statistics";

describe("End-to-End Research Golden Paths (OSQ-015)", () => {
  describe("Golden Path 1: CSV Ingestion -> Descriptive Analysis -> APA Export", () => {
    it("processes simulated survey responses and formats APA report", () => {
      // Simulated 10 respondent ratings on a 7-point Likert scale
      const satisfactionRatings = [5, 6, 7, 4, 6, 5, 7, 6, 5, 6];

      const result = runDescriptive(satisfactionRatings);

      expect(result.stats.N).toBe(10);
      expect(result.stats.Mean).toBe(5.7);
      expect(result.stats.Min).toBe(4);
      expect(result.stats.Max).toBe(7);

      const apaText = formatAPAText(result.apa);
      expect(apaText).toContain("描述性统计");
      expect(apaText).toContain("M = 5.70");
      expect(apaText).toContain("有效观测值");
    });
  });

  describe("Golden Path 2: Two-Group A/B Testing -> Independent t-Test -> APA Formatter", () => {
    it("accurately handles A/B test conversion comparison", () => {
      // Group A (Control): 8 sessions
      const groupA = [12, 14, 15, 11, 13, 16, 12, 14];
      // Group B (Variant): 8 sessions
      const groupB = [18, 20, 22, 19, 21, 23, 19, 21];

      const result = runTTest(groupA, groupB);

      expect(result.stats.group1_n).toBe(8);
      expect(result.stats.group2_n).toBe(8);
      expect(result.stats.df).toBe(14);
      expect(result.stats.p).toBeLessThan(0.001);

      const apaText = formatAPAText(result.apa);
      expect(apaText).toContain("独立样本 t 检验");
      expect(apaText).toContain("p < .001");
      expect(apaText).toContain("存在显著差异");
    });
  });

  describe("Golden Path 3: Multi-Segment Analysis -> One-Way ANOVA", () => {
    it("evaluates brand recall across three demographic segments", () => {
      const seg1 = [20, 22, 24];
      const seg2 = [30, 32, 34];
      const seg3 = [40, 42, 44];

      const result = runAnova([seg1, seg2, seg3]);

      expect(result.stats.df_between).toBe(2);
      expect(result.stats.df_within).toBe(6);
      expect(result.stats.F).toBeGreaterThan(10);
      expect(result.stats.p).toBeLessThan(0.001);

      const apaText = formatAPAText(result.apa);
      expect(apaText).toContain("One-Way ANOVA");
      expect(apaText).toContain("显著差异");
    });
  });

  describe("Golden Path 4: Survey Scale Reliability Pipeline", () => {
    it("computes Cronbach's alpha across multi-item constructs", () => {
      // 3 items measuring Customer Loyalty across 6 respondents
      const items = [
        [5, 4, 5, 6, 7, 5],
        [4, 4, 5, 5, 6, 5],
        [5, 5, 5, 6, 7, 6],
      ];

      const result = runCronbach(items);

      expect(result.stats.items).toBe(3);
      expect(result.stats.Cronbach_alpha as number).toBeGreaterThan(0.8);

      const apaText = formatAPAText(result.apa);
      expect(apaText).toContain("信度分析");
      expect(apaText).toContain("信度优秀");
    });
  });

  describe("Golden Path 5: Security Gateway SSRF Defense & Error Handling", () => {
    it("blocks SSRF attack attempts on cloud metadata services (169.254.169.254)", async () => {
      const req = new NextRequest("http://localhost:3000/api/chat", {
        method: "POST",
        body: JSON.stringify({
          config: {
            provider: "custom",
            apiKey: "test-key",
            baseUrl: "http://169.254.169.254/latest/meta-data",
            model: "test-model",
          },
          messages: [{ role: "user", content: "hello" }],
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.error).toContain("Invalid or prohibited custom baseUrl");
    });

    it("blocks SSRF attempts on localhost and loopback interfaces", async () => {
      const req = new NextRequest("http://localhost:3000/api/chat", {
        method: "POST",
        body: JSON.stringify({
          config: {
            provider: "custom",
            apiKey: "test-key",
            baseUrl: "http://127.0.0.1:8080/admin",
            model: "test-model",
          },
          messages: [{ role: "user", content: "hello" }],
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.error).toContain("Invalid or prohibited custom baseUrl");
    });

    it("blocks private RFC 1918 addresses", async () => {
      const req = new NextRequest("http://localhost:3000/api/chat", {
        method: "POST",
        body: JSON.stringify({
          config: {
            provider: "custom",
            apiKey: "test-key",
            baseUrl: "http://192.168.1.1/api",
            model: "test-model",
          },
          messages: [{ role: "user", content: "hello" }],
        }),
      });

      const res = await POST(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.error).toContain("Invalid or prohibited custom baseUrl");
    });
  });
});
