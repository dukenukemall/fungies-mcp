import { z } from 'zod'
import { createHmac, timingSafeEqual } from 'node:crypto'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { FungiesClient } from '../fungies/client.js'
import { safely, toolJson } from './shared.js'

export function registerWebhooks(server: McpServer, client: FungiesClient) {
  server.registerTool(
    'webhooks_events',
    {
      description:
        'List recent webhook events that Fungies has attempted to deliver. Useful for auditing or retrying failed deliveries.',
      inputSchema: {
        skip: z.number().int().min(0).optional(),
        take: z.number().int().min(1).max(100).optional(),
      },
    },
    async (args) =>
      safely(
        () => client.getList('/webhooks/events/list', args),
        (r) => toolJson(r),
      ),
  )

  server.registerTool(
    'webhooks_verify',
    {
      description:
        'Verify a Fungies webhook signature locally. Pass the raw request body, the x-fngs-signature header, and your webhook secret. Returns { valid: boolean }. No network call.',
      inputSchema: {
        body: z.string().describe('Raw request body as received'),
        signature: z.string().describe('Value of the x-fngs-signature header'),
        secret: z.string().describe('Your webhook signing secret'),
      },
    },
    async ({ body, signature, secret }) => {
      const expected = createHmac('sha256', secret).update(body).digest('hex')
      const sig = signature.replace(/^sha256=/, '')
      const valid =
        expected.length === sig.length &&
        timingSafeEqual(Buffer.from(expected), Buffer.from(sig))
      return toolJson({ valid, algorithm: 'sha256' })
    },
  )
}
