import 'dotenv/config';
import { z } from 'zod';
import { screenerEnvSchema } from '../mcp-server/screener/env.js';
import { searchEnvSchema } from '../mcp-server/search/env.js';

const envSchema = z
  .object({
    PORT: z.coerce.number().int().positive().default(3000),
  })
  .merge(screenerEnvSchema)
  .merge(searchEnvSchema);

function loadEnv() {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error('❌ Invalid or missing environment variables:');
    for (const issue of parsed.error.issues) {
      console.error(`   - ${issue.path.join('.')}: ${issue.message}`);
    }
    console.error('\nCheck your .env file (local) or your host\'s Environment tab (production).');
    process.exit(1);
  }

  return parsed.data;
}

export const env = loadEnv();
