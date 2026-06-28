import express, { type Request, type Response } from 'express';
import { env } from './src/config/env.js';
import { corsMiddleware } from './src/mcp-server/shared/corsMiddleware.js';
import { createMcpRouter } from './src/mcp-server/shared/createMcpRouter.js';
import { mcpServerRoutes } from './src/mcp-server/registry.js';

const app = express();
app.use(express.json());
app.use(corsMiddleware);

app.get('/', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    servers: mcpServerRoutes.map((r) => `${r.path}/mcp`),
  });
});

for (const route of mcpServerRoutes) {
  app.use(route.path, createMcpRouter(route.createServer));
}

app.listen(env.PORT, () => {
  console.log(`MCP servers listening on port ${env.PORT}`);
  for (const route of mcpServerRoutes) {
    console.log(`  ${route.path}/mcp`);
  }
});
