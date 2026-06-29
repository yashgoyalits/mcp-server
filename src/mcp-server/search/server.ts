import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerToolDefinitions } from '../shared/toolRegistry.js';
import { searchToolDefinitions } from './tools/index.js';

export function createSearchMcpServer(): McpServer {
  const server = new McpServer({
    name: 'SearchInsights',
    version: '1.0.0',
  });

  registerToolDefinitions(server, searchToolDefinitions, { domain: 'search' });

  return server;
}
