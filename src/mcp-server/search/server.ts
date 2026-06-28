import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerSearchTools } from './tools/index.js';

export function createSearchMcpServer(): McpServer {
  const server = new McpServer({
    name: 'SearchInsights',
    version: '1.0.0',
  });

  registerSearchTools(server);

  return server;
}
