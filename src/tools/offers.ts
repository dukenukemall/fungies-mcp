import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { FungiesClient } from '../fungies/client.js'
import type { Offer, PagedResult } from '../fungies/types.js'
import { FungiesId } from '../fungies/ids.js'
import { ANN, audit, requireConfirm, safely, strictShape, toolJson } from './shared.js'

const ID = FungiesId.describe('Offer UUID')

export function registerOffers(server: McpServer, client: FungiesClient) {
  server.registerTool('offers_list', {
    title: 'List offers',
    description:
      'Use this when the user asks to browse or filter offers (price points). Filter by product to see every offer for a given product.',
    annotations: ANN.read,
    inputSchema: strictShape({
      skip: z.number().int().min(0).optional().describe('Pagination offset'),
      take: z.number().int().min(1).max(100).optional().describe('Page size 1-100'),
      product: FungiesId.optional().describe('Filter by product UUID'),
      termOrId: z.string().optional().describe('Fuzzy search by name or exact offer UUID'),
    }),
  }, async (args) =>
    safely<PagedResult<Offer>>(
      () => client.getList<Offer>('/offers/list', args),
      (r) => toolJson({ count: r.count, hasMore: r.hasMore, items: r.items }),
    ),
  )

  server.registerTool('offers_get', {
    title: 'Get offer',
    description:
      'Use this when the user wants full details of a single offer (price, currency, recurring interval, key inventory).',
    annotations: ANN.read,
    inputSchema: strictShape({ id: ID }),
  }, async ({ id }) => safely(() => client.get<{ data: Offer }>(`/offers/${id}`), (r) => toolJson(r)))

  if (!client.hasSecret) return

  server.registerTool('offers_create', {
    title: 'Create offer',
    description:
      'Use this to add a price point to a product. Price is in minor units (999 = $9.99). Price and currency are immutable after creation.',
    annotations: ANN.create,
    inputSchema: strictShape({
      productId: FungiesId.describe('Product UUID to attach this offer to'),
      price: z.number().int().min(0).describe('Price in minor units (999 = $9.99)'),
      currency: z.string().length(3).describe('ISO-4217 currency code (USD, EUR, GBP...)'),
      name: z.string().optional().describe('Optional display name shown on checkout'),
      recurringInterval: z.enum(['day', 'week', 'month', 'year']).optional().describe('Set for subscription offers'),
      recurringIntervalCount: z.number().int().positive().optional().describe('e.g. 3 + interval=month = quarterly'),
    }),
  }, async (args) => {
    audit(client, 'offers_create', args)
    return safely(() => client.post<{ data: Offer }>('/offers/create', args), (r) => toolJson(r))
  })

  server.registerTool('offers_update', {
    title: 'Update offer',
    description: 'Use this to rename an offer. Price and currency cannot be changed after creation.',
    annotations: ANN.update,
    inputSchema: strictShape({ id: ID, name: z.string().optional().describe('New display name') }),
  }, async ({ id, ...patch }) => {
    audit(client, 'offers_update', { id, ...patch })
    return safely(() => client.patch<{ data: Offer }>(`/offers/${id}/update`, patch), (r) => toolJson(r))
  })

  server.registerTool('offers_archive', {
    title: 'Archive offer',
    description:
      'Use this to retire an offer. Soft delete; existing subscriptions continue but new purchases are blocked. Requires confirm: true.',
    annotations: ANN.destructive,
    inputSchema: strictShape({ id: ID, confirm: z.boolean().optional().describe('Must be true — destructive action') }),
  }, async ({ id, confirm }) => {
    const refuse = requireConfirm(confirm, 'offers_archive')
    if (refuse) return refuse
    audit(client, 'offers_archive', { id })
    return safely(() => client.patch<{ data: Offer }>(`/offers/${id}/archive`, {}), (r) => toolJson(r))
  })
}
