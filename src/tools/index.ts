import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { FungiesClient } from '../fungies/client.js'
import { registerProducts } from './products.js'
import { registerOffers } from './offers.js'
import { registerOrders } from './orders.js'
import { registerSubscriptions } from './subscriptions.js'
import { registerUsers } from './users.js'
import { registerDiscounts } from './discounts.js'
import { registerPayments } from './payments.js'
import { registerElements } from './elements.js'
import { registerWebhooks } from './webhooks.js'

export function registerTools(server: McpServer, client: FungiesClient) {
  registerProducts(server, client)
  registerOffers(server, client)
  registerOrders(server, client)
  registerSubscriptions(server, client)
  registerUsers(server, client)
  registerDiscounts(server, client)
  registerPayments(server, client)
  registerElements(server, client)
  registerWebhooks(server, client)
}
