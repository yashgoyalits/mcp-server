import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { defineTool } from '../../shared/types/toolDefinition.js';
import { toolError, toolText } from '../../shared/toolResult.js';

const NEWSBLUR_STORIES_URL = 'https://newsblur-worker.withyash.workers.dev/stories';

async function handler(): Promise<CallToolResult> {
    let response: Response;
    try {
        response = await fetch(NEWSBLUR_STORIES_URL);
    } catch (error) {
        return toolError(`Failed to reach NewsBlur worker: ${(error as Error).message}`);
    }

    if (!response.ok) {
        return toolError(`NewsBlur worker returned ${response.status} ${response.statusText}`);
    }

    let data: unknown;
    try {
        data = await response.json();
    } catch (error) {
        return toolError(`NewsBlur worker did not return valid JSON: ${(error as Error).message}`);
    }

    return toolText('```json\n' + JSON.stringify(data, null, 2) + '\n```');
}

export const rssfeedNewsblurTool = defineTool({
    name: 'rssfeed-newsblur',
    title: 'NewsBlur RSS Stories',
    description:
        'Fetches the latest stories from the NewsBlur worker and returns the raw JSON response. ' +
        `Source: ${NEWSBLUR_STORIES_URL}`,
    inputSchema: {},
    handler,
});