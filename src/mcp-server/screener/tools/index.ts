import { getAvailableStocksTool } from './getAvailableStocks.js';
import { getLatestQuarterDetailsTool } from './getLatestQuarterDetails.js';
import type { AnyToolDefinition } from '../../shared/types/toolDefinition.js';

/**
 * This domain's full tool manifest — pure data, no `server.registerTool()`
 * calls here. The shared registry (mcp-server/shared/toolRegistry.ts)
 * consumes this list and does all the wiring/error-handling/logging.
 *
 * To add a new tool: write its ToolDefinition in its own file (see the two
 * below for the pattern — use `defineTool` so the handler's argument type
 * is inferred from inputSchema), then add it to this array. Nothing else
 * needs to change.
 */
export const screenerToolDefinitions: AnyToolDefinition[] = [
  getAvailableStocksTool,
  getLatestQuarterDetailsTool,
];
