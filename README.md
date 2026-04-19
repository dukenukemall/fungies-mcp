<h1 align="center">Fungies MCP</h1>

<p align="center">
  <a href="https://docs.fungies.io/api-reference/introduction"><img src="https://img.shields.io/badge/Docs-docs.fungies.io-8B5CF6?style=for-the-badge" alt="Documentation"></a>
  <a href="https://fungies.io"><img src="https://img.shields.io/badge/Website-fungies.io-E05A2A?style=for-the-badge" alt="Website"></a>
  <a href="https://discord.gg/yfH5ZyTZH4"><img src="https://img.shields.io/badge/Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white" alt="Discord"></a>
  <a href="https://help.fungies.io"><img src="https://img.shields.io/badge/Help%20Center-help.fungies.io-C4399B?style=for-the-badge" alt="Help Center"></a>
  <a href="https://github.com/dukenukemall/fungies-mcp/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-22c55e?style=for-the-badge" alt="License: MIT"></a>
</p>

---

Official [Model Context Protocol](https://modelcontextprotocol.io) server for the [Fungies](https://fungies.io) Merchant of Record API.

Lets MCP clients (Cursor, Claude Desktop, Continue, …) drive a Fungies store conversationally — list and create products, manage offers and game keys, look up orders and customers, manage subscriptions, generate discount codes, and more.

## Install in Cursor

Open [https://mcp.fungies.io/install](https://mcp.fungies.io/install), paste your Fungies keys, and click **Install in Cursor**. Keys stay in your browser.

Or add this to your `~/.cursor/mcp.json` manually:

```json
{
  "mcpServers": {
    "fungies": {
      "url": "https://mcp.fungies.io/mcp",
      "headers": {
        "x-fngs-public-key": "pub_...",
        "x-fngs-secret-key": "sec_..."
      }
    }
  }
}
```

Omit `x-fngs-secret-key` for read-only access (19 tools). With a secret key 22 additional write tools are exposed (41 total).

## Auth

Keys are sent on every MCP request as HTTP headers and forwarded verbatim to `api.fungies.io/v0`. The server never stores them. Generate keys at [app.fungies.io/devs/api-keys](https://app.fungies.io/devs/api-keys).

## Tools

Tools are grouped by resource: `products_*`, `offers_*`, `orders_*`, `subscriptions_*`, `users_*`, `discounts_*`, `payments_*`, `elements_*`, `webhooks_*`. Destructive tools (`*_archive`, `*_cancel`, `offers_keys_remove`) require `confirm: true`.

## Self-host

```bash
docker build -t fungies-mcp .
docker run -e PORT=3000 -p 3000:3000 fungies-mcp
```

Env vars: `PORT`, `NODE_ENV`, `LOG_LEVEL`, `FUNGIES_API_BASE` (default `https://api.fungies.io`), `MCP_PUBLIC_URL` (default `https://mcp.fungies.io`).

## Sister project

[`dukenukemall/fungies-cli`](https://github.com/dukenukemall/fungies-cli) — same API surface, different transport (terminal). The MCP server reuses its API client.

## License

MIT
