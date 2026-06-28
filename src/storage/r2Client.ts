// ─────────────────────────────────────────────────────────────────
// src/storage/r2Client.ts
//
// Cloudflare R2 speaks the S3 API, so the standard AWS SDK works
// against it unmodified — only the endpoint + credentials differ
// from talking to real AWS S3.
//
// On Cloudflare Workers, R2 was accessed via a zero-network "binding"
// (env.data.get(key)). Outside Cloudflare's network (e.g. on Render),
// that binding doesn't exist — this S3 client is the replacement:
// every read here is a real HTTPS call to R2's S3-compatible endpoint.
// ─────────────────────────────────────────────────────────────────

import { S3Client } from '@aws-sdk/client-s3';
import { env } from '../config/env.js';

export const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
});

export const BUCKET_NAME = env.R2_BUCKET_NAME;
