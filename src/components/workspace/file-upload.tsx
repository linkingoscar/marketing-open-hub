"use client";

import { useCallback, useState, useRef } from "react";
import { Upload, FileText, X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ParsedData {
  headers: string[];
  rows: Record<string, string | number>[];
  raw: string;
  fileName: string;
  rowCount: number;
  colCount: number;
}

interface FileUploadProps {
  onUpload: (data: ParsedData) => void;
  accept?: string;
  maxSizeMB?: number;
  className?: string;
  description?: string;
}

function parseCSV(text: string): { headers: string[]; rows: Record<string, string | number>[] } {
  const lines = text.trim().split("\n").filter((l) => l.trim());
  if (lines.length < 2) throw new Error("CSV 至少需要表头 + 1 行数据");

  // Detect delimiter
  const firstLine = lines[0];
  const delimiter = firstLine.includes("\t") ? "\t" : firstLine.includes(";") ? ";" : ",";

  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
        else inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseLine(lines[0]).map((h) => h.replace(/^"|"$/g, "").trim());
  const rows = lines.slice(1).map((line) => {
    const values = parseLine(line);
    const row: Record<string, string | number> = {};
    headers.forEach((h, i) => {
      const val = values[i]?.replace(/^"|"$/g, "").trim() ?? "";
      const num = Number(val);
      row[h] = val !== "" && !isNaN(num) && /^-?\d+\.?\d*$/.test(val) ? num : val;
    });
    return row;
  });

  return { headers, rows };
}

function parseJSON(text: string): { headers: string[]; rows: Record<string, string | number>[] } {
  const data = JSON.parse(text);
  const arr = Array.isArray(data) ? data : data.data || data.rows || data.results || [data];
  if (!Array.isArray(arr) || arr.length === 0) throw new Error("JSON 需要包含数组数据");

  const headers = [...new Set(arr.flatMap((item: Record<string, unknown>) => Object.keys(item)))];
  const rows = arr.map((item: Record<string, unknown>) => {
    const row: Record<string, string | number> = {};
    headers.forEach((h) => {
      const val = item[h];
      row[h] = typeof val === "number" ? val : String(val ?? "");
    });
    return row;
  });

  return { headers, rows };
}

export function FileUpload({ onUpload, accept = ".csv,.json,.txt,.tsv", maxSizeMB = 10, className, description }: FileUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback((file: File) => {
    setError("");
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`文件过大，最大 ${maxSizeMB}MB`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const ext = file.name.split(".").pop()?.toLowerCase();
        let parsed;

        if (ext === "json") {
          parsed = parseJSON(text);
        } else {
          parsed = parseCSV(text);
        }

        if (parsed.rows.length === 0) throw new Error("文件中没有数据行");

        setFileName(file.name);
        onUpload({
          headers: parsed.headers,
          rows: parsed.rows,
          raw: text,
          fileName: file.name,
          rowCount: parsed.rows.length,
          colCount: parsed.headers.length,
        });
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "文件解析失败");
      }
    };
    reader.onerror = () => setError("文件读取失败");
    reader.readAsText(file);
  }, [onUpload, maxSizeMB]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  return (
    <div className={cn("space-y-2", className)}>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
          dragOver ? "border-[var(--primary)] bg-[var(--primary)]/5" : "border-[var(--border)] hover:border-[var(--primary)]/50 hover:bg-[var(--bg-card)]",
        )}
      >
        <input ref={inputRef} type="file" accept={accept} className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f); }} />

        {fileName ? (
          <div className="flex items-center justify-center gap-3">
            <FileText className="w-8 h-8 text-[var(--success)]" />
            <div className="text-left">
              <p className="text-sm font-medium text-[var(--text-primary)]">{fileName}</p>
              <p className="text-xs text-[var(--text-muted)]">上传成功，点击重新选择</p>
            </div>
            <button onClick={(e) => { e.stopPropagation(); setFileName(""); }} className="ml-2 text-[var(--text-muted)] hover:text-[var(--error)]">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
            <Upload className="w-10 h-10 mx-auto mb-3 text-[var(--text-muted)]" />
            <p className="text-sm text-[var(--text-secondary)] mb-1">
              拖拽文件到此处，或 <span className="text-[var(--primary)]">点击选择</span>
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              {description ?? "支持 CSV / JSON / TSV / TXT，最大 10MB"}
            </p>
          </>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-[var(--error)] px-2">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}
    </div>
  );
}
