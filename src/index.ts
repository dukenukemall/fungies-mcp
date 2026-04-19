import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { keyAuth } from './auth/keys.js'
import { mountMcp } from './mcp/transport.js'
import { installPage } from './install/page.js'
import { logger } from './lib/logger.js'

const app = new Hono()

app.get('/', (c) =>
  c.redirect('/install'),
)

app.get('/healthz', (c) => c.json({ ok: true, service: 'fungies-mcp', version: '0.1.0' }))

app.get('/install', (c) => c.html(installPage()))

app.use('/mcp', keyAuth)
app.use('/mcp/*', keyAuth)
mountMcp(app)

app.onError((err, c) => {
  logger.error({ err: err.message, stack: err.stack }, 'unhandled_error')
  return c.json({ error: 'internal_error' }, 500)
})

const port = Number(process.env.PORT ?? 3000)

serve({ fetch: app.fetch, port }, (info) => {
  logger.info({ port: info.port, env: process.env.NODE_ENV ?? 'development' }, 'fungies-mcp listening')
})
