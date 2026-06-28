// ─────────────────────────────────────────────────────────────────
// src/storage/r2Helpers.ts
//
// Key structure (unchanged from screener-worker.js):
//   stocks/index.json
//   stocks/{SYMBOL}/index.json
//   stocks/{SYMBOL}/insights/quarterly/{id}.json
//   stocks/{SYMBOL}/insights/yearly/{id}.json
// ─────────────────────────────────────────────────────────────────

import { GetObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, BUCKET_NAME } from './r2Client.js';

export const r2GlobalKey = (): string => 'stocks/index.json';

export const r2IndexKey = (slug: string): string => `stocks/${slug}/index.json`;

export const r2InsightKey = (
  slug: string,
  type: 'quarterly' | 'yearly',
  id: string
): string => `stocks/${slug}/insights/${type}/${id}.json`;

/**
 * Reads a JSON object from R2 by key.
 * Returns null if the key doesn't exist (mirrors the old bucket.get() === null check).
 * Any other failure (auth, network, malformed JSON) is rethrown so the
 * caller's try/catch can turn it into a proper MCP tool error.
 */
export async function r2Read<T = unknown>(key: string): Promise<T | null> {
  try {
    const response = await s3Client.send(
      new GetObjectCommand({ Bucket: BUCKET_NAME, Key: key })
    );

    const text = await response.Body?.transformToString();
    if (!text) return null;

    return JSON.parse(text) as T;
  } catch (error: any) {
    const isMissing =
      error?.name === 'NoSuchKey' || error?.$metadata?.httpStatusCode === 404;

    if (isMissing) return null;
    throw error;
  }
}
