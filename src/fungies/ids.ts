import { z } from 'zod'

const ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/

export const FungiesId = z
  .string()
  .regex(ID_PATTERN, 'Must be 1-64 characters of [A-Za-z0-9_-]')

export function assertSafePath(path: string): void {
  if (path.includes('..') || path.includes('//') || path.includes('\\')) {
    throw new Error(`Refusing to call upstream path containing traversal segments: ${path}`)
  }
}
