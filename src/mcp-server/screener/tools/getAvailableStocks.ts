import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { defineTool } from '../../shared/types/toolDefinition.js';
import { toolError, toolText } from '../../shared/toolResult.js';
import { r2Read, r2GlobalKey } from '../storage/r2Helpers.js';
import type { StocksGlobalIndex } from '../types/stock.js';

async function handler(): Promise<CallToolResult> {
  const data = await r2Read<StocksGlobalIndex>(r2GlobalKey());

  if (!data) {
    return toolError('stocks/index.json not found in R2.');
  }

  const stocks = Array.isArray(data.available_stocks) ? data.available_stocks : [];
  const lines = stocks.map((s) => `- ${s.name} (slug: \`${s.slug}\`)`).join('\n');
  const text = stocks.length
    ? `## Available Stocks (${stocks.length})\n\n${lines}`
    : 'No stocks registered yet.';

  return toolText(text);
}

export const getAvailableStocksTool = defineTool({
  name: 'get_available_stocks',
  title: 'Get Available Stocks',
  description:
    'Returns the list of all stocks available in the screener database. ' +
    'Each entry contains the stock name and its screener slug (used as identifier in other tools). ' +
    'Call this first to discover valid slugs.',
  inputSchema: {},
  handler,
});
