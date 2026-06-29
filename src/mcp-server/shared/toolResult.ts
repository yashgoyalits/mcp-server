import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

/** A successful, plain-text tool response. */
export function toolText(text: string): CallToolResult {
  return { content: [{ type: 'text', text }] };
}

/**
 * A *handled* tool-level error (bad slug, missing data, etc.) — as opposed
 * to an unexpected exception, which shared/toolRegistry.ts already catches
 * and formats automatically. Use this for the expected "not found" /
 * validation-style failures so every tool reports them the same way,
 * instead of each one hand-rolling the `{ content, isError: true }` shape.
 */
export function toolError(text: string): CallToolResult {
  return { content: [{ type: 'text', text }], isError: true };
}
