import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { FungiesClient } from '../fungies/client.js'
import type { Discount, PagedResult } from '../fungies/types.js'
import { FungiesId } from '../fungies/ids.js'
import { ANN, audit, requireConfirm, safely, strictShape, toolJson } from './shared.js'

const ID = FungiesId.describe('Discount UUID')

export function registerDiscounts(server: McpServer, client: FungiesClient) {
  server.registerTool('discounts_list', {
    title: 'List discounts',
    description:
      'Use this when the user asks about coupon codes or sale discounts in the store. Filter by status: active or archived.',
    annotations: ANN.read,
    inputSchema: strictShape({
      skip: z.number().int().min(0).optional().describe('Pagination offset'),
      take: z.number().int().min(1).max(100).optional().describe('Page size 1-100'),
      status: z.enum(['active', 'archived']).optional().describe('Lifecycle status filter'),
    }),
  }, async (args) =>
    safely<PagedResult<Discount>>(
      () => client.getList<Discount>('/discounts/list', args),
      (r) => toolJson({ count: r.count, hasMore: r.hasMore, items: r.items }),
    ),
  )

  server.registerTool('discounts_get', {
    title: 'Get discount',
    description: 'Use this when the user wants full details of a specific coupon or sale discount.',
    annotations: ANN.read,
    inputSchema: strictShape({ id: ID }),
  }, async ({ id }) => safely(() => client.get<{ data: Discount }>(`/discounts/${id}`), (r) => toolJson(r)))

  if (!client.hasSecret) return

  server.registerTool('discounts_create', {
    title: 'Create discount',
    description:
      'Use this to create a coupon (redeemable with a code) or a sale discount (applied automatically). amountType picks percentage vs fixed.',
    annotations: ANN.create,
    inputSchema: strictShape({
      name: z.string().describe('Internal name for the discount'),
      type: z.enum(['coupon', 'sale']).describe('coupon = code-redeemable, sale = auto-applied'),
      amountType: z.enum(['percentage', 'fixed']).describe('percentage = % off, fixed = currency amount off'),
      amount: z.number().positive().describe('Discount amount: % (e.g. 25) or minor units for fixed (e.g. 500 = $5.00)'),
      discountCode: z.string().optional().describe('Redeem code (required when type = coupon)'),
      currency: z.string().length(3).optional().describe('Required when amountType = fixed (ISO-4217)'),
      validFrom: z.number().int().optional().describe('Unix epoch seconds; discount becomes active at this time'),
      validUntil: z.number().int().optional().describe('Unix epoch seconds; discount expires at this time'),
    }),
  }, async (args) => {
    audit(client, 'discounts_create', args)
    return safely(() => client.post<{ data: Discount }>('/discounts/create', args), (r) => toolJson(r))
  })

  server.registerTool('discounts_update', {
    title: 'Update discount',
    description: 'Use this to rename a discount or adjust its validity window.',
    annotations: ANN.update,
    inputSchema: strictShape({
      id: ID,
      name: z.string().optional().describe('New internal name'),
      validFrom: z.number().int().optional().describe('New start time (unix seconds)'),
      validUntil: z.number().int().optional().describe('New end time (unix seconds)'),
    }),
  }, async ({ id, ...patch }) => {
    audit(client, 'discounts_update', { id, ...patch })
    return safely(() => client.patch<{ data: Discount }>(`/discounts/${id}/update`, patch), (r) => toolJson(r))
  })

  server.registerTool('discounts_archive', {
    title: 'Archive discount',
    description: 'Use this to retire a discount. Soft delete (reversible). Requires confirm: true.',
    annotations: ANN.destructive,
    inputSchema: strictShape({ id: ID, confirm: z.boolean().optional().describe('Must be true — destructive action') }),
  }, async ({ id, confirm }) => {
    const refuse = requireConfirm(confirm, 'discounts_archive')
    if (refuse) return refuse
    audit(client, 'discounts_archive', { id })
    return safely(() => client.patch<{ data: Discount }>(`/discounts/${id}/archive`, {}), (r) => toolJson(r))
  })
}
