import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { FungiesClient } from '../fungies/client.js'
import type { CheckoutElement, PagedResult } from '../fungies/types.js'
import { ANN, audit, safely, toolJson } from './shared.js'

export function registerElements(server: McpServer, client: FungiesClient) {
  server.registerTool('elements_list', {
    title: 'List checkout elements',
    description:
      'Use this when the user asks about embeddable checkout widgets (elements) configured in the store.',
    annotations: ANN.read,
    inputSchema: {
      skip: z.number().int().min(0).optional().describe('Pagination offset'),
      take: z.number().int().min(1).max(100).optional().describe('Page size 1-100'),
    },
  }, async (args) =>
    safely<PagedResult<CheckoutElement>>(
      () => client.getList<CheckoutElement>('/elements/list', args),
      (r) => toolJson({ count: r.count, hasMore: r.hasMore, items: r.items }),
    ),
  )

  if (!client.hasSecret) return

  server.registerTool('elements_create', {
    title: 'Create checkout element',
    description:
      'Use this to create a reusable checkout widget bound to a set of offers (e.g. a bundle, upgrade path).',
    annotations: ANN.create,
    inputSchema: {
      name: z.string().describe('Internal name for the element'),
      offers: z.array(z.string()).min(1).describe('Offer UUIDs included in this element'),
      type: z.string().optional().describe('Optional element type (see Fungies docs)'),
    },
  }, async (args) => {
    audit(client, 'elements_create', args)
    return safely(() => client.post<{ data: CheckoutElement }>('/elements/create', args), (r) => toolJson(r))
  })
}
