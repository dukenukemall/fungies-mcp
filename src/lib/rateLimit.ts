import type { MiddlewareHandler } from 'hono'
import { logger } from './logger.js'
import { maskKey } from './mask.js'

interface Bucket {
  count: number
  resetAt: number
}

function makeLimiter(max: number, windowMs: number, keyFn: (c: Parameters<MiddlewareHandler>[0]) => string | null) {
  const buckets = new Map<string, Bucket>()

  setInterval(() => {
    const now = Date.now()
    for (const [k, v] of buckets) if (v.resetAt < now) buckets.delete(k)
  }, Math.max(windowMs, 10_000)).unref?.()

  const middleware: MiddlewareHandler = async (c, next) => {
    const key = keyFn(c)
    if (!key) return next()

    const now = Date.now()
    const b = buckets.get(key)
    if (!b || b.resetAt < now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs })
      return next()
    }
    if (b.count >= max) {
      const retryAfter = Math.ceil((b.resetAt - now) / 1000)
      c.header('Retry-After', String(retryAfter))
      logger.warn({ rateLimitKey: key, retryAfter }, 'rate_limit_exceeded')
      return c.json({ error: 'rate_limited', retryAfter }, 429)
    }
    b.count += 1
    return next()
  }
  return middleware
}

export function rateLimitByIp(max = 120, windowMs = 60_000): MiddlewareHandler {
  return makeLimiter(max, windowMs, (c) => {
    const fwd = c.req.header('x-forwarded-for')
    const ip = fwd?.split(',')[0]?.trim() || c.req.header('cf-connecting-ip') || c.req.header('x-real-ip') || 'unknown'
    return `ip:${ip}`
  })
}

export function rateLimitByKey(max = 300, windowMs = 60_000): MiddlewareHandler {
  return makeLimiter(max, windowMs, (c) => {
    const pk = c.get('auth')?.publicKey
    return pk ? `pk:${maskKey(pk)}` : null
  })
}
