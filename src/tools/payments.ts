import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { FungiesClient } from '../fungies/client.js'
import type { Payment, PagedResult } from '../fungies/types.js'
import { safely, toolJson } from './shared.js'

export function registerPayments(server: McpServer, client: FungiesClient) {
  server.registerTool(
    'payments_list',
    {
      description:
        'List payment transactions (including refunds, chargebacks). Filter by status: PAID, FAILED, REFUNDED, etc.',
      inputSchema: {
        skip: z.number().int().min(0).optional(),
        take: z.number().int().min(1).max(100).optional(),
        statuses: z.string().optional(),
      },
    },
    async (args) =>
      safely<PagedResult<Payment>>(
        () => client.getList<Payment>('/payments/list', args),
        (r) => toolJson({ count: r.count, hasMore: r.hasMore, items: r.items }),
      ),
  )

  server.registerTool(
    'payments_get',
    {
      description: 'Fetch a single payment by UUID. Includes fee, tax, currency, invoice URL.',
      inputSchema: { id: z.string() },
    },
    async ({ id }) => safely(() => client.get<{ data: Payment }>(`/payments/${id}`), (r) => toolJson(r)),
  )
}
