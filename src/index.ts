import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { secureHeaders } from 'hono/secure-headers'
import { compress } from 'hono/compress'
import { requestId } from 'hono/request-id'
import { bodyLimit } from 'hono/body-limit'
import { randomBytes } from 'node:crypto'
import { keyAuth } from './auth/keys.js'
import { mountMcp } from './mcp/transport.js'
import { installPage } from './install/page.js'
import { logger } from './lib/logger.js'
import { httpLog } from './lib/httpLog.js'
import { rateLimitByIp, rateLimitByKey } from './lib/rateLimit.js'

const MAX_MCP_BODY_BYTES = Number(process.env.MCP_MAX_BODY_BYTES ?? 256 * 1024)

const app = new Hono()

app.use('*', requestId())
app.use('*', httpLog)
app.use(
  '*',
  secureHeaders({
    referrerPolicy: 'no-referrer',
    xFrameOptions: 'DENY',
    crossOriginOpenerPolicy: 'same-origin',
    crossOriginResourcePolicy: 'same-origin',
  }),
)
app.use('*', compress())
app.use('*', rateLimitByIp(Number(process.env.RATE_LIMIT_IP_PER_MIN ?? 120)))

app.get('/', (c) => c.redirect('/install'))
app.get('/healthz', (c) => c.json({ ok: true, service: 'fungies-mcp', version: '0.2.1' }))

app.get('/install', (c) => {
  const nonce = randomBytes(16).toString('base64')
  c.header(
    'Content-Security-Policy',
    [
      "default-src 'none'",
      `style-src 'nonce-${nonce}'`,
      `script-src 'nonce-${nonce}'`,
      "img-src 'self' data:",
      "base-uri 'none'",
      "form-action 'none'",
      "frame-ancestors 'none'",
    ].join('; '),
  )
  return c.html(installPage(nonce))
})

app.use(
  '/mcp',
  bodyLimit({
    maxSize: MAX_MCP_BODY_BYTES,
    onError: (c) => c.json({ error: 'payload_too_large', maxBytes: MAX_MCP_BODY_BYTES }, 413),
  }),
)
app.use('/mcp', keyAuth)
app.use('/mcp', rateLimitByKey(Number(process.env.RATE_LIMIT_KEY_PER_MIN ?? 300)))
mountMcp(app)

app.onError((err, c) => {
  const log = c.get('reqLog') ?? logger
  log.error({ err: err.message, stack: err.stack }, 'unhandled_error')
  return c.json({ error: 'internal_error', requestId: c.get('requestId') }, 500)
})

const port = Number(process.env.PORT ?? 3000)

serve({ fetch: app.fetch, port }, (info) => {
  logger.info({ port: info.port, env: process.env.NODE_ENV ?? 'development' }, 'fungies-mcp listening')
})
