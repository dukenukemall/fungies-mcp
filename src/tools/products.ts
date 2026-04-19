import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { FungiesClient } from '../fungies/client.js'
import type { Product, PagedResult } from '../fungies/types.js'
import { ANN, audit, requireConfirm, safely, toolJson } from './shared.js'

const ID = z.string().describe('Product UUID')

export function registerProducts(server: McpServer, client: FungiesClient) {
  server.registerTool('products_list', {
    title: 'List products',
    description:
      'Use this when the user asks to browse, count, or find products in the Fungies catalog. Returns { count, hasMore, items }.',
    annotations: ANN.read,
    inputSchema: {
      skip: z.number().int().min(0).optional().describe('Pagination offset, default 0'),
      take: z.number().int().min(1).max(100).optional().describe('Page size 1-100, default 20'),
      termOrId: z.string().optional().describe('Fuzzy search by name, or an exact product UUID'),
      statuses: z.string().optional().describe('Comma-separated statuses: active,archived'),
    },
  }, async (args) =>
    safely<PagedResult<Product>>(
      () => client.getList<Product>('/products/list', args),
      (r) => toolJson({ count: r.count, hasMore: r.hasMore, items: r.items }),
    ),
  )

  server.registerTool('products_get', {
    title: 'Get product',
    description:
      'Use this when the user refers to a specific product by UUID or asks for its full details (type, status, variants, plans).',
    annotations: ANN.read,
    inputSchema: { id: ID },
  }, async ({ id }) => safely(() => client.get<{ data: Product }>(`/products/${id}`), (r) => toolJson(r)))

  server.registerTool('products_duplicate', {
    title: 'Duplicate product',
    description:
      'Use this when the user wants to clone a product as a starting point for a new one. Copies variants; does NOT copy offers.',
    annotations: ANN.create,
    inputSchema: { id: ID.describe('Source product UUID') },
  }, async ({ id }) => {
    audit(client, 'products_duplicate', { id })
    return safely(() => client.post<{ data: Product }>(`/products/${id}/duplicate`), (r) => toolJson(r))
  })

  if (!client.hasSecret) return

  server.registerTool('products_create', {
    title: 'Create product',
    description:
      'Use this when the user wants to add a new product to the store. Create offers separately with offers_create.',
    annotations: ANN.create,
    inputSchema: {
      name: z.string().describe('Display name shown on the storefront'),
      type: z.enum(['OneTimePayment', 'Subscription', 'Membership', 'GameKey']).describe('Product type; determines billing and fulfillment'),
      description: z.string().optional().describe('Marketing description (plain text or markdown)'),
      slug: z.string().optional().describe('URL-safe slug; auto-generated if omitted'),
    },
  }, async (args) => {
    audit(client, 'products_create', args)
    return safely(() => client.post<{ data: Product }>('/products/create', args), (r) => toolJson(r))
  })

  server.registerTool('products_update', {
    title: 'Update product',
    description:
      'Use this when the user wants to edit metadata of an existing product (rename, rewrite copy, change slug). Type cannot be changed.',
    annotations: ANN.update,
    inputSchema: {
      id: ID,
      name: z.string().optional().describe('New display name'),
      description: z.string().optional().describe('New description'),
      slug: z.string().optional().describe('New URL slug'),
    },
  }, async ({ id, ...patch }) => {
    audit(client, 'products_update', { id, ...patch })
    return safely(() => client.patch<{ data: Product }>(`/products/${id}/update`, patch), (r) => toolJson(r))
  })

  server.registerTool('products_archive', {
    title: 'Archive product',
    description:
      'Use this when the user wants to remove a product from the storefront. Soft delete (reversible); associated offers are also archived. Requires confirm: true.',
    annotations: ANN.destructive,
    inputSchema: {
      id: ID,
      confirm: z.boolean().optional().describe('Must be true — destructive action, blocked otherwise'),
    },
  }, async ({ id, confirm }) => {
    const refuse = requireConfirm(confirm, 'products_archive')
    if (refuse) return refuse
    audit(client, 'products_archive', { id })
    return safely(() => client.patch<{ data: Product }>(`/products/${id}/archive`, {}), (r) => toolJson(r))
  })
}
