import type { MiddlewareHandler } from 'hono'
import type { Logger } from 'pino'
import { logger } from './logger.js'
import { runWithRequest } from './requestContext.js'

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
  const path = new URL(c.req.url).pathname

  child.info({ method: c.req.method, path }, 'request_started')

  await runWithRequest({ requestId }, next)

  const durationMs = Date.now() - start
  child.info({ method: c.req.method, path, status: c.res.status, durationMs }, 'request_completed')
}
