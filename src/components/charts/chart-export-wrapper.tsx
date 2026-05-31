"use client";

import { useRef, useCallback } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChartExportWrapperProps {
  children: React.ReactNode;
  filename?: string;
}

export function ChartExportWrapper({ children, filename = "chart" }: ChartExportWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const exportAs = useCallback(async (format: "png" | "svg") => {
    if (!containerRef.current) return;
    const svgEl = containerRef.current.querySelector("svg");
    if (!svgEl) return;

    if (format === "svg") {
      const svgData = new XMLSerializer().serializeToString(svgEl);
      const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `${filename}.svg`; a.click();
      URL.revokeObjectURL(url);
    } else {
      // PNG export via canvas
      const svgData = new XMLSerializer().serializeToString(svgEl);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const img = new Image();
      const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);

      img.onload = () => {
        canvas.width = img.width * 2;
        canvas.height = img.height * 2;
        ctx.scale(2, 2);
        ctx.fillStyle = "#0A0A0F";
        ctx.fillRect(0, 0, img.width, img.height);
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const pngUrl = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = pngUrl; a.download = `${filename}.png`; a.click();
            URL.revokeObjectURL(pngUrl);
          }
        }, "image/png");
        URL.revokeObjectURL(url);
      };
      img.src = url;
    }
  }, [filename]);

  return (
    <div className="relative group">
      <div ref={containerRef}>{children}</div>
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
        <Button variant="ghost" size="sm" className="h-6 px-2 text-[9px] bg-[var(--bg-secondary)]/80 backdrop-blur-sm"
          onClick={() => exportAs("png")}>
          <Download className="w-3 h-3 mr-0.5" /> PNG
        </Button>
        <Button variant="ghost" size="sm" className="h-6 px-2 text-[9px] bg-[var(--bg-secondary)]/80 backdrop-blur-sm"
          onClick={() => exportAs("svg")}>
          <Download className="w-3 h-3 mr-0.5" /> SVG
        </Button>
      </div>
    </div>
  );
}
