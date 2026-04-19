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

## Status

Scaffolding in progress. First release will be `mcp-v0.1.0`.

## Distribution (planned)

| Surface | How |
|---|---|
| Hosted | `https://mcp.fungies.io/sse` with `Authorization: Bearer pub_xxx:sec_xxx` |
| Local | `npx -y @fungies/mcp-server` with `FUNGIES_PUBLIC_KEY` / `FUNGIES_SECRET_KEY` env vars |

## Sister project

[`dukenukemall/fungies-cli`](https://github.com/dukenukemall/fungies-cli) — same API surface, different transport (terminal). The MCP server reuses its API client patterns.

## License

MIT
