// ─────────────────────────────────────────────────────────────────
// index.ts — entry point.
//
// Plain Express app, no Render-specific code anywhere — this same
// file works unchanged on Railway, Fly.io, Docker on a VPS, etc.
// Just needs PORT + the R2_* env vars set wherever it runs.
//
// MCP transport: Streamable HTTP, stateless mode (spec 2025-11-25).
//   POST /mcp → JSON-RPC requests (initialize, tools/list, tools/call, ...)
//   GET/DELETE /mcp → 405 (no sessions to resume/cancel in stateless mode)
// ─────────────────────────────────────────────────────────────────

import express, { type Request, type Response } from 'express';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { env } from './src/config/env.js';
import { createMcpServer } from './src/server/mcpServer.js';

const app = express();
app.use(express.json());

// Open CORS — matches the original Cloudflare Worker (public, no auth).
app.use((req: Request, res: Response, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, mcp-session-id');
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

// Plain health check — not part of the MCP spec, just for humans / uptime
// pings (and to confirm the deploy is alive without speaking JSON-RPC).
app.get('/', (_req: Request, res: Response) => {
  res.json({ status: 'ok', server: 'ScreenerInsights', transport: 'streamable-http' });
});

// MCP endpoint. A fresh McpServer + transport per request keeps every
// request fully isolated — no shared state, no request-id collisions
// between concurrent clients, and nothing lost when Render spins the
// free-tier instance down between requests.
app.post('/mcp', async (req: Request, res: Response) => {
  try {
    const server = createMcpServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined, // stateless
      enableJsonResponse: true, // plain JSON response instead of an SSE stream
    });

    res.on('close', () => {
      transport.close();
      server.close();
    });

    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error('Error handling MCP request:', error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: { code: -32603, message: 'Internal server error' },
        id: null,
      });
    }
  }
});

// GET/DELETE on /mcp exist in the spec for resumable SSE sessions.
// We don't use sessions, so they're not applicable here.
app.get('/mcp', (_req: Request, res: Response) => {
  res.status(405).json({
    jsonrpc: '2.0',
    error: { code: -32000, message: 'Method not allowed — this server runs in stateless mode.' },
    id: null,
  });
});

app.delete('/mcp', (_req: Request, res: Response) => {
  res.status(405).json({
    jsonrpc: '2.0',
    error: { code: -32000, message: 'Method not allowed — this server runs in stateless mode.' },
    id: null,
  });
});

app.listen(env.PORT, () => {
  console.log(`ScreenerInsights MCP server listening on port ${env.PORT}`);
});
