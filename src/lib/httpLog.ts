import type { MiddlewareHandler } from 'hono'
import type { Logger } from 'pino'
import { logger } from './logger.js'

declare module 'hono' {
  interface ContextVariableMap {
    reqLog: Logger
  }
}

export const httpLog: MiddlewareHandler = async (c, next) => {
  const start = Date.now()
  const requestId = c.get('requestId')
  const child = logger.child({ requestId })
  c.set('reqLog', child)

  child.info({ method: c.req.method, path: new URL(c.req.url).pathname }, 'request_started')

  await next()

  const durationMs = Date.now() - start
  child.info(
    { method: c.req.method, path: new URL(c.req.url).pathname, status: c.res.status, durationMs },
    'request_completed',
  )
}
