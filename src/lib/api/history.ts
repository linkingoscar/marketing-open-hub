"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AnalysisRecord {
  id: string;
  tool: string;
  type: string;
  input: string;
  result: string;
  timestamp: number;
  fileName?: string;
}

interface HistoryStore {
  records: AnalysisRecord[];
  addRecord: (record: Omit<AnalysisRecord, "id" | "timestamp">) => void;
  removeRecord: (id: string) => void;
  clearAll: () => void;
  getByTool: (tool: string) => AnalysisRecord[];
}

export const useHistoryStore = create<HistoryStore>()(
  persist(
    (set, get) => ({
      records: [],
      addRecord: (record) =>
        set((state) => ({
          records: [
            { ...record, id: crypto.randomUUID(), timestamp: Date.now() },
            ...state.records,
          ].slice(0, 50),
        })),
      removeRecord: (id) =>
        set((state) => ({
          records: state.records.filter((r) => r.id !== id),
        })),
      clearAll: () => set({ records: [] }),
      getByTool: (tool) => get().records.filter((r) => r.tool === tool),
    }),
    { name: "martech-analysis-history" }
  )
);
