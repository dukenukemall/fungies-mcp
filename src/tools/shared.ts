import type { CallToolResult, ToolAnnotations } from '@modelcontextprotocol/sdk/types.js'
import { ApiError } from '../fungies/extract.js'
import { maskKey } from '../lib/mask.js'
import { logger } from '../lib/logger.js'
import type { FungiesClient } from '../fungies/client.js'

export const ANN = {
  read: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true } satisfies ToolAnnotations,
  readLocal: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false } satisfies ToolAnnotations,
  create: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true } satisfies ToolAnnotations,
  update: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true } satisfies ToolAnnotations,
  destructive: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: true } satisfies ToolAnnotations,
} as const

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
  return { content: [{ type: 'text', text: message }], isError: true }
}

export async function safely<T>(
  fn: () => Promise<T>,
  format: (result: T) => CallToolResult,
): Promise<CallToolResult> {
  try {
    const result = await fn()
    return format(result)
  } catch (err) {
    return toolError(err)
  }
}

export function audit(
  client: FungiesClient,
  tool: string,
  args: Record<string, unknown>,
): void {
  logger.info(
    {
      audit: true,
      tool,
      publicKey: maskKey(client.auth.publicKey),
      hasSecret: client.hasSecret,
      args: sanitizeArgs(args),
    },
    `tool.call ${tool}`,
  )
}

function sanitizeArgs(args: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(args)) {
    if (typeof v === 'string' && v.length > 200) {
      out[k] = `${v.slice(0, 200)}...`
    } else {
      out[k] = v
    }
  }
  return out
}

export function requireConfirm(confirm: boolean | undefined, action: string): CallToolResult | null {
  if (!confirm) {
    return toolError(
      new Error(
        `${action} is destructive. Pass { confirm: true } to proceed. No changes were made.`,
      ),
    )
  }
  return null
}
