import { extractList, handleResponse } from './extract.js'
import type { PagedResult } from './types.js'

export const FUNGIES_BASE_URL = `${process.env.FUNGIES_API_BASE ?? 'https://api.fungies.io'}/v0`

export interface FungiesAuth {
  publicKey: string
  secretKey?: string
}

export class FungiesClient {
  private readHeaders: Record<string, string>
  private writeHeaders: Record<string, string>

  constructor(public auth: FungiesAuth) {
    this.readHeaders = { 'x-fngs-public-key': auth.publicKey }
    this.writeHeaders = {
      'x-fngs-public-key': auth.publicKey,
      'Content-Type': 'application/json',
    }
    if (auth.secretKey) {
      this.readHeaders['x-fngs-secret-key'] = auth.secretKey
      this.writeHeaders['x-fngs-secret-key'] = auth.secretKey
    }
  }

  get hasSecret(): boolean {
    return Boolean(this.auth.secretKey)
  }

  async get<T>(path: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
    const url = new URL(`${FUNGIES_BASE_URL}${path}`)
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined) url.searchParams.set(k, String(v))
      }
    }
    const res = await fetch(url.toString(), { headers: this.readHeaders })
    return handleResponse<T>(res)
  }

  async getList<T>(path: string, params?: Record<string, string | number | boolean | undefined>): Promise<PagedResult<T>> {
    const raw = await this.get<Record<string, unknown>>(path, params)
    return extractList<T>(raw)
  }

  post<T>(path: string, body?: unknown): Promise<T> {
    return this.write<T>(path, 'POST', body)
  }

  patch<T>(path: string, body: unknown): Promise<T> {
    return this.write<T>(path, 'PATCH', body)
  }

  delete<T>(path: string, body?: unknown): Promise<T> {
    return this.write<T>(path, 'DELETE', body)
  }

  private async write<T>(path: string, method: 'POST' | 'PATCH' | 'DELETE', body?: unknown): Promise<T> {
    const res = await fetch(`${FUNGIES_BASE_URL}${path}`, {
      method,
      headers: this.writeHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
    return handleResponse<T>(res)
  }
}
