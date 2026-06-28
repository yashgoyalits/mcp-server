import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export function registerSearchTools(_server: McpServer): void {
  // TODO: register real search tools, e.g.:
  // server.registerTool('search_news', { ... }, async ({ query }) => searchNews(query));
}
