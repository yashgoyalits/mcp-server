import type { AnyToolDefinition } from '../../shared/types/toolDefinition.js';

// No tools registered yet for this domain.
//
// Once a real tool exists, follow the same plugin pattern as the screener
// domain: write the ToolDefinition in its own file (mirroring
// ../screener/tools/getAvailableStocks.ts), then list it below. Nothing
// else in this codebase needs to change.
//
// Worked example, once a SEARCH_API_KEY env var exists (see ../env.ts):
//
//   import { z } from 'zod';
//   import { defineTool } from '../../shared/types/toolDefinition.js';
//   import { toolText } from '../../shared/toolResult.js';
//
//   export const searchNewsTool = defineTool({
//     name: 'search_news',
//     title: 'Search News',
//     description: 'Searches recent news articles for a given query.',
//     inputSchema: { query: z.string().min(1) },
//     handler: async ({ query }) => toolText(`...results for "${query}"...`),
//     // Skips registration (instead of crashing) whenever the key is
//     // missing — handled centrally by shared/toolRegistry.ts.
//     isEnabled: () => Boolean(process.env.SEARCH_API_KEY),
//   });
//
//   export const searchToolDefinitions: AnyToolDefinition[] = [searchNewsTool];

export const searchToolDefinitions: AnyToolDefinition[] = [];
