// ─────────────────────────────────────────────────────────────────
// src/server/mcpServer.ts — builds a fresh McpServer instance with
// all tools registered. Called once per request in stateless mode
// (see index.ts) so concurrent requests never share state.
// ─────────────────────────────────────────────────────────────────

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerTools } from '../tools/index.js';

export function createMcpServer(): McpServer {
  const server = new McpServer({
    name: 'ScreenerInsights',
    version: '1.0.0',
  });

  registerTools(server);

  return server;
}
