import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { r2Read, r2GlobalKey } from '../storage/r2Helpers.js';
import type { StocksGlobalIndex } from '../types/stock.js';

export async function getAvailableStocks(): Promise<CallToolResult> {
  const data = await r2Read<StocksGlobalIndex>(r2GlobalKey());

  if (!data) {
    return {
      content: [{ type: 'text', text: 'stocks/index.json not found in R2.' }],
      isError: true,
    };
  }

  const stocks = Array.isArray(data.available_stocks) ? data.available_stocks : [];
  const lines = stocks.map((s) => `- ${s.name} (slug: \`${s.slug}\`)`).join('\n');
  const text = stocks.length
    ? `## Available Stocks (${stocks.length})\n\n${lines}`
    : 'No stocks registered yet.';

  return { content: [{ type: 'text', text }] };
}
