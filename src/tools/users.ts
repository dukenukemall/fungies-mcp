import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { FungiesClient } from '../fungies/client.js'
import type { User, PagedResult } from '../fungies/types.js'
import { ANN, audit, requireConfirm, safely, toolJson } from './shared.js'

const ID = z.string().describe('Customer UUID')

export function registerUsers(server: McpServer, client: FungiesClient) {
  server.registerTool('users_list', {
    title: 'List customers',
    description:
      'Use this when the user wants to browse or find customers. Supports fuzzy search by email or username via `term`.',
    annotations: ANN.read,
    inputSchema: {
      skip: z.number().int().min(0).optional().describe('Pagination offset'),
      take: z.number().int().min(1).max(100).optional().describe('Page size 1-100'),
      term: z.string().optional().describe('Fuzzy search by email or username'),
    },
  }, async (args) =>
    safely<PagedResult<User>>(
      () => client.getList<User>('/users/list', args),
      (r) => toolJson({ count: r.count, hasMore: r.hasMore, items: r.items }),
    ),
  )

  server.registerTool('users_get', {
    title: 'Get customer',
    description: 'Use this when the user references a specific customer by UUID and wants the full profile.',
    annotations: ANN.read,
    inputSchema: { id: ID },
  }, async ({ id }) => safely(() => client.get<{ data: User }>(`/users/${id}`), (r) => toolJson(r)))

  server.registerTool('users_inventory', {
    title: 'Get customer inventory',
    description:
      'Use this when the user asks "what does this customer own?" — returns every product, subscription, and access item the customer has purchased.',
    annotations: ANN.read,
    inputSchema: { id: ID },
  }, async ({ id }) => safely(() => client.get(`/users/${id}/inventory`), (r) => toolJson(r)))

  if (!client.hasSecret) return

  server.registerTool('users_create', {
    title: 'Create customer',
    description:
      'Use this to create a customer record (e.g. migration, manual entry). Email must be unique. Include postalCode for US/CA/UA/IN.',
    annotations: ANN.create,
    inputSchema: {
      email: z.string().email().describe('Customer email, unique across the store'),
      username: z.string().optional().describe('Optional display name'),
      billingDetails: z.record(z.unknown()).optional().describe('Optional billing details (name, address, taxId, etc.)'),
    },
  }, async (args) => {
    audit(client, 'users_create', args)
    return safely(() => client.post<{ data: User }>('/users/create', args), (r) => toolJson(r))
  })

  server.registerTool('users_update', {
    title: 'Update customer',
    description: 'Use this to edit a customer profile. Pass only the fields to change.',
    annotations: ANN.update,
    inputSchema: {
      id: ID,
      email: z.string().email().optional().describe('New email'),
      username: z.string().optional().describe('New display name'),
      billingDetails: z.record(z.unknown()).optional().describe('New billing details object'),
    },
  }, async ({ id, ...patch }) => {
    audit(client, 'users_update', { id, ...patch })
    return safely(() => client.patch<{ data: User }>(`/users/${id}/update`, patch), (r) => toolJson(r))
  })

  server.registerTool('users_archive', {
    title: 'Archive customer',
    description: 'Use this to soft-delete a customer (reversible via users_unarchive). Requires confirm: true.',
    annotations: ANN.destructive,
    inputSchema: { id: ID, confirm: z.boolean().optional().describe('Must be true — destructive action') },
  }, async ({ id, confirm }) => {
    const refuse = requireConfirm(confirm, 'users_archive')
    if (refuse) return refuse
    audit(client, 'users_archive', { id })
    return safely(() => client.patch<{ data: User }>(`/users/${id}/archive`, {}), (r) => toolJson(r))
  })

  server.registerTool('users_unarchive', {
    title: 'Unarchive customer',
    description: 'Use this to restore a previously archived customer.',
    annotations: ANN.update,
    inputSchema: { id: ID },
  }, async ({ id }) => {
    audit(client, 'users_unarchive', { id })
    return safely(() => client.patch<{ data: User }>(`/users/${id}/unarchive`, {}), (r) => toolJson(r))
  })
}
