import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createScreenerMcpServer } from './screener/server.js';
import { createSearchMcpServer } from './search/server.js';

export interface McpServerRoute {
  /** Mount path, e.g. '/screener' → final route is '/screener/mcp' */
  path: string;
  createServer: () => McpServer;
}

export const mcpServerRoutes: McpServerRoute[] = [
  { path: '/screener', createServer: createScreenerMcpServer },
  { path: '/search', createServer: createSearchMcpServer },
];
