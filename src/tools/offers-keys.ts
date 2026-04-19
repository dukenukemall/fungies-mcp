import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { FungiesClient } from '../fungies/client.js'
import { ANN, audit, requireConfirm, safely, toolJson } from './shared.js'

export function registerOfferKeys(server: McpServer, client: FungiesClient) {
  if (!client.hasSecret) return

  server.registerTool('offers_keys_add', {
    title: 'Add license keys to offer',
    description:
      'Use this when the user wants to stock license/game keys into an offer. Keys auto-assign to buyers at purchase time.',
    annotations: ANN.create,
    inputSchema: {
      offerId: z.string().describe('Offer UUID that will receive the keys'),
      keys: z.array(z.string()).min(1).describe('Raw license keys to add'),
    },
  }, async ({ offerId, keys }) => {
    audit(client, 'offers_keys_add', { offerId, keyCount: keys.length })
    return safely(() => client.post(`/offers/${offerId}/keys/add`, { keys }), (r) => toolJson(r))
  })

  server.registerTool('offers_keys_remove', {
    title: 'Remove unsold key from offer',
    description:
      'Use this when the user wants to pull an unsold license key from an offer. Sold keys are preserved. Requires confirm: true.',
    annotations: ANN.destructive,
    inputSchema: {
      offerId: z.string().describe('Offer UUID the key belongs to'),
      keyId: z.string().describe('Key UUID to remove'),
      confirm: z.boolean().optional().describe('Must be true — destructive action'),
    },
  }, async ({ offerId, keyId, confirm }) => {
    const refuse = requireConfirm(confirm, 'offers_keys_remove')
    if (refuse) return refuse
    audit(client, 'offers_keys_remove', { offerId, keyId })
    return safely(() => client.delete(`/offers/${offerId}/keys/${keyId}/removeUnsold`), (r) => toolJson(r))
  })
}
