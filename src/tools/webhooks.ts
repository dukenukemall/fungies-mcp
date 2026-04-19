import { z } from 'zod'
import { createHmac, timingSafeEqual } from 'node:crypto'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { FungiesClient } from '../fungies/client.js'
import { ANN, strictShape, toolJson } from './shared.js'

const MAX_BODY = 1_000_000

export function registerWebhooks(server: McpServer, _client: FungiesClient) {
  server.registerTool('webhooks_verify', {
    title: 'Verify webhook signature',
    description:
      'Use this to verify a Fungies webhook signature locally (HMAC-SHA256, timing-safe). No network call; pass the raw body, the x-fngs-signature header value, and your webhook signing secret. Returns { valid: boolean }.',
    annotations: ANN.readLocal,
    inputSchema: strictShape({
      body: z.string().max(MAX_BODY).describe('Raw HTTP request body as received, byte-for-byte (max 1 MB)'),
      signature: z.string().max(512).describe('Value of the x-fngs-signature header (with or without sha256= prefix)'),
      secret: z.string().max(512).describe('Your webhook signing secret from Fungies dashboard'),
    }),
  }, async ({ body, signature, secret }) => {
    const expected = createHmac('sha256', secret).update(body).digest('hex')
    const sig = signature.replace(/^sha256=/, '')
    const valid =
      expected.length === sig.length &&
      timingSafeEqual(Buffer.from(expected), Buffer.from(sig))
    return toolJson({ valid, algorithm: 'sha256' })
  })
}
