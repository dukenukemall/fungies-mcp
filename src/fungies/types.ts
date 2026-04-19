export type ProductType = 'OneTimePayment' | 'Subscription' | 'Membership' | 'GameKey'
export type ProductStatus = 'OPEN' | 'ARCHIVED' | 'active' | 'archived'
export type OfferStatus = 'OPEN' | 'ARCHIVED' | 'active' | 'archived'
export type OrderStatus = 'PAID' | 'PENDING' | 'CANCELLED' | 'REFUNDED' | 'paid' | 'pending' | 'cancelled' | 'refunded'
export type PaymentStatus = 'PAID' | 'FAILED' | 'PENDING' | 'CANCELLED' | 'REFUNDED' | 'PARTIALLY_REFUNDED' | 'EXPIRED'
export type SubscriptionStatus = 'active' | 'canceled' | 'paused' | 'past_due'

export interface Product {
  id: string
  object?: string
  name: string
  type?: ProductType
  slug?: string
  description?: string
  status?: ProductStatus
  createdAt?: number | string
  updatedAt?: number | string
  [key: string]: unknown
}

export interface Offer {
  id: string
  object?: string
  price: number
  originalPrice?: number | null
  currency: string
  recurringInterval?: string | null
  recurringIntervalCount?: number | null
  name?: string | null
  status?: string
  soldItems?: number
  [key: string]: unknown
}

export interface Discount {
  id: string
  object?: string
  type?: string
  name?: string
  amount?: string | number
  amountType?: string
  discountCode?: string
  status?: string
  timesUsed?: number
  validFrom?: number | null
  validUntil?: number | null
  currency?: string
  [key: string]: unknown
}

export interface Order {
  id: string
  object?: string
  number?: string
  orderNumber?: string
  status?: string
  userId?: string
  value?: number
  tax?: number
  fee?: number
  currency?: string
  currencyDecimals?: number
  country?: string
  createdAt?: number | string
  [key: string]: unknown
}

export interface Payment {
  id: string
  object?: string
  type?: string
  number?: string
  status?: string
  value?: number
  fee?: number
  tax?: number
  currency?: string
  currencyDecimals?: number
  createdAt?: number | string
  userId?: string
  invoiceUrl?: string | null
  [key: string]: unknown
}

export interface Subscription {
  id: string
  object?: string
  status?: string
  createdAt?: number | string
  currentIntervalEnd?: number | string
  canceledAt?: number | string | null
  userId?: string
  orderId?: string | null
  [key: string]: unknown
}

export interface User {
  id: string
  object?: string
  email?: string
  username?: string | null
  details?: Record<string, unknown>
  internalId?: string | null
  [key: string]: unknown
}

export interface CheckoutElement {
  id: string
  object?: string
  name?: string
  offers?: string[]
  createdAt?: number | string
  [key: string]: unknown
}

export interface PagedResult<T> {
  items: T[]
  count: number | null
  hasMore?: boolean
}
