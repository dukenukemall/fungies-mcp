export const FUNGIES_MCP_SKILL_NAME = 'fungies-mcp'

export const FUNGIES_MCP_SKILL_DESCRIPTION =
  'Manage a Fungies Merchant of Record store via the official Fungies MCP server. Use when the user asks to inspect, list, create, update, refund, or archive products, offers, orders, subscriptions, customers, discounts, payments, game keys, checkout elements, or webhooks on fungies.io.'

export const FUNGIES_MCP_SKILL_MD = `---
name: ${FUNGIES_MCP_SKILL_NAME}
description: ${FUNGIES_MCP_SKILL_DESCRIPTION}
---

# Fungies MCP

Official [Model Context Protocol](https://modelcontextprotocol.io) server for the [Fungies](https://fungies.io) Merchant of Record platform. 40 tools across catalog, orders, subscriptions, customers, discounts, payments, checkout elements, and webhooks. Hosted; no local install required.

## Connect

Endpoint (Streamable HTTP transport):

\`\`\`
https://mcp.fungies.io/mcp
\`\`\`

### Required headers

- \`x-fngs-public-key: pub_...\` — always required
- \`x-fngs-secret-key: sec_...\` — optional; adds write and destructive tools

Get a key pair at [app.fungies.io/devs/api-keys](https://app.fungies.io/devs/api-keys) (Developers → API Keys).

## Capability modes

| Mode | Headers sent | Tools exposed |
| --- | --- | --- |
| Read-only | \`x-fngs-public-key\` only | 17 (list / get / inventory / verify) |
| Full access | both keys | 40 (adds create / update / archive / cancel / refund) |

## Representative tools

- Catalog: \`products_list\`, \`products_get\`, \`offers_list\`, \`offers_create\`
- Orders: \`orders_list\`, \`orders_get\`, \`orders_cancel\`
- Subscriptions: \`subscriptions_list\`, \`subscriptions_pause\`, \`subscriptions_cancel\`, \`subscriptions_charge\`
- Customers: \`users_list\`, \`users_inventory\`, \`users_update\`
- Promotions: \`discounts_create\`, \`discounts_update\`
- Game keys: \`offers_keys_add\`, \`offers_keys_remove\`
- Webhooks: \`webhooks_verify\`

Full list: call \`tools/list\` on the MCP, or see [github.com/dukenukemall/fungies-mcp](https://github.com/dukenukemall/fungies-mcp).

## Safety

- All destructive tools (\`*_archive\`, \`*_cancel\`, \`offers_keys_remove\`) require \`confirm: true\` in the call.
- Tool annotations declare \`readOnlyHint\`, \`destructiveHint\`, and \`idempotentHint\`.
- All tool inputs use strict Zod schemas; unknown fields are rejected.
- Per-key rate limit: 300 req/min. Body size limit: 256 KB.

## Example prompts

- "List my five most recent products on Fungies."
- "Find the customer with email alice@example.com and cancel any active subscriptions at period end."
- "Create a 25% off coupon \`WINTER25\` valid until January 15th."
- "What's the payment status of order 9XMrb9Hk?"
- "Add these 500 Steam keys to the 'Indie Bundle' offer."

## Related discovery

- MCP discovery manifest: \`https://mcp.fungies.io/.well-known/mcp.json\`
- API docs: \`https://docs.fungies.io/api-reference/introduction\`
- Install page (Cursor one-click): \`https://mcp.fungies.io/install\`
`
