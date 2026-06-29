import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerToolDefinitions } from '../shared/toolRegistry.js';
import { screenerToolDefinitions } from './tools/index.js';

export function createScreenerMcpServer(): McpServer {
  const server = new McpServer({
    name: 'ScreenerInsights',
    version: '1.0.0',
  });

  registerToolDefinitions(server, screenerToolDefinitions, { domain: 'screener' });

  return server;
}
