import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { FungiesClient } from '../fungies/client.js'
import type { User, PagedResult } from '../fungies/types.js'
import { audit, requireConfirm, safely, toolJson } from './shared.js'

export function registerUsers(server: McpServer, client: FungiesClient) {
  server.registerTool(
    'users_list',
    {
      description: 'List customers in the Fungies store. Filter by email or name via term.',
      inputSchema: {
        skip: z.number().int().min(0).optional(),
        take: z.number().int().min(1).max(100).optional(),
        term: z.string().optional().describe('Search by email or username'),
      },
    },
    async (args) =>
      safely<PagedResult<User>>(
        () => client.getList<User>('/users/list', args),
        (r) => toolJson({ count: r.count, hasMore: r.hasMore, items: r.items }),
      ),
  )

  server.registerTool(
    'users_get',
    {
      description: 'Fetch a single customer by UUID.',
      inputSchema: { id: z.string() },
    },
    async ({ id }) => safely(() => client.get<{ data: User }>(`/users/${id}`), (r) => toolJson(r)),
  )

  server.registerTool(
    'users_inventory',
    {
      description: 'View everything a customer has purchased: products, subscriptions, access items.',
      inputSchema: { id: z.string() },
    },
    async ({ id }) => safely(() => client.get(`/users/${id}/inventory`), (r) => toolJson(r)),
  )

  if (!client.hasSecret) return

  server.registerTool(
    'users_create',
    {
      description: 'Create a new customer. Email must be unique. Include postalCode for US/CA/UA/IN.',
      inputSchema: {
        email: z.string().email(),
        username: z.string().optional(),
        billingDetails: z.record(z.unknown()).optional(),
      },
    },
    async (args) => {
      audit(client, 'users_create', args)
      return safely(() => client.post<{ data: User }>('/users/create', args), (r) => toolJson(r))
    },
  )

  server.registerTool(
    'users_update',
    {
      description: 'Update a customer. Pass only the fields to change.',
      inputSchema: {
        id: z.string(),
        email: z.string().email().optional(),
        username: z.string().optional(),
        billingDetails: z.record(z.unknown()).optional(),
      },
    },
    async ({ id, ...patch }) => {
      audit(client, 'users_update', { id, ...patch })
      return safely(() => client.patch<{ data: User }>(`/users/${id}/update`, patch), (r) => toolJson(r))
    },
  )

  server.registerTool(
    'users_archive',
    {
      description: 'Archive a customer (soft delete, reversible). Pass confirm: true.',
      inputSchema: { id: z.string(), confirm: z.boolean().optional() },
    },
    async ({ id, confirm }) => {
      const refuse = requireConfirm(confirm, 'users_archive')
      if (refuse) return refuse
      audit(client, 'users_archive', { id })
      return safely(() => client.patch<{ data: User }>(`/users/${id}/archive`, {}), (r) => toolJson(r))
    },
  )

  server.registerTool(
    'users_unarchive',
    {
      description: 'Restore a previously archived customer.',
      inputSchema: { id: z.string() },
    },
    async ({ id }) => {
      audit(client, 'users_unarchive', { id })
      return safely(() => client.patch<{ data: User }>(`/users/${id}/unarchive`, {}), (r) => toolJson(r))
    },
  )
}
