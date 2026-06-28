import { z } from 'zod';

// Add real fields when search needs a key (e.g. SEARCH_API_KEY).
// Root config/env.ts picks it up automatically via .merge().
export const searchEnvSchema = z.object({});
