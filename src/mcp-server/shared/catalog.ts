import type { McpServerRoute } from '../registry.js';

export interface ToolCatalogEntry {
  domain: string;
  /** Full mounted path, e.g. '/screener/mcp'. */
  route: string;
  name: string;
  title: string;
  description: string;
  deprecated: boolean;
  enabled: boolean;
}

/**
 * Flattens every domain's tool manifest into one list — handy for the
 * health-check route (see root index.ts) and for onboarding ("what tools
 * does this server expose, across every domain, right now?") once there
 * are 30-50 of them spread across domains.
 */
export function buildToolCatalog(routes: McpServerRoute[]): ToolCatalogEntry[] {
  return routes.flatMap((route) =>
    route.toolDefinitions.map((tool) => ({
      domain: route.domain,
      route: `${route.path}/mcp`,
      name: tool.name,
      title: tool.title,
      description: tool.description,
      deprecated: Boolean(tool.deprecated),
      enabled: tool.isEnabled ? tool.isEnabled() : true,
    }))
  );
}

/**
 * Fails fast at startup if two tools — in the same domain or across
 * different domains — share a name. Tool names are meant to be unique
 * across the whole server: the catalog above lists every domain together,
 * and a client could in principle be connected to more than one of this
 * server's domain routes at once, so a collision would be confusing at
 * best and silently shadow a tool at worst.
 */
export function assertNoToolNameCollisions(routes: McpServerRoute[]): void {
  const ownerByName = new Map<string, string>();

  for (const route of routes) {
    for (const tool of route.toolDefinitions) {
      const existingDomain = ownerByName.get(tool.name);
      if (existingDomain) {
        throw new Error(
          `Tool name collision: "${tool.name}" is defined in both ` +
            `"${existingDomain}" and "${route.domain}". Tool names must be ` +
            'unique across the entire server — rename one of them.'
        );
      }
      ownerByName.set(tool.name, route.domain);
    }
  }
}
