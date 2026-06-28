import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerScreenerTools } from './tools/index.js';

export function createScreenerMcpServer(): McpServer {
  const server = new McpServer({
    name: 'ScreenerInsights',
    version: '1.0.0',
  });

  registerScreenerTools(server);

  return server;
}
