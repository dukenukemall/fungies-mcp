import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { FungiesClient } from '../fungies/client.js'
import type { Discount, PagedResult } from '../fungies/types.js'
import { audit, requireConfirm, safely, toolJson } from './shared.js'

export function registerDiscounts(server: McpServer, client: FungiesClient) {
  server.registerTool(
    'discounts_list',
    {
      description: 'List discounts (coupon codes and sale discounts). Filter by status: active, archived.',
      inputSchema: {
        skip: z.number().int().min(0).optional(),
        take: z.number().int().min(1).max(100).optional(),
        status: z.enum(['active', 'archived']).optional(),
      },
    },
    async (args) =>
      safely<PagedResult<Discount>>(
        () => client.getList<Discount>('/discounts/list', args),
        (r) => toolJson({ count: r.count, hasMore: r.hasMore, items: r.items }),
      ),
  )

  server.registerTool(
    'discounts_get',
    {
      description: 'Fetch a single discount by UUID.',
      inputSchema: { id: z.string() },
    },
    async ({ id }) => safely(() => client.get<{ data: Discount }>(`/discounts/${id}`), (r) => toolJson(r)),
  )

  if (!client.hasSecret) return

  server.registerTool(
    'discounts_create',
    {
      description: 'Create a discount. Type: coupon or sale. AmountType: percentage or fixed.',
      inputSchema: {
        name: z.string(),
        type: z.enum(['coupon', 'sale']),
        amountType: z.enum(['percentage', 'fixed']),
        amount: z.number().positive(),
        discountCode: z.string().optional().describe('Required for type=coupon'),
        currency: z.string().length(3).optional(),
        validFrom: z.number().int().optional(),
        validUntil: z.number().int().optional(),
      },
    },
    async (args) => {
      audit(client, 'discounts_create', args)
      return safely(() => client.post<{ data: Discount }>('/discounts/create', args), (r) => toolJson(r))
    },
  )

  server.registerTool(
    'discounts_update',
    {
      description: 'Update a discount.',
      inputSchema: {
        id: z.string(),
        name: z.string().optional(),
        validFrom: z.number().int().optional(),
        validUntil: z.number().int().optional(),
      },
    },
    async ({ id, ...patch }) => {
      audit(client, 'discounts_update', { id, ...patch })
      return safely(() => client.patch<{ data: Discount }>(`/discounts/${id}/update`, patch), (r) => toolJson(r))
    },
  )

  server.registerTool(
    'discounts_archive',
    {
      description: 'Archive a discount (soft delete, reversible). Pass confirm: true.',
      inputSchema: { id: z.string(), confirm: z.boolean().optional() },
    },
    async ({ id, confirm }) => {
      const refuse = requireConfirm(confirm, 'discounts_archive')
      if (refuse) return refuse
      audit(client, 'discounts_archive', { id })
      return safely(() => client.patch<{ data: Discount }>(`/discounts/${id}/archive`, {}), (r) => toolJson(r))
    },
  )
}
