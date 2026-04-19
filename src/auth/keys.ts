import { z } from 'zod'
import type { MiddlewareHandler } from 'hono'

export const PublicKeySchema = z.string().regex(/^pub_[A-Za-z0-9+/_=-]+$/)
export const SecretKeySchema = z.string().regex(/^sec_[A-Za-z0-9+/_=-]+$/)

export interface AuthContext {
  publicKey: string
  secretKey?: string
  hasSecret: boolean
}

declare module 'hono' {
  interface ContextVariableMap {
    auth: AuthContext
  }
}

export const keyAuth: MiddlewareHandler = async (c, next) => {
  const pubRaw = c.req.header('x-fngs-public-key') ?? ''
  const pub = PublicKeySchema.safeParse(pubRaw)
  if (!pub.success) {
    return c.json(
      {
        error: 'missing_or_invalid_public_key',
        hint: 'Set the x-fngs-public-key header to a value starting with pub_. Generate one at https://app.fungies.io/devs/api-keys',
      },
      401,
    )
  }

  const secRaw = c.req.header('x-fngs-secret-key')
  let secretKey: string | undefined
  if (secRaw) {
    const sec = SecretKeySchema.safeParse(secRaw)
    if (!sec.success) {
      return c.json(
        {
          error: 'invalid_secret_key',
          hint: 'x-fngs-secret-key must start with sec_. Omit it for read-only access.',
        },
        401,
      )
    }
    secretKey = sec.data
  }

  c.set('auth', {
    publicKey: pub.data,
    secretKey,
    hasSecret: Boolean(secretKey),
  })
  await next()
}
