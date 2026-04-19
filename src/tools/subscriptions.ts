import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { FungiesClient } from '../fungies/client.js'
import type { Subscription, Payment, PagedResult } from '../fungies/types.js'
import { audit, requireConfirm, safely, toolJson } from './shared.js'

export function registerSubscriptions(server: McpServer, client: FungiesClient) {
  server.registerTool(
    'subscriptions_list',
    {
      description: 'List subscriptions. Filter by status: active, canceled, paused, past_due, or all.',
      inputSchema: {
        skip: z.number().int().min(0).optional(),
        take: z.number().int().min(1).max(100).optional(),
        status: z.string().optional(),
      },
    },
    async (args) =>
      safely<PagedResult<Subscription>>(
        () => client.getList<Subscription>('/subscriptions/list', args),
        (r) => toolJson({ count: r.count, hasMore: r.hasMore, items: r.items }),
      ),
  )

  server.registerTool(
    'subscriptions_get',
    {
      description: 'Fetch a single subscription by UUID. Returns status, current interval end, cancel date.',
      inputSchema: { id: z.string() },
    },
    async ({ id }) => safely(() => client.get<{ data: Subscription }>(`/subscriptions/${id}`), (r) => toolJson(r)),
  )

  if (!client.hasSecret) return

  server.registerTool(
    'subscriptions_create',
    {
      description: 'Create a subscription programmatically (e.g. migration, backfill). Pass raw payload per Fungies API.',
      inputSchema: { payload: z.record(z.unknown()).describe('Subscription create payload') },
    },
    async ({ payload }) => {
      audit(client, 'subscriptions_create', {})
      return safely(() => client.post<{ data: Subscription }>('/subscriptions/create', payload), (r) => toolJson(r))
    },
  )

  server.registerTool(
    'subscriptions_update',
    {
      description: 'Update a subscription (e.g. upgrade/downgrade plan). Pass raw patch per Fungies API.',
      inputSchema: { id: z.string(), payload: z.record(z.unknown()) },
    },
    async ({ id, payload }) => {
      audit(client, 'subscriptions_update', { id })
      return safely(() => client.patch<{ data: Subscription }>(`/subscriptions/${id}/update`, payload), (r) => toolJson(r))
    },
  )

  server.registerTool(
    'subscriptions_cancel',
    {
      description: 'Cancel a subscription at end of current period (default) or immediately. Pass confirm: true.',
      inputSchema: {
        id: z.string(),
        immediately: z.boolean().optional(),
        refund: z.boolean().optional(),
        confirm: z.boolean().optional(),
      },
    },
    async ({ id, confirm, ...body }) => {
      const refuse = requireConfirm(confirm, 'subscriptions_cancel')
      if (refuse) return refuse
      audit(client, 'subscriptions_cancel', { id, ...body })
      return safely(() => client.patch<{ data: Subscription }>(`/subscriptions/${id}/cancel`, body), (r) => toolJson(r))
    },
  )

  server.registerTool(
    'subscriptions_pause',
    {
      description: 'Pause payment collection. Access is maintained; only billing is paused.',
      inputSchema: { id: z.string() },
    },
    async ({ id }) => {
      audit(client, 'subscriptions_pause', { id })
      return safely(() => client.patch<{ data: Subscription }>(`/subscriptions/${id}/pauseCollection`, {}), (r) => toolJson(r))
    },
  )

  server.registerTool(
    'subscriptions_charge',
    {
      description: 'Charge a one-time extra on top of an existing subscription (usage-based billing). Amount is in minor units.',
      inputSchema: {
        id: z.string(),
        amount: z.number().int().positive().describe('Amount in minor units (200 = €2.00)'),
        currency: z.string().length(3),
      },
    },
    async ({ id, amount, currency }) => {
      audit(client, 'subscriptions_charge', { id, amount, currency })
      return safely(() => client.post<{ data: Payment }>(`/subscriptions/${id}/charge`, { amount, currency }), (r) => toolJson(r))
    },
  )
}
