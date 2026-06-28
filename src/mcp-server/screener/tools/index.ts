import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getAvailableStocks } from './getAvailableStocks.js';
import { getLatestQuarterDetails } from './getLatestQuarterDetails.js';

export function registerScreenerTools(server: McpServer): void {
  server.registerTool(
    'get_available_stocks',
    {
      title: 'Get Available Stocks',
      description:
        'Returns the list of all stocks available in the screener database. ' +
        'Each entry contains the stock name and its screener slug (used as identifier in other tools). ' +
        'Call this first to discover valid slugs.',
      inputSchema: {},
    },
    async () => getAvailableStocks()
  );

  server.registerTool(
    'get_latest_quarter_details',
    {
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
    },
    async ({ slug }) => getLatestQuarterDetails(slug)
  );
}
