import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { FungiesClient } from '../fungies/client.js'
import type { Order, PagedResult } from '../fungies/types.js'
import { audit, requireConfirm, safely, toolJson } from './shared.js'

export function registerOrders(server: McpServer, client: FungiesClient) {
  server.registerTool(
    'orders_list',
    {
      description: 'List orders. Filter by status (PAID, PENDING, CANCELLED, REFUNDED, FAILED) or creation date.',
      inputSchema: {
        skip: z.number().int().min(0).optional(),
        take: z.number().int().min(1).max(100).optional(),
        statuses: z.string().optional().describe('Comma-separated statuses'),
        createdFrom: z.string().optional().describe('ISO date, e.g. 2025-01-01'),
      },
    },
    async (args) =>
      safely<PagedResult<Order>>(
        () => client.getList<Order>('/orders/list', args),
        (r) => toolJson({ count: r.count, hasMore: r.hasMore, items: r.items }),
      ),
  )

  server.registerTool(
    'orders_get',
    {
      description: 'Fetch a single order by UUID or order number (e.g. 9XMrb9HkzBPcLIaJ).',
      inputSchema: { id: z.string().describe('Order UUID or short order number') },
    },
    async ({ id }) => safely(() => client.get<{ data: Order }>(`/orders/${id}`), (r) => toolJson(r)),
  )

  if (!client.hasSecret) return

  server.registerTool(
    'orders_cancel',
    {
      description:
        'Cancel an order. Sets status to CANCELLED but does NOT refund the customer automatically. Pass confirm: true.',
      inputSchema: { id: z.string(), confirm: z.boolean().optional() },
    },
    async ({ id, confirm }) => {
      const refuse = requireConfirm(confirm, 'orders_cancel')
      if (refuse) return refuse
      audit(client, 'orders_cancel', { id })
      return safely(() => client.patch<{ data: Order }>(`/orders/${id}/cancel`, {}), (r) => toolJson(r))
    },
  )
}
