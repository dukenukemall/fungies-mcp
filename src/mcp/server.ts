import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { FungiesClient } from '../fungies/client.js'
import type { AuthContext } from '../auth/keys.js'
import { registerTools } from '../tools/index.js'

export interface CreateServerOptions {
  auth: AuthContext
}

export function createMcpServer({ auth }: CreateServerOptions): McpServer {
  const server = new McpServer(
    {
      name: 'fungies',
      version: '0.2.2',
    },
    {
      capabilities: {
        tools: {},
      },
      instructions: [
        'Fungies MCP server - manage your Fungies store (products, offers, orders, subscriptions, users, discounts, payments, elements, webhooks).',
        auth.hasSecret
          ? 'Full read+write access is enabled (x-fngs-secret-key provided).'
          : 'Read-only mode: provide x-fngs-secret-key in headers to unlock write operations.',
      ].join(' '),
    },
  )

  const client = new FungiesClient({ publicKey: auth.publicKey, secretKey: auth.secretKey })
  registerTools(server, client)
  return server
}
