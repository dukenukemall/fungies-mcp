import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import type { Hono } from 'hono'
import { createMcpServer } from './server.js'

export function mountMcp(app: Hono) {
  app.all('/mcp', async (c) => {
    const auth = c.get('auth')
    const server = createMcpServer({ auth })
    const transport = new WebStandardStreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    })
    await server.connect(transport)

    let parsedBody: unknown
    if (c.req.method === 'POST') {
      try {
        parsedBody = await c.req.json()
      } catch {
        parsedBody = undefined
      }
    }

    const response = await transport.handleRequest(c.req.raw, { parsedBody })

    response.headers.set('Connection', 'close')
    setImmediate(() => {
      void server.close().catch(() => undefined)
    })

    return response
  })
}
