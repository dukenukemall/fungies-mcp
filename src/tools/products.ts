import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { FungiesClient } from '../fungies/client.js'
import type { Product, PagedResult } from '../fungies/types.js'
import { audit, requireConfirm, safely, toolJson } from './shared.js'

export function registerProducts(server: McpServer, client: FungiesClient) {
  server.registerTool(
    'products_list',
    {
      description:
        'List products in the Fungies store. Supports pagination and filtering by name or status. Use to find products, count inventory, or browse the catalog.',
      inputSchema: {
        skip: z.number().int().min(0).optional().describe('Pagination offset (default 0)'),
        take: z.number().int().min(1).max(100).optional().describe('Page size (default 20)'),
        termOrId: z.string().optional().describe('Search by name or filter by exact ID'),
        statuses: z.string().optional().describe('Comma-separated statuses: active,archived'),
      },
    },
    async (args) =>
      safely<PagedResult<Product>>(
        () => client.getList<Product>('/products/list', args),
        (r) => toolJson({ count: r.count, hasMore: r.hasMore, items: r.items }),
      ),
  )

  server.registerTool(
    'products_get',
    {
      description: 'Fetch a single product by its UUID. Returns full details including type, status, variants.',
      inputSchema: { id: z.string().describe('Product UUID') },
    },
    async ({ id }) => safely(() => client.get<{ data: Product }>(`/products/${id}`), (r) => toolJson(r)),
  )

  server.registerTool(
    'products_duplicate',
    {
      description: 'Duplicate a product including its variants. Offers are NOT duplicated. Returns the new product.',
      inputSchema: { id: z.string().describe('Source product UUID') },
    },
    async ({ id }) => {
      audit(client, 'products_duplicate', { id })
      return safely(() => client.post<{ data: Product }>(`/products/${id}/duplicate`), (r) => toolJson(r))
    },
  )

  if (!client.hasSecret) return

  server.registerTool(
    'products_create',
    {
      description: 'Create a new product. Required: name, type (OneTimePayment|Subscription|Membership|GameKey). Returns the created product.',
      inputSchema: {
        name: z.string(),
        type: z.enum(['OneTimePayment', 'Subscription', 'Membership', 'GameKey']),
        description: z.string().optional(),
        slug: z.string().optional(),
      },
    },
    async (args) => {
      audit(client, 'products_create', args)
      return safely(() => client.post<{ data: Product }>('/products/create', args), (r) => toolJson(r))
    },
  )

  server.registerTool(
    'products_update',
    {
      description: 'Update a product. Pass only the fields you want to change.',
      inputSchema: {
        id: z.string(),
        name: z.string().optional(),
        description: z.string().optional(),
        slug: z.string().optional(),
      },
    },
    async ({ id, ...patch }) => {
      audit(client, 'products_update', { id, ...patch })
      return safely(() => client.patch<{ data: Product }>(`/products/${id}/update`, patch), (r) => toolJson(r))
    },
  )

  server.registerTool(
    'products_archive',
    {
      description: 'Archive a product (soft delete, reversible). Also archives associated offers. Pass confirm: true to proceed.',
      inputSchema: {
        id: z.string(),
        confirm: z.boolean().optional().describe('Must be true to proceed - destructive action'),
      },
    },
    async ({ id, confirm }) => {
      const refuse = requireConfirm(confirm, 'products_archive')
      if (refuse) return refuse
      audit(client, 'products_archive', { id })
      return safely(() => client.patch<{ data: Product }>(`/products/${id}/archive`, {}), (r) => toolJson(r))
    },
  )
}
