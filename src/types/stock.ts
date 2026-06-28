// ─────────────────────────────────────────────────────────────────
// src/types/stock.ts — shapes of the JSON files stored in R2.
// Mirrors the structures read/written by the original screener-worker.js
// ─────────────────────────────────────────────────────────────────

export interface StockListItem {
  name: string;
  slug: string;
}

export interface StocksGlobalIndex {
  count: number;
  available_stocks: StockListItem[];
}

export interface StockIndexFile {
  company?: {
    name?: string;
  };
  latest?: {
    quarterly?: string | null;
    yearly?: string | null;
  };
}
