import { extractList, handleResponse } from './extract.js'
import type { PagedResult } from './types.js'

export const FUNGIES_BASE_URL = `${process.env.FUNGIES_API_BASE ?? 'https://api.fungies.io'}/v0`
const TIMEOUT_MS = Number(process.env.FUNGIES_TIMEOUT_MS ?? 15_000)
const MAX_RETRIES = Number(process.env.FUNGIES_MAX_RETRIES ?? 2)
const RETRYABLE = new Set([408, 425, 429, 500, 502, 503, 504])

export interface FungiesAuth { publicKey: string; secretKey?: string }

export class FungiesClient {
  private readonly readHeaders: Record<string, string>
  private readonly writeHeaders: Record<string, string>

  constructor(public auth: FungiesAuth) {
    const base: Record<string, string> = { 'x-fngs-public-key': auth.publicKey }
    if (auth.secretKey) base['x-fngs-secret-key'] = auth.secretKey
    this.readHeaders = base
    this.writeHeaders = { ...base, 'Content-Type': 'application/json' }
  }

  get hasSecret(): boolean { return Boolean(this.auth.secretKey) }

  async get<T>(path: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
    const url = new URL(`${FUNGIES_BASE_URL}${path}`)
    if (params) for (const [k, v] of Object.entries(params)) if (v !== undefined) url.searchParams.set(k, String(v))
    const res = await this.request(url.toString(), { method: 'GET', headers: this.readHeaders }, true)
    return handleResponse<T>(res)
  }

  async getList<T>(path: string, params?: Record<string, string | number | boolean | undefined>): Promise<PagedResult<T>> {
    return extractList<T>(await this.get<Record<string, unknown>>(path, params))
  }

  post<T>(path: string, body?: unknown): Promise<T> { return this.write<T>(path, 'POST', body) }
  patch<T>(path: string, body: unknown): Promise<T> { return this.write<T>(path, 'PATCH', body) }
  delete<T>(path: string, body?: unknown): Promise<T> { return this.write<T>(path, 'DELETE', body) }

  private async write<T>(path: string, method: 'POST' | 'PATCH' | 'DELETE', body?: unknown): Promise<T> {
    const res = await this.request(
      `${FUNGIES_BASE_URL}${path}`,
      { method, headers: this.writeHeaders, body: body !== undefined ? JSON.stringify(body) : undefined },
      method !== 'POST',
    )
    return handleResponse<T>(res)
  }

  private async request(url: string, init: RequestInit, retrySafe: boolean): Promise<Response> {
    const attempts = retrySafe ? MAX_RETRIES + 1 : 1
    let lastError: unknown
    for (let i = 0; i < attempts; i++) {
      const ctrl = new AbortController()
      const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
      try {
        const res = await fetch(url, { ...init, signal: ctrl.signal })
        if (retrySafe && RETRYABLE.has(res.status) && i < attempts - 1) { await sleep(backoff(i)); continue }
        return res
      } catch (err) {
        lastError = err
        if (i < attempts - 1) { await sleep(backoff(i)); continue }
        throw err
      } finally { clearTimeout(timer) }
    }
    throw lastError ?? new Error('request failed')
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const backoff = (i: number) => Math.min(2_000, 200 * 2 ** i) + Math.floor(Math.random() * 100)
