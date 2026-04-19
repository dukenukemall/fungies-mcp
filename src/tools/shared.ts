import { z } from 'zod'
import type { CallToolResult, ToolAnnotations } from '@modelcontextprotocol/sdk/types.js'
import { ApiError } from '../fungies/extract.js'
import { maskKey } from '../lib/mask.js'
import { logger } from '../lib/logger.js'
import { getRequestId } from '../lib/requestContext.js'
import type { FungiesClient } from '../fungies/client.js'

export const ANN = {
  read: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true } satisfies ToolAnnotations,
  readLocal: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false } satisfies ToolAnnotations,
  create: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true } satisfies ToolAnnotations,
  update: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true } satisfies ToolAnnotations,
  destructive: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: true } satisfies ToolAnnotations,
} as const

export function strictShape<S extends z.ZodRawShape>(shape: S) {
  return z.object(shape).strict()
}

export function toolText(text: string): CallToolResult {
  return { content: [{ type: 'text', text }] }
}

export function toolJson(value: unknown): CallToolResult {
  return toolText(JSON.stringify(value, null, 2))
}

export function toolError(err: unknown): CallToolResult {
  const message =
    err instanceof ApiError
      ? `[${err.statusCode}] ${err.message}`
      : err instanceof Error
        ? err.message
        : String(err)
  return { content: [{ type: 'text', text: message.slice(0, 2000) }], isError: true }
}

export async function safely<T>(
  fn: () => Promise<T>,
  format: (result: T) => CallToolResult,
): Promise<CallToolResult> {
  try {
    return format(await fn())
  } catch (err) {
    return toolError(err)
  }
}

const PII_KEYS = new Set(['email', 'billingDetails', 'address', 'phone', 'taxId', 'secret', 'payload'])

function sanitizeArgs(args: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(args)) {
    if (PII_KEYS.has(k)) {
      out[k] = '[REDACTED]'
    } else if (typeof v === 'string' && v.length > 200) {
      out[k] = `${v.slice(0, 200)}...`
    } else {
      out[k] = v
    }
  }
  return out
}

export function audit(client: FungiesClient, tool: string, args: Record<string, unknown>): void {
  logger.info(
    {
      audit: true,
      tool,
      requestId: getRequestId(),
      publicKey: maskKey(client.auth.publicKey),
      hasSecret: client.hasSecret,
      args: sanitizeArgs(args),
    },
    `tool.call ${tool}`,
  )
}

export function requireConfirm(confirm: boolean | undefined, action: string): CallToolResult | null {
  if (!confirm) {
    return toolError(
      new Error(`${action} is destructive. Pass { confirm: true } to proceed. No changes were made.`),
    )
  }
  return null
}
