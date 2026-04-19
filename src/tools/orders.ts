import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { FungiesClient } from '../fungies/client.js'
import type { Order, PagedResult } from '../fungies/types.js'
import { FungiesId } from '../fungies/ids.js'
import { ANN, audit, requireConfirm, safely, strictShape, toolJson } from './shared.js'

const ID = FungiesId.describe('Order UUID or short order number')

export function registerOrders(server: McpServer, client: FungiesClient) {
  server.registerTool('orders_list', {
    title: 'List orders',
    description:
      'Use this when the user asks about recent orders, revenue, or needs to locate orders by status or date. Returns { count, hasMore, items }.',
    annotations: ANN.read,
    inputSchema: strictShape({
      skip: z.number().int().min(0).optional().describe('Pagination offset'),
      take: z.number().int().min(1).max(100).optional().describe('Page size 1-100'),
      statuses: z.string().optional().describe('Comma-separated statuses: PAID,PENDING,CANCELLED,REFUNDED,FAILED'),
      createdFrom: z.string().optional().describe('ISO date lower bound, e.g. 2025-01-01'),
    }),
  }, async (args) =>
    safely<PagedResult<Order>>(
      () => client.getList<Order>('/orders/list', args),
      (r) => toolJson({ count: r.count, hasMore: r.hasMore, items: r.items }),
    ),
  )

  server.registerTool('orders_get', {
    title: 'Get order',
    description:
      'Use this when the user references a specific order by UUID or short order number (e.g. 9XMrb9HkzBPcLIaJ) and wants full details.',
    annotations: ANN.read,
    inputSchema: strictShape({ id: ID }),
  }, async ({ id }) => safely(() => client.get<{ data: Order }>(`/orders/${id}`), (r) => toolJson(r)))

  if (!client.hasSecret) return

  server.registerTool('orders_cancel', {
    title: 'Cancel order',
    description:
      'Use this when the user wants to cancel a pending order. Marks status CANCELLED. Does NOT refund the customer automatically. Requires confirm: true.',
    annotations: ANN.destructive,
    inputSchema: strictShape({
      id: ID,
      confirm: z.boolean().optional().describe('Must be true — destructive action'),
    }),
  }, async ({ id, confirm }) => {
    const refuse = requireConfirm(confirm, 'orders_cancel')
    if (refuse) return refuse
    audit(client, 'orders_cancel', { id })
    return safely(() => client.patch<{ data: Order }>(`/orders/${id}/cancel`, {}), (r) => toolJson(r))
  })
}
