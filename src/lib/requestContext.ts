import { AsyncLocalStorage } from 'node:async_hooks'

export interface RequestContext {
  requestId?: string
}

const als = new AsyncLocalStorage<RequestContext>()

export function runWithRequest<T>(ctx: RequestContext, fn: () => T): T {
  return als.run(ctx, fn)
}

export function getRequestId(): string | undefined {
  return als.getStore()?.requestId
}
