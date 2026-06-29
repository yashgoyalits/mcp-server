import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { AnyToolDefinition } from './shared/types/toolDefinition.js';
import { createScreenerMcpServer } from './screener/server.js';
import { screenerToolDefinitions } from './screener/tools/index.js';
import { createSearchMcpServer } from './search/server.js';
import { searchToolDefinitions } from './search/tools/index.js';

export interface McpServerRoute {
  /** Mount path, e.g. '/screener' → final route is '/screener/mcp' */
  path: string;
  /** Short label used in logs and the tool catalog (see shared/catalog.ts). */
  domain: string;
  /** Builds a fresh McpServer for this domain (called once per request — see shared/createMcpRouter.ts). */
  createServer: () => McpServer;
  /**
   * This domain's full tool manifest. Kept here — not just buried inside
   * server.ts — so the catalog + startup name-collision check
   * (shared/catalog.ts) can inspect every domain's tools without spinning
   * up an actual McpServer instance.
   */
  toolDefinitions: AnyToolDefinition[];
}

export const mcpServerRoutes: McpServerRoute[] = [
  {
    path: '/screener',
    domain: 'screener',
    createServer: createScreenerMcpServer,
    toolDefinitions: screenerToolDefinitions,
  },
  {
    path: '/search',
    domain: 'search',
    createServer: createSearchMcpServer,
    toolDefinitions: searchToolDefinitions,
  },
];
