import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ZodRawShape } from 'zod';
import type { AnyToolDefinition } from './types/toolDefinition.js';
import { toolError } from './toolResult.js';

export interface RegisterToolsOptions {
  /** Short label used in log lines, e.g. 'screener'. */
  domain: string;
}

/**
 * Registers a domain's full list of ToolDefinitions onto an McpServer
 * instance. This is the ONLY place that calls `server.registerTool()` —
 * individual tool files just export data, and a domain's `tools/index.ts`
 * just exports an array. Centralizing the wiring here means every
 * cross-cutting concern is handled once instead of being duplicated (or
 * forgotten) in every tool file:
 *
 *   - env-based enable/disable: a tool whose `isEnabled()` returns false is
 *     skipped (and logged) instead of registered, so an optional/missing
 *     API key never crashes the server.
 *   - logging/metrics: every call is timed and logged with its outcome —
 *     swap the console.log/console.error calls below for a real
 *     logger/metrics client later without touching any tool file.
 *   - error formatting: an unexpected throw from a handler is caught here
 *     and turned into a well-formed MCP error result, instead of crashing
 *     the request or leaving every tool to add its own try/catch.
 *   - deprecation: a `deprecated: true` manifest flag is reflected in the
 *     description automatically.
 *
 * Returns the list of tool names actually registered (i.e. excluding any
 * skipped via isEnabled) — handy for tests/logging.
 */
export function registerToolDefinitions(
  server: McpServer,
  tools: AnyToolDefinition[],
  { domain }: RegisterToolsOptions
): string[] {
  const registeredNames: string[] = [];

  for (const tool of tools) {
    if (tool.isEnabled && !tool.isEnabled()) {
      console.log(`[${domain}] skipping tool "${tool.name}" — disabled (isEnabled() returned false)`);
      continue;
    }

    server.registerTool(
      tool.name,
      {
        title: tool.title,
        description: tool.deprecated ? `[DEPRECATED] ${tool.description}` : tool.description,
        inputSchema: tool.inputSchema as ZodRawShape,
      },
      async (args: any) => {
        const startedAt = Date.now();
        try {
          const result = await tool.handler(args);
          console.log(`[${domain}] ${tool.name} ok (${Date.now() - startedAt}ms)`);
          return result;
        } catch (error) {
          console.error(`[${domain}] ${tool.name} threw after ${Date.now() - startedAt}ms:`, error);
          return toolError(`Internal error while running "${tool.name}". Check server logs for details.`);
        }
      }
    );

    registeredNames.push(tool.name);
  }

  return registeredNames;
}
