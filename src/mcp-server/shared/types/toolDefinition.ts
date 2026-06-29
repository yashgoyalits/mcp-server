import { z, type ZodRawShape } from 'zod';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

/**
 * The contract every tool, in every domain, follows. A ToolDefinition is
 * pure data + a handler — no `server.registerTool()` call lives in a tool
 * file. The shared registry (../toolRegistry.ts) is the only place that
 * talks to the McpServer SDK directly.
 */
export interface ToolDefinition<Args extends ZodRawShape = ZodRawShape> {
  /** Must be unique across the ENTIRE server (all domains) — enforced at startup, see ../catalog.ts. */
  name: string;
  title: string;
  description: string;
  /** Zod shape for the tool's input. Use `{}` for a no-argument tool. */
  inputSchema: Args;
  /** Core business logic. Receives the parsed input matching inputSchema. */
  handler: (args: z.infer<z.ZodObject<Args>>) => Promise<CallToolResult>;
  /**
   * Optional gate, re-checked every time this domain's server is built
   * (once per request — this server runs in stateless mode, see
   * src/mcp-server/shared/createMcpRouter.ts). Return false to have the
   * tool skipped — logged, not crashed — instead of exposed to clients.
   * Use this for tools that depend on an optional API key/flag.
   */
  isEnabled?: () => boolean;
  /** Marks the tool deprecated. The registry prefixes the description automatically — no need to edit it by hand. */
  deprecated?: boolean;
}

/**
 * Identity helper used purely for type inference: lets a tool file write a
 * plain object literal and have `handler`'s argument type inferred from
 * `inputSchema`, instead of spelling out `ToolDefinition<{ slug: z.ZodString }>`
 * by hand on every tool. See screener/tools/getLatestQuarterDetails.ts for
 * an example.
 */
export function defineTool<Args extends ZodRawShape>(
  tool: ToolDefinition<Args>
): ToolDefinition<Args> {
  return tool;
}

/**
 * Type-erased form used for storage/registration. Every tool in a domain
 * (or across the whole server) has its own input shape, so a single array
 * can't stay strictly generic over Args without erasing it at the
 * collection boundary — the same reason Express route handlers or the MCP
 * SDK's own internals fall back to a looser type once handlers are stored
 * together. Each tool file still gets full inference via `defineTool`
 * above; only the shared array/registry sees this erased form.
 */
export type AnyToolDefinition = ToolDefinition<any>;
