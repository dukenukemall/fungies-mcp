import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { FungiesClient } from '../fungies/client.js'
import type { CheckoutElement, PagedResult } from '../fungies/types.js'
import { audit, safely, toolJson } from './shared.js'

export function registerElements(server: McpServer, client: FungiesClient) {
  server.registerTool(
    'elements_list',
    {
      description: 'List checkout elements (embeddable checkout widgets) configured in the store.',
      inputSchema: {
        skip: z.number().int().min(0).optional(),
        take: z.number().int().min(1).max(100).optional(),
      },
    },
    async (args) =>
      safely<PagedResult<CheckoutElement>>(
        () => client.getList<CheckoutElement>('/elements/list', args),
        (r) => toolJson({ count: r.count, hasMore: r.hasMore, items: r.items }),
      ),
  )

  if (!client.hasSecret) return

  server.registerTool(
    'elements_create',
    {
      description: 'Create a checkout element binding a set of offers to a reusable widget.',
      inputSchema: {
        name: z.string(),
        offers: z.array(z.string()).min(1).describe('Array of offer IDs'),
        type: z.string().optional(),
      },
    },
    async (args) => {
      audit(client, 'elements_create', args)
      return safely(() => client.post<{ data: CheckoutElement }>('/elements/create', args), (r) => toolJson(r))
    },
  )
}
