import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { FungiesClient } from '../fungies/client.js'
import type { Offer, PagedResult } from '../fungies/types.js'
import { audit, requireConfirm, safely, toolJson } from './shared.js'

export function registerOffers(server: McpServer, client: FungiesClient) {
  server.registerTool(
    'offers_list',
    {
      description: 'List offers (price points) in the store. Filter by product to see all offers for a given product.',
      inputSchema: {
        skip: z.number().int().min(0).optional(),
        take: z.number().int().min(1).max(100).optional(),
        product: z.string().optional().describe('Product ID to filter by'),
        termOrId: z.string().optional(),
      },
    },
    async (args) =>
      safely<PagedResult<Offer>>(
        () => client.getList<Offer>('/offers/list', args),
        (r) => toolJson({ count: r.count, hasMore: r.hasMore, items: r.items }),
      ),
  )

  server.registerTool(
    'offers_get',
    {
      description: 'Fetch a single offer by UUID. Returns price, currency, recurring interval, and key inventory.',
      inputSchema: { id: z.string() },
    },
    async ({ id }) => safely(() => client.get<{ data: Offer }>(`/offers/${id}`), (r) => toolJson(r)),
  )

  if (!client.hasSecret) return

  server.registerTool(
    'offers_create',
    {
      description: 'Create an offer for a product. Required: productId, price (in minor units, e.g. 999 for $9.99), currency.',
      inputSchema: {
        productId: z.string(),
        price: z.number().int().min(0),
        currency: z.string().length(3),
        name: z.string().optional(),
        recurringInterval: z.enum(['day', 'week', 'month', 'year']).optional(),
        recurringIntervalCount: z.number().int().positive().optional(),
      },
    },
    async (args) => {
      audit(client, 'offers_create', args)
      return safely(() => client.post<{ data: Offer }>('/offers/create', args), (r) => toolJson(r))
    },
  )

  server.registerTool(
    'offers_update',
    {
      description: 'Update an offer. Price and currency cannot be changed after creation.',
      inputSchema: {
        id: z.string(),
        name: z.string().optional(),
      },
    },
    async ({ id, ...patch }) => {
      audit(client, 'offers_update', { id, ...patch })
      return safely(() => client.patch<{ data: Offer }>(`/offers/${id}/update`, patch), (r) => toolJson(r))
    },
  )

  server.registerTool(
    'offers_archive',
    {
      description: 'Archive an offer (soft delete). Existing subscriptions on this offer continue. Pass confirm: true.',
      inputSchema: { id: z.string(), confirm: z.boolean().optional() },
    },
    async ({ id, confirm }) => {
      const refuse = requireConfirm(confirm, 'offers_archive')
      if (refuse) return refuse
      audit(client, 'offers_archive', { id })
      return safely(() => client.patch<{ data: Offer }>(`/offers/${id}/archive`, {}), (r) => toolJson(r))
    },
  )

  server.registerTool(
    'offers_keys_add',
    {
      description: 'Add license/game keys to an offer inventory. Keys are auto-assigned to customers at purchase.',
      inputSchema: { offerId: z.string(), keys: z.array(z.string()).min(1) },
    },
    async ({ offerId, keys }) => {
      audit(client, 'offers_keys_add', { offerId, keyCount: keys.length })
      return safely(() => client.post(`/offers/${offerId}/keys/add`, { keys }), (r) => toolJson(r))
    },
  )

  server.registerTool(
    'offers_keys_remove',
    {
      description: 'Remove an unsold key from an offer. Sold keys are preserved. Pass confirm: true.',
      inputSchema: { offerId: z.string(), keyId: z.string(), confirm: z.boolean().optional() },
    },
    async ({ offerId, keyId, confirm }) => {
      const refuse = requireConfirm(confirm, 'offers_keys_remove')
      if (refuse) return refuse
      audit(client, 'offers_keys_remove', { offerId, keyId })
      return safely(() => client.delete(`/offers/${offerId}/keys/${keyId}/removeUnsold`), (r) => toolJson(r))
    },
  )
}
