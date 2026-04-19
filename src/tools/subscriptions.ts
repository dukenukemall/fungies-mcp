import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { FungiesClient } from '../fungies/client.js'
import type { Subscription, Payment, PagedResult } from '../fungies/types.js'
import { ANN, audit, requireConfirm, safely, toolJson } from './shared.js'

const ID = z.string().describe('Subscription UUID')

export function registerSubscriptions(server: McpServer, client: FungiesClient) {
  server.registerTool('subscriptions_list', {
    title: 'List subscriptions',
    description:
      'Use this when the user asks about active, paused, cancelled, or past-due subscriptions. Filter by status or paginate with skip/take.',
    annotations: ANN.read,
    inputSchema: {
      skip: z.number().int().min(0).optional().describe('Pagination offset'),
      take: z.number().int().min(1).max(100).optional().describe('Page size 1-100'),
      status: z.string().optional().describe('active | canceled | paused | past_due | all'),
    },
  }, async (args) =>
    safely<PagedResult<Subscription>>(
      () => client.getList<Subscription>('/subscriptions/list', args),
      (r) => toolJson({ count: r.count, hasMore: r.hasMore, items: r.items }),
    ),
  )

  server.registerTool('subscriptions_get', {
    title: 'Get subscription',
    description:
      'Use this when the user wants full details of a specific subscription (status, current period, cancel date, offer).',
    annotations: ANN.read,
    inputSchema: { id: ID },
  }, async ({ id }) => safely(() => client.get<{ data: Subscription }>(`/subscriptions/${id}`), (r) => toolJson(r)))

  if (!client.hasSecret) return

  server.registerTool('subscriptions_create', {
    title: 'Create subscription',
    description: 'Use this to backfill/migrate a subscription. Pass the raw payload per the Fungies API reference.',
    annotations: ANN.create,
    inputSchema: { payload: z.record(z.unknown()).describe('Raw /v0/subscriptions/create payload') },
  }, async ({ payload }) => {
    audit(client, 'subscriptions_create', {})
    return safely(() => client.post<{ data: Subscription }>('/subscriptions/create', payload), (r) => toolJson(r))
  })

  server.registerTool('subscriptions_update', {
    title: 'Update subscription',
    description: 'Use this to upgrade/downgrade a plan or change billing details. Pass a raw patch per Fungies API.',
    annotations: ANN.update,
    inputSchema: { id: ID, payload: z.record(z.unknown()).describe('Raw update payload') },
  }, async ({ id, payload }) => {
    audit(client, 'subscriptions_update', { id })
    return safely(() => client.patch<{ data: Subscription }>(`/subscriptions/${id}/update`, payload), (r) => toolJson(r))
  })

  server.registerTool('subscriptions_cancel', {
    title: 'Cancel subscription',
    description:
      'Use this when the user wants to cancel a subscription at period end (default) or immediately. Requires confirm: true.',
    annotations: ANN.destructive,
    inputSchema: {
      id: ID,
      immediately: z.boolean().optional().describe('If true, cancel now instead of end-of-period'),
      refund: z.boolean().optional().describe('If true, issue refund for the current period'),
      confirm: z.boolean().optional().describe('Must be true — destructive action'),
    },
  }, async ({ id, confirm, ...body }) => {
    const refuse = requireConfirm(confirm, 'subscriptions_cancel')
    if (refuse) return refuse
    audit(client, 'subscriptions_cancel', { id, ...body })
    return safely(() => client.patch<{ data: Subscription }>(`/subscriptions/${id}/cancel`, body), (r) => toolJson(r))
  })

  server.registerTool('subscriptions_pause', {
    title: 'Pause subscription billing',
    description: 'Use this to pause payment collection while keeping access active. Reversible.',
    annotations: ANN.update,
    inputSchema: { id: ID },
  }, async ({ id }) => {
    audit(client, 'subscriptions_pause', { id })
    return safely(() => client.patch<{ data: Subscription }>(`/subscriptions/${id}/pauseCollection`, {}), (r) => toolJson(r))
  })

  server.registerTool('subscriptions_charge', {
    title: 'Charge subscription extra',
    description:
      'Use this for usage-based billing: charge a one-time amount on top of an existing subscription. Amount is in minor units.',
    annotations: ANN.create,
    inputSchema: {
      id: ID,
      amount: z.number().int().positive().describe('Amount in minor units (200 = €2.00)'),
      currency: z.string().length(3).describe('ISO-4217 currency code'),
    },
  }, async ({ id, amount, currency }) => {
    audit(client, 'subscriptions_charge', { id, amount, currency })
    return safely(() => client.post<{ data: Payment }>(`/subscriptions/${id}/charge`, { amount, currency }), (r) => toolJson(r))
  })
}
