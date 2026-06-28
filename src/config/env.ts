// ─────────────────────────────────────────────────────────────────
// src/config/env.ts — loads and validates environment variables.
//
// Fails fast with a clear message at startup if anything required
// is missing — this is much easier to debug in Render's logs than
// a vague "undefined" error showing up later inside a tool call.
// ─────────────────────────────────────────────────────────────────
import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  // Render injects PORT automatically in production; default is for local dev.
  PORT: z.coerce.number().int().positive().default(3000),

  // Cloudflare R2 — S3-compatible API credentials.
  // Generate via: Cloudflare Dashboard → R2 → Manage API Tokens.
  R2_ACCOUNT_ID: z.string().min(1, 'R2_ACCOUNT_ID is required'),
  R2_ACCESS_KEY_ID: z.string().min(1, 'R2_ACCESS_KEY_ID is required'),
  R2_SECRET_ACCESS_KEY: z.string().min(1, 'R2_SECRET_ACCESS_KEY is required'),
  R2_BUCKET_NAME: z.string().min(1, 'R2_BUCKET_NAME is required'),
});

function loadEnv() {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error('❌ Invalid or missing environment variables:');
    for (const issue of parsed.error.issues) {
      console.error(`   - ${issue.path.join('.')}: ${issue.message}`);
    }
    console.error('\nCheck your .env file (local) or Render → Environment tab (production).');
    process.exit(1);
  }

  return parsed.data;
}

export const env = loadEnv();
