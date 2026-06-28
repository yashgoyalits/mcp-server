# MCP Server

A remote MCP server exposing multiple domain-owned MCP route-servers behind
one Express app — currently `/screener/mcp` (two read-only tools backed by
Cloudflare R2) and `/search/mcp` (scaffolded, no tools registered yet).

This started as a port of a Cloudflare Worker (the original screener-only
service), then got refactored so new domains can be added as self-contained
folders instead of growing one shared server file.

- **Protocol**: MCP, spec revision `2025-11-25`, Streamable HTTP transport, **stateless mode**
- **SDK**: `@modelcontextprotocol/sdk` (official TypeScript SDK)
- **Storage**: Cloudflare R2 (screener domain only), accessed via its S3-compatible API (`@aws-sdk/client-s3`)

---

## Folder structure

```
root/
├── index.ts                            ← entry point: loops registry.ts, mounts every route
├── src/
│   ├── config/
│   │   └── env.ts                      ← composes domain env schemas, fails fast once
│   ├── mcp-server/
│   │   ├── registry.ts                 ← the ONE file you touch to add a new domain
│   │   ├── shared/
│   │   │   ├── corsMiddleware.ts
│   │   │   └── createMcpRouter.ts      ← reusable POST/GET/DELETE /mcp wiring
│   │   ├── screener/
│   │   │   ├── server.ts               ← createScreenerMcpServer()
│   │   │   ├── env.ts                  ← R2_* schema, owned by this domain
│   │   │   ├── tools/
│   │   │   │   ├── getAvailableStocks.ts
│   │   │   │   ├── getLatestQuarterDetails.ts
│   │   │   │   └── index.ts            ← registerScreenerTools()
│   │   │   ├── storage/
│   │   │   │   ├── r2Client.ts
│   │   │   │   └── r2Helpers.ts
│   │   │   └── types/
│   │   │       └── stock.ts
│   │   └── search/                     ← scaffold — no tools registered yet
│   │       ├── server.ts
│   │       ├── env.ts
│   │       └── tools/
│   │           └── index.ts            ← TODO: add real tools here
├── package.json
├── tsconfig.json
├── Dockerfile                           ← optional, for platform-agnostic deploys
├── render.yaml                          ← optional Render Blueprint
└── .env.example
```

To add a new tool to an existing domain: write its logic as a new file under
that domain's `tools/` folder, then register it in that domain's
`tools/index.ts`. To add a whole new domain (e.g. `filings`), see
[section 6](#6-adding-a-new-domain) below — `index.ts` never needs to change.

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
MCP servers listening on port 3000
  /screener/mcp
  /search/mcp
```

---

## 2. How to check it locally (before deploying anywhere)

### A. Quick curl check

```bash
# Health check — lists every mounted route
curl http://localhost:3000/

# MCP handshake (screener domain)
curl -X POST http://localhost:3000/screener/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-11-25","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}'

# List tools (screener domain)
curl -X POST http://localhost:3000/screener/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}'

# Call a tool (screener domain)
curl -X POST http://localhost:3000/screener/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"get_available_stocks","arguments":{}}}'

# Search domain is mounted too, but has no tools registered yet —
# tools/list currently returns "Method not found" until a tool is added
# (see src/mcp-server/search/tools/index.ts).
curl -X POST http://localhost:3000/search/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

If `get_available_stocks` returns real stock data, your R2 credentials and
bucket layout are correct end-to-end.

### B. MCP Inspector (recommended — visual, no manual JSON-RPC needed)

```bash
npx @modelcontextprotocol/inspector
```

This opens a browser UI at `http://localhost:6274`. Choose transport type
**Streamable HTTP**, set the URL to `http://localhost:3000/screener/mcp`
(or `http://localhost:3000/search/mcp` for the search domain), connect,
then use the "Tools" tab to list and call tools interactively. This is the
easiest way to confirm tools behave correctly before deploying.

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
  state to lose because every route is stateless and reads everything
  fresh from R2 (or wherever a future domain's data lives) on each call.
- **Ephemeral filesystem** — irrelevant here since nothing is written to
  disk.

---

## 4. Checking it in production (after deploy)

Replace `localhost:3000` with your Render URL in the same checks as
above:

```bash
curl https://your-app.onrender.com/

curl -X POST https://your-app.onrender.com/screener/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

- First request after idle time will be slow (cold start) — that's
  expected on the free tier, not a bug.
- If you get a connection error instead of a slow response, check Render's
  **Logs** tab — the most common cause is a missing/incorrect env
  variable (the server fails fast at startup with a clear message listing
  exactly which one is missing, regardless of which domain it belongs to).

**Connecting a real MCP client to the deployed server:**
- **MCP Inspector**: same as local testing, but set the URL to
  `https://your-app.onrender.com/screener/mcp`.
- **Claude.ai / Claude Desktop**: add it as a custom connector pointing at
  `https://your-app.onrender.com/screener/mcp` and confirm the tools show
  up and return real data when called from an actual conversation.

### Ongoing checks

- Render's dashboard shows request logs and basic metrics — watch the
  **Logs** tab after a deploy for the startup lines
  (`MCP servers listening on port ...` followed by each mounted route) to
  confirm it booted correctly.
- Because the server validates env vars at startup and fails immediately
  with a descriptive error if something's missing, a service that's
  "deployed but not responding" almost always means: check Logs first.

---

## 5. Moving off Render later

Nothing in this codebase is Render-specific — no Render SDK, no platform
bindings, just `process.env` and a port to listen on. To move to Railway,
Fly.io, Koyeb, or a plain VPS:

- **Without Docker**: set the same build/start commands
  (`npm install && npm run build` / `npm start`) and the same env vars on
  the new platform.
- **With Docker**: just point the new platform at the included
  `Dockerfile` — it's already self-contained.

---

## 6. Adding a new domain

1. `mkdir -p src/mcp-server/<domain>/tools`
2. `src/mcp-server/<domain>/server.ts` → `create<Domain>McpServer()`, same shape as screener's.
3. `src/mcp-server/<domain>/tools/index.ts` → `register<Domain>Tools(server)`.
4. If it needs secrets: `src/mcp-server/<domain>/env.ts` exporting `<domain>EnvSchema`, then in
   `src/config/env.ts` add `.merge(<domain>EnvSchema)`.
5. In `src/mcp-server/registry.ts`: add `{ path: '/<domain>', createServer: create<Domain>McpServer }`.

`index.ts` — **zero changes**, ever.
