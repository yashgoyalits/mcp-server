# ScreenerInsights MCP Server

A remote MCP server exposing two read-only tools (`get_available_stocks`,
`get_latest_quarter_details`) backed by data stored in Cloudflare R2.

This is a port of the original Cloudflare Worker version, rebuilt as a
plain Node.js + Express app so it can run on Render (or any other
Node/Docker host) instead of Cloudflare's edge runtime.

- **Protocol**: MCP, spec revision `2025-11-25`, Streamable HTTP transport, **stateless mode**
- **SDK**: `@modelcontextprotocol/sdk` (official TypeScript SDK)
- **Storage**: Cloudflare R2, accessed via its S3-compatible API (`@aws-sdk/client-s3`)

---

## Folder structure

```
root/
├── index.ts                        ← entry point: Express app, /mcp route
├── src/
│   ├── server/mcpServer.ts         ← McpServer factory + tool registration
│   ├── tools/
│   │   ├── getAvailableStocks.ts
│   │   ├── getLatestQuarterDetails.ts
│   │   └── index.ts                ← registers tools + Zod schemas on the server
│   ├── storage/
│   │   ├── r2Client.ts             ← S3Client configured for R2's endpoint
│   │   └── r2Helpers.ts            ← key builders + r2Read()
│   ├── config/env.ts               ← validates required env vars at startup
│   └── types/stock.ts              ← shared TS interfaces
├── package.json
├── tsconfig.json
├── Dockerfile                       ← optional, for platform-agnostic deploys
├── render.yaml                      ← optional Render Blueprint
└── .env.example
```

To add a new tool later: write its logic as a new file under `src/tools/`,
then register it (name + Zod input schema) in `src/tools/index.ts`. Nothing
else needs to change.

---

## 1. Local setup

```bash
npm install
cp .env.example .env
```

Fill in `.env` with real values:

```
PORT=3000
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=...
```

**Getting the R2 credentials:** Cloudflare Dashboard → R2 → Overview →
"Manage API Tokens" → Create API Token → permission "Object Read & Write" →
scope it to your specific bucket only. This gives you an Access Key ID and
Secret Access Key (the secret is shown once — save it immediately). Your
Account ID is shown on the same R2 Overview page.

Run in dev mode (auto-restarts on file changes):

```bash
npm run dev
```

You should see:

```
ScreenerInsights MCP server listening on port 3000
```

---

## 2. How to check it locally (before deploying anywhere)

### A. Quick curl check

```bash
# Health check
curl http://localhost:3000/

# MCP handshake
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-11-25","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}'

# List tools
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}'

# Call a tool
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"get_available_stocks","arguments":{}}}'
```

If `get_available_stocks` returns real stock data, your R2 credentials and
bucket layout are correct end-to-end.

### B. MCP Inspector (recommended — visual, no manual JSON-RPC needed)

```bash
npx @modelcontextprotocol/inspector
```

This opens a browser UI at `http://localhost:6274`. Choose transport type
**Streamable HTTP**, set the URL to `http://localhost:3000/mcp`, connect,
then use the "Tools" tab to list and call tools interactively. This is the
easiest way to confirm both tools behave correctly before deploying.

### C. Type-check / build check

```bash
npm run build
```

This must complete with no errors before deploying — it's exactly what
Render will run during its build step.

---

## 3. Deploying to Render (free tier)

**Option A — Dashboard (no extra files needed):**

1. Push this project to a GitHub/GitLab repo.
2. Render Dashboard → New → Web Service → connect the repo.
3. Settings:
   - **Runtime**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: Free
4. Environment tab → add `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`,
   `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME` (do **not** set `PORT` — Render
   injects this automatically).
5. Create Web Service. Render builds and deploys; you get a URL like
   `https://your-app.onrender.com`.

**Option B — Blueprint (`render.yaml`, already included):**

Render Dashboard → New → Blueprint → point it at this repo. It reads
`render.yaml` and creates the service automatically; you'll just be
prompted to paste in the four R2 secret values (they're intentionally
*not* committed to the repo).

**Option C — Docker:** If you'd rather not rely on Render's Node
buildpack at all (e.g. to keep things identical across platforms), set
the service's runtime to **Docker** instead of Node — the included
`Dockerfile` builds and runs the same app in a container, with no other
config changes needed.

### Free tier behaviour to expect

- **512 MB RAM / 0.1 CPU** — plenty, since this server is I/O-bound (just
  fetching JSON from R2), not CPU-bound.
- **Spins down after 15 min of no traffic.** The next request triggers a
  cold start (~30-60s) before it responds. This is normal — there is no
  state to lose because the server is stateless and reads everything
  fresh from R2 on each call.
- **Ephemeral filesystem** — irrelevant here since nothing is written to
  disk.

---

## 4. Checking it in production (after deploy)

Replace `localhost:3000` with your Render URL in the same checks as
above:

```bash
curl https://your-app.onrender.com/

curl -X POST https://your-app.onrender.com/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

- First request after idle time will be slow (cold start) — that's
  expected on the free tier, not a bug.
- If you get a connection error instead of a slow response, check Render's
  **Logs** tab — the most common cause is a missing/incorrect R2
  environment variable (the server fails fast at startup with a clear
  message listing exactly which one is missing).

**Connecting a real MCP client to the deployed server:**
- **MCP Inspector**: same as local testing, but set the URL to
  `https://your-app.onrender.com/mcp`.
- **Claude.ai / Claude Desktop**: add it as a custom connector pointing at
  `https://your-app.onrender.com/mcp` and confirm both tools show up and
  return real data when called from an actual conversation.

### Ongoing checks

- Render's dashboard shows request logs and basic metrics — watch the
  **Logs** tab after a deploy for the startup line
  (`ScreenerInsights MCP server listening on port ...`) to confirm it
  booted correctly.
- Because the server validates env vars at startup and fails immediately
  with a descriptive error if something's missing, a service that's
  "deployed but not responding" almost always means: check Logs first.

---

## 5. Moving off Render later

Nothing in this codebase is Render-specific — no Render SDK, no platform
bindings, just `process.env` and a port to listen on. To move to Railway,
Fly.io, Koyeb, or a plain VPS:

- **Without Docker**: set the same build/start commands
  (`npm install && npm run build` / `npm start`) and the same four env
  vars on the new platform.
- **With Docker**: just point the new platform at the included
  `Dockerfile` — it's already self-contained.
