export interface StockListItem {
  name: string;
  slug: string;
}

export interface StocksGlobalIndex {
  count: number;
  available_stocks: StockListItem[];
}

export interface StockIndexFile {
  company?: { name?: string };
  latest?: { quarterly?: string | null; yearly?: string | null };
}
