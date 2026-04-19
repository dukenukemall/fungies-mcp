import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { FungiesClient } from '../fungies/client.js'
import type { Payment, PagedResult } from '../fungies/types.js'
import { FungiesId } from '../fungies/ids.js'
import { ANN, safely, strictShape, toolJson } from './shared.js'

export function registerPayments(server: McpServer, client: FungiesClient) {
  server.registerTool('payments_list', {
    title: 'List payments',
    description:
      'Use this when the user asks about payment transactions, refunds, or chargebacks. Filter by status: PAID, FAILED, REFUNDED, etc.',
    annotations: ANN.read,
    inputSchema: strictShape({
      skip: z.number().int().min(0).optional().describe('Pagination offset'),
      take: z.number().int().min(1).max(100).optional().describe('Page size 1-100'),
      statuses: z.string().optional().describe('Comma-separated statuses: PAID,FAILED,REFUNDED,...'),
    }),
  }, async (args) =>
    safely<PagedResult<Payment>>(
      () => client.getList<Payment>('/payments/list', args),
      (r) => toolJson({ count: r.count, hasMore: r.hasMore, items: r.items }),
    ),
  )

  server.registerTool('payments_get', {
    title: 'Get payment',
    description:
      'Use this for a single payment by UUID (includes fee, tax, currency, invoice URL). Useful for reconciliation or refund lookups.',
    annotations: ANN.read,
    inputSchema: strictShape({ id: FungiesId.describe('Payment UUID') }),
  }, async ({ id }) => safely(() => client.get<{ data: Payment }>(`/payments/${id}`), (r) => toolJson(r)))
}
