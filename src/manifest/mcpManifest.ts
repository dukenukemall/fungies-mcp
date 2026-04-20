const VERSION = '0.2.4'

const PUBLIC_URL = process.env.MCP_PUBLIC_URL ?? 'https://mcp.fungies.io'

const TOOL_CATEGORIES = [
  { name: 'products', readOnly: 2, write: 3, destructive: 1 },
  { name: 'offers', readOnly: 2, write: 2, destructive: 1 },
  { name: 'offer_keys', readOnly: 0, write: 1, destructive: 1 },
  { name: 'orders', readOnly: 2, write: 0, destructive: 1 },
  { name: 'subscriptions', readOnly: 2, write: 4, destructive: 1 },
  { name: 'users', readOnly: 3, write: 3, destructive: 1 },
  { name: 'discounts', readOnly: 2, write: 2, destructive: 1 },
  { name: 'payments', readOnly: 2, write: 0, destructive: 0 },
  { name: 'elements', readOnly: 1, write: 1, destructive: 0 },
  { name: 'webhooks', readOnly: 1, write: 0, destructive: 0 },
] as const

function sumTools() {
  return TOOL_CATEGORIES.reduce(
    (acc, c) => ({
      readOnly: acc.readOnly + c.readOnly,
      write: acc.write + c.write,
      destructive: acc.destructive + c.destructive,
    }),
    { readOnly: 0, write: 0, destructive: 0 },
  )
}

export function buildMcpManifest() {
  const counts = sumTools()
  const total = counts.readOnly + counts.write + counts.destructive
  return {
    $schema: 'https://modelcontextprotocol.io/schemas/manifest/v1.json',
    name: 'fungies',
    displayName: 'Fungies MCP',
    version: VERSION,
    description:
      'Official Model Context Protocol server for the Fungies Merchant of Record platform. Manage products, offers, orders, subscriptions, customers, discounts, payments, checkout elements, and webhooks via natural language.',
    vendor: {
      name: 'Fungies',
      url: 'https://fungies.io',
    },
    transport: {
      type: 'streamable-http',
      endpoint: `${PUBLIC_URL}/mcp`,
    },
    auth: {
      type: 'api-keys',
      headers: {
        required: ['x-fngs-public-key'],
        optional: ['x-fngs-secret-key'],
      },
      keysUrl: 'https://app.fungies.io/devs/api-keys',
      notes:
        'Public key alone grants read-only access. Add the secret key to unlock all 40 tools including write and destructive operations.',
    },
    capabilities: { tools: true, resources: false, prompts: false },
    tools: {
      total,
      readOnly: counts.readOnly,
      write: counts.write,
      destructive: counts.destructive,
      categories: TOOL_CATEGORIES,
    },
    safety: {
      destructiveConfirmGate: true,
      originAllowlist: true,
      bodyLimitBytes: 262144,
      rateLimitPerKeyPerMinute: 300,
    },
    links: {
      docs: 'https://docs.fungies.io/api-reference/introduction',
      install: `${PUBLIC_URL}/install`,
      health: `${PUBLIC_URL}/healthz`,
      agentSkills: `${PUBLIC_URL}/.well-known/agent-skills/index.json`,
      repository: 'https://github.com/dukenukemall/fungies-mcp',
      issues: 'https://github.com/dukenukemall/fungies-mcp/issues',
      support: 'https://help.fungies.io',
    },
  }
}
