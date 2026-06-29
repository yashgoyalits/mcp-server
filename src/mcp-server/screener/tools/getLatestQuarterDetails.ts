import { z } from 'zod';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { defineTool } from '../../shared/types/toolDefinition.js';
import { toolError, toolText } from '../../shared/toolResult.js';
import { r2Read, r2IndexKey, r2InsightKey } from '../storage/r2Helpers.js';
import type { StockIndexFile } from '../types/stock.js';

async function handler({ slug }: { slug: string }): Promise<CallToolResult> {
  // Step 1: read the stock's index to find the latest quarterly id.
  const index = await r2Read<StockIndexFile>(r2IndexKey(slug));

  if (!index) {
    return toolError(`No index found for slug "${slug}". Verify with get_available_stocks().`);
  }

  const latestId = index?.latest?.quarterly;

  if (!latestId) {
    return toolError(`Stock "${slug}" exists but has no quarterly data yet (latest.quarterly is null).`);
  }

  // Step 2: fetch the actual quarterly file.
  const quarterly = await r2Read(r2InsightKey(slug, 'quarterly', latestId));

  if (!quarterly) {
    return toolError(`Index references "${latestId}" but file is missing in R2. Run /index/init to rebuild.`);
  }

  const text =
    `## ${index?.company?.name ?? slug} — Latest Quarter: ${latestId}\n\n` +
    '```json\n' +
    JSON.stringify(quarterly, null, 2) +
    '\n```';

  return toolText(text);
}

export const getLatestQuarterDetailsTool = defineTool({
  name: 'get_latest_quarter_details',
  title: 'Get Latest Quarter Details',
  description:
    'Fetches the most recent quarterly insight data for a given stock slug. ' +
    'Returns the full quarterly JSON stored in R2 — financials, notes, and any _md fields. ' +
    'Use get_available_stocks() first to resolve a valid slug.',
  inputSchema: {
    slug: z
      .string()
      .min(1)
      .describe(
        'The screener_slug for the stock (e.g. "reliance-industries"). ' +
          'Must match an entry returned by get_available_stocks.'
      ),
  },
  handler,
});
