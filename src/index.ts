import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { secureHeaders } from 'hono/secure-headers'
import { compress } from 'hono/compress'
import { requestId } from 'hono/request-id'
import { keyAuth } from './auth/keys.js'
import { mountMcp } from './mcp/transport.js'
import { installPage } from './install/page.js'
import { logger } from './lib/logger.js'
import { httpLog } from './lib/httpLog.js'

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

app.get('/', (c) => c.redirect('/install'))
app.get('/healthz', (c) => c.json({ ok: true, service: 'fungies-mcp', version: '0.1.0' }))
app.get('/install', (c) => c.html(installPage()))

app.use('/mcp', keyAuth)
app.use('/mcp/*', keyAuth)
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
