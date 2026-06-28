// ─────────────────────────────────────────────────────────────────
// src/tools/getLatestQuarterDetails.ts
// Logic ported directly from screener-mcp-worker.js's callTool() branch.
// ─────────────────────────────────────────────────────────────────

import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { r2Read, r2IndexKey, r2InsightKey } from '../storage/r2Helpers.js';
import type { StockIndexFile } from '../types/stock.js';

export async function getLatestQuarterDetails(slug: string): Promise<CallToolResult> {
  // Step 1: read the stock's index to find the latest quarterly id.
  const index = await r2Read<StockIndexFile>(r2IndexKey(slug));

  if (!index) {
    return {
      content: [
        {
          type: 'text',
          text: `No index found for slug "${slug}". Verify with get_available_stocks().`,
        },
      ],
      isError: true,
    };
  }

  const latestId = index?.latest?.quarterly;

  if (!latestId) {
    return {
      content: [
        {
          type: 'text',
          text: `Stock "${slug}" exists but has no quarterly data yet (latest.quarterly is null).`,
        },
      ],
      isError: true,
    };
  }

  // Step 2: fetch the actual quarterly file.
  const quarterly = await r2Read(r2InsightKey(slug, 'quarterly', latestId));

  if (!quarterly) {
    return {
      content: [
        {
          type: 'text',
          text: `Index references "${latestId}" but file is missing in R2. Run /index/init to rebuild.`,
        },
      ],
      isError: true,
    };
  }

  const text =
    `## ${index?.company?.name ?? slug} — Latest Quarter: ${latestId}\n\n` +
    '```json\n' +
    JSON.stringify(quarterly, null, 2) +
    '\n```';

  return { content: [{ type: 'text', text }] };
}
