"use client";

import { useState } from "react";
import { FileText, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface DocxTableColumn {
  header: string;
  key: string;
}

export interface DocxSection {
  heading: string;
  content?: string;
  table?: {
    caption?: string;
    note?: string;
    columns: DocxTableColumn[];
    rows: Record<string, string | number>[];
  };
}

interface DocxExportProps {
  title: string;
  sections: DocxSection[];
  filename?: string;
  variant?: "outline" | "default";
}

/**
 * APA 7th Edition Word (.doc) 真实学术文档导出引擎
 * 生成符合 Microsoft Word / WPS 原生解析的 Office HTML/MHTML 格式文档
 * 内置学术标准三线表（上粗、下粗、中细线，无垂直竖线）与标准 Times New Roman 样式
 */
export function DocxExport({ title, sections, filename, variant = "outline" }: DocxExportProps) {
  const [exporting, setExporting] = useState(false);
  const [done, setDone] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    setDone(false);

    try {
      const docHtml = `
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta charset='utf-8'>
<!--[if gte mso 9]>
<xml>
  <w:WordDocument>
    <w:View>Print</w:View>
    <w:Zoom>100</w:Zoom>
    <w:DoNotOptimizeForBrowser/>
  </w:WordDocument>
</xml>
<![endif]-->
<style>
  @page Section1 {
    size: 595.3pt 841.9pt; /* A4 */
    margin: 72.0pt 72.0pt 72.0pt 72.0pt; /* 1 inch */
    mso-header-margin: 35.4pt;
    mso-footer-margin: 35.4pt;
  }
  div.Section1 { page: Section1; }
  body {
    font-family: 'Times New Roman', 'SimSun', serif;
    font-size: 12pt;
    line-height: 1.5;
    color: #000000;
  }
  h1 {
    font-size: 16pt;
    font-weight: bold;
    text-align: center;
    margin-bottom: 20pt;
  }
  h2 {
    font-size: 13pt;
    font-weight: bold;
    margin-top: 18pt;
    margin-bottom: 8pt;
    border-bottom: 0.5pt solid #cccccc;
    padding-bottom: 3pt;
  }
  p {
    margin-bottom: 8pt;
    line-height: 1.5;
    text-align: justify;
  }
  /* APA 7th Edition Three-Line Table */
  table.apa-table {
    width: 100%;
    border-collapse: collapse;
    margin: 12pt 0;
    font-size: 11pt;
  }
  table.apa-table th {
    border-top: 1.5pt solid black;
    border-bottom: 0.75pt solid black;
    border-left: none;
    border-right: none;
    padding: 6pt 8pt;
    text-align: left;
    font-weight: bold;
  }
  table.apa-table td {
    border: none;
    padding: 5pt 8pt;
    text-align: left;
  }
  table.apa-table tr.last-row td {
    border-bottom: 1.5pt solid black;
  }
  .table-title {
    font-weight: bold;
    font-size: 11pt;
    margin-top: 10pt;
    margin-bottom: 2pt;
  }
  .table-note {
    font-size: 9.5pt;
    font-style: italic;
    color: #333333;
    margin-top: 4pt;
  }
  .footer-note {
    margin-top: 30pt;
    padding-top: 10pt;
    border-top: 0.5pt solid #dddddd;
    font-size: 9pt;
    color: #666666;
    text-align: right;
  }
</style>
</head>
<body>
<div class="Section1">
  <h1>${title}</h1>
  ${sections
    .map((s) => {
      let secHtml = `<h2>${s.heading}</h2>\n`;
      if (s.content) {
        secHtml += `<div>${s.content
          .split("\n")
          .filter((line) => line.trim())
          .map((line) => `<p>${line}</p>`)
          .join("")}</div>\n`;
      }
      if (s.table) {
        if (s.table.caption) {
          secHtml += `<div class="table-title">${s.table.caption}</div>\n`;
        }
        secHtml += `<table class="apa-table">\n<thead>\n<tr>\n`;
        s.table.columns.forEach((col) => {
          secHtml += `<th>${col.header}</th>`;
        });
        secHtml += `\n</tr>\n</thead>\n<tbody>\n`;
        s.table.rows.forEach((row, idx) => {
          const isLast = idx === s.table!.rows.length - 1;
          secHtml += `<tr class="${isLast ? "last-row" : ""}">\n`;
          s.table!.columns.forEach((col) => {
            secHtml += `<td>${row[col.key] ?? "-"}</td>`;
          });
          secHtml += `\n</tr>\n`;
        });
        secHtml += `</tbody>\n</table>\n`;
        if (s.table.note) {
          secHtml += `<div class="table-note">注：${s.table.note}</div>\n`;
        }
      }
      return secHtml;
    })
    .join("\n")}
  <div class="footer-note">
    本报告依据 APA 第 7 版标准由 MarTech Open Hub 实证工作台生成 · ${new Date().toLocaleDateString("zh-CN")}
  </div>
</div>
</body>
</html>`;

      const blob = new Blob([docHtml], { type: "application/msword;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const safeName = (filename || `${title.replace(/\s+/g, "-")}-APA-Report`).replace(
        /\.doc[x]?$/i,
        ""
      );
      a.download = `${safeName}.doc`;
      a.click();
      URL.revokeObjectURL(url);

      setDone(true);
      setTimeout(() => setDone(false), 3000);
    } catch (e) {
      console.error("Export Word failed:", e);
    } finally {
      setExporting(false);
    }
  };

  return (
    <Button
      variant={variant}
      size="sm"
      onClick={handleExport}
      disabled={exporting}
      className="h-8 px-3 text-xs border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]"
    >
      {exporting ? (
        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
      ) : done ? (
        <Check className="w-3 h-3 mr-1 text-[var(--success)]" />
      ) : (
        <FileText className="w-3 h-3 mr-1" />
      )}
      {done ? "已导出 Word" : exporting ? "生成中..." : "导出 Word (.doc)"}
    </Button>
  );
}
