import type { PagedResult } from './types.js'

// Fungies wraps list responses as { status: "success", data: { <resource>: [...], count: N } }
export function extractList<T>(body: Record<string, unknown>): PagedResult<T> {
  const data = body.data as Record<string, unknown> | undefined
  if (!data) return { items: [], count: 0 }
  for (const val of Object.values(data)) {
    if (Array.isArray(val)) {
      return {
        items: val as T[],
        count: (data.count as number | null) ?? val.length,
        hasMore: (data.hasMore as boolean | undefined) ?? false,
      }
    }
  }
  return { items: [], count: 0 }
}

export class ApiError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

export async function handleResponse<T>(res: Response): Promise<T> {
  const body = (await res.json()) as {
    status?: string
    message?: string
    error?: string | { message?: string }
    data?: unknown
  }
  const isApiError = body.status === 'error'

  if (!res.ok || isApiError) {
    let message = `HTTP ${res.status}: ${res.statusText}`
    if (typeof body.error === 'object' && (body.error as { message?: string })?.message) {
      message = (body.error as { message: string }).message
    } else if (typeof body.error === 'string') {
      message = body.error
    } else if (body.message) {
      message = body.message
    }

    const status = res.status
    if (status === 401) throw new ApiError(401, `Authentication failed: ${message}. Check that x-fngs-public-key / x-fngs-secret-key headers are set correctly.`)
    if (status === 403) throw new ApiError(403, `Forbidden: ${message}. This operation may require the secret key.`)
    if (status === 404) throw new ApiError(404, `Not found: ${message}`)
    if (status === 422) throw new ApiError(422, `Validation error: ${message}`)
    if (status === 429) throw new ApiError(429, `Rate limited: ${message}. Please wait before retrying.`)
    if (status === 500 || isApiError) throw new ApiError(status, `API error: ${message}`)
    throw new ApiError(status, message)
  }

  return body as T
}
