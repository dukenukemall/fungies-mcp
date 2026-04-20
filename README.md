<h1 align="center">Fungies MCP</h1>

<p align="center">
  <a href="https://docs.fungies.io/api-reference/introduction"><img src="https://img.shields.io/badge/Docs-docs.fungies.io-8B5CF6?style=for-the-badge" alt="Documentation"></a>
  <a href="https://fungies.io"><img src="https://img.shields.io/badge/Website-fungies.io-E05A2A?style=for-the-badge" alt="Website"></a>
  <a href="https://discord.gg/yfH5ZyTZH4"><img src="https://img.shields.io/badge/Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white" alt="Discord"></a>
  <a href="https://help.fungies.io"><img src="https://img.shields.io/badge/Help%20Center-help.fungies.io-C4399B?style=for-the-badge" alt="Help Center"></a>
  <a href="https://github.com/dukenukemall/fungies-mcp/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-22c55e?style=for-the-badge" alt="License: MIT"></a>
</p>

<p align="center">
  <b>Talk to your Fungies store from Cursor, Claude, ChatGPT, VS Code and more.</b><br/>
  Ask in plain English — "how much did I make last week?", "create a $29 yearly plan for my course", "refund order 9XMrb9Hk" — and your AI runs the right Fungies API calls for you.
</p>

---

## Table of contents

- [What you can do](#what-you-can-do)
- [Quick start (2 minutes)](#quick-start-2-minutes)
- [Pick your AI tool](#pick-your-ai-tool)
  - [Cursor](#cursor)
  - [Claude Desktop](#claude-desktop)
  - [Claude Code (CLI)](#claude-code-cli)
  - [VS Code (GitHub Copilot Chat)](#vs-code-github-copilot-chat)
  - [Continue.dev](#continuedev)
  - [Windsurf](#windsurf)
  - [OpenAI Codex CLI](#openai-codex-cli)
  - [Zed](#zed)
  - [Other MCP clients (stdio fallback)](#other-mcp-clients-stdio-fallback)
- [Read-only vs full access](#read-only-vs-full-access)
- [Full capabilities (40 tools)](#full-capabilities-40-tools)
- [Example prompts](#example-prompts)
- [Security & safety](#security--safety)
- [Troubleshooting](#troubleshooting)
- [Self-host](#self-host)
- [License](#license)

---

## What you can do

Fungies MCP is the official [Model Context Protocol](https://modelcontextprotocol.io) server for the [Fungies](https://fungies.io) Merchant of Record platform. Once installed, your AI assistant can:

- **Browse your catalog** — list products, offers, and pricing tiers
- **Manage pricing** — create offers, update plans, set up subscriptions
- **Handle orders & refunds** — look up orders, cancel pending ones, review payment history
- **Manage customers** — find accounts, see what they've purchased, update billing details
- **Run promotions** — create coupon codes and automatic sale discounts
- **Ship game keys** — upload license-key inventory, track what's sold
- **Audit webhooks** — inspect delivery attempts, verify signatures locally
- **Grow subscriptions** — pause, resume, cancel, or charge usage-based extras

All of this happens through natural language — no API documentation required.

---

## Quick start (2 minutes)

### Step 1 — Get your Fungies API keys

1. Log in at [app.fungies.io](https://app.fungies.io).
2. Go to **Developers → API Keys** ([direct link](https://app.fungies.io/devs/api-keys)).
3. Click **Create key pair** and name it something like `Cursor MCP` or `My AI assistant`.
4. You'll see two values:
   - A **public key** starting with `pub_...` — safe to show, used on every call.
   - A **secret key** starting with `sec_...` — **keep this private**, unlocks write operations.
5. Copy both into a password manager. You will paste them into your AI tool in Step 2.

> **Tip** — make a dedicated key pair just for the MCP. If something ever feels off, you can revoke it from the dashboard without breaking your other integrations.

### Step 2 — Pick your AI tool and install

Two ways:

**Option A — One-click install page (easiest for Cursor)**

Open **[https://mcp.fungies.io/install](https://mcp.fungies.io/install)**, paste your keys, and click **Install read-only** or **Install read + write**. Cursor opens and asks you to confirm. Done.

*Your keys never touch our servers — the install page assembles the config in your browser and hands it off to Cursor through a local deep link.*

**Option B — Manual config for your specific tool**

Follow the [tool-specific guide below](#pick-your-ai-tool).

### Step 3 — Try it out

Ask your AI assistant:

> *"List my five most recent products on Fungies."*

If you see a list of products, you're done. If you hit an error, jump to [Troubleshooting](#troubleshooting).

---

## Pick your AI tool

All configs use the same hosted endpoint: `https://mcp.fungies.io/mcp`. No local installation, no Node.js, no Docker.

### Cursor

**Option A — One-click (recommended)**

Visit [mcp.fungies.io/install](https://mcp.fungies.io/install), paste your keys, click Install.

**Option B — Manual**

1. Open the Cursor settings JSON — press `Cmd/Ctrl + Shift + P`, search for **"Open MCP Settings"**, or edit `~/.cursor/mcp.json` directly.
2. Add this block:

```json
{
  "mcpServers": {
    "fungies": {
      "url": "https://mcp.fungies.io/mcp",
      "headers": {
        "x-fngs-public-key": "pub_YOUR_PUBLIC_KEY",
        "x-fngs-secret-key": "sec_YOUR_SECRET_KEY"
      }
    }
  }
}
```

3. Restart Cursor. Open the Agent panel — you should see **"fungies"** in the tool list.

Omit `x-fngs-secret-key` for read-only mode (17 tools, no risk of accidental changes).

### Claude Desktop

Claude Desktop supports remote MCP servers via its custom connectors UI.

1. Open Claude Desktop → **Settings → Connectors → Add custom connector**.
2. Fill in:
   - **Name**: `Fungies`
   - **Remote MCP server URL**: `https://mcp.fungies.io/mcp`
3. Under **Advanced → Custom headers**, add:
   - `x-fngs-public-key` → your `pub_...` key
   - `x-fngs-secret-key` → your `sec_...` key (optional)
4. Save. Start a new chat and Claude will offer Fungies tools.

> **Older Claude Desktop (no custom-connectors UI)** — use the [stdio fallback](#other-mcp-clients-stdio-fallback) at the bottom of this doc.

### Claude Code (CLI)

Claude Code has native remote-MCP support via the `claude mcp add` command.

```bash
claude mcp add --transport http fungies https://mcp.fungies.io/mcp \
  --header "x-fngs-public-key: pub_YOUR_PUBLIC_KEY" \
  --header "x-fngs-secret-key: sec_YOUR_SECRET_KEY"
```

Verify with `claude mcp list` — you should see `fungies` listed. Start any chat and Claude Code will discover the tools automatically.

### VS Code (GitHub Copilot Chat)

VS Code 1.95+ with GitHub Copilot Chat supports MCP servers.

1. Open the command palette — `Cmd/Ctrl + Shift + P`.
2. Run **"MCP: Add server → HTTP"**.
3. When prompted:
   - **URL**: `https://mcp.fungies.io/mcp`
   - **Name**: `fungies`
4. Open `~/.config/Code/User/mcp.json` (or `%APPDATA%\Code\User\mcp.json` on Windows) and add the headers:

```json
{
  "servers": {
    "fungies": {
      "type": "http",
      "url": "https://mcp.fungies.io/mcp",
      "headers": {
        "x-fngs-public-key": "pub_YOUR_PUBLIC_KEY",
        "x-fngs-secret-key": "sec_YOUR_SECRET_KEY"
      }
    }
  }
}
```

5. Reload VS Code. Open Copilot Chat in **Agent** mode — Fungies tools appear in the tool picker.

### Continue.dev

Edit `~/.continue/config.yaml` (or through Continue's settings UI):

```yaml
mcpServers:
  - name: fungies
    type: http
    url: https://mcp.fungies.io/mcp
    requestOptions:
      headers:
        x-fngs-public-key: pub_YOUR_PUBLIC_KEY
        x-fngs-secret-key: sec_YOUR_SECRET_KEY
```

Restart Continue — Fungies tools show up in any agent session.

### Windsurf

1. Open **Settings → Windsurf Settings → Cascade → MCP Servers → Add custom server**.
2. Paste:

```json
{
  "mcpServers": {
    "fungies": {
      "serverUrl": "https://mcp.fungies.io/mcp",
      "headers": {
        "x-fngs-public-key": "pub_YOUR_PUBLIC_KEY",
        "x-fngs-secret-key": "sec_YOUR_SECRET_KEY"
      }
    }
  }
}
```

3. Save and refresh the server list. Fungies tools appear in Cascade.

### OpenAI Codex CLI

Codex CLI supports remote MCP servers via `~/.codex/config.toml`:

```toml
[mcp_servers.fungies]
url = "https://mcp.fungies.io/mcp"

[mcp_servers.fungies.headers]
"x-fngs-public-key" = "pub_YOUR_PUBLIC_KEY"
"x-fngs-secret-key" = "sec_YOUR_SECRET_KEY"
```

Run `codex` in any terminal — it will pick up the config and expose Fungies tools to the session.

### Zed

Zed 0.160+ ships MCP ("context servers") support. Add to `~/.config/zed/settings.json`:

```json
{
  "context_servers": {
    "fungies": {
      "source": "custom",
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://mcp.fungies.io/mcp",
        "--header",
        "x-fngs-public-key:pub_YOUR_PUBLIC_KEY",
        "--header",
        "x-fngs-secret-key:sec_YOUR_SECRET_KEY"
      ]
    }
  }
}
```

Zed bridges to our HTTP endpoint through the [`mcp-remote`](https://www.npmjs.com/package/mcp-remote) helper (ships via `npx`, no install needed).

### Other MCP clients (stdio fallback)

If your MCP host only speaks stdio, use `mcp-remote` as a bridge. Replace the `command`/`args` in your host's config with:

```json
{
  "command": "npx",
  "args": [
    "-y",
    "mcp-remote",
    "https://mcp.fungies.io/mcp",
    "--header",
    "x-fngs-public-key:pub_YOUR_PUBLIC_KEY",
    "--header",
    "x-fngs-secret-key:sec_YOUR_SECRET_KEY"
  ]
}
```

This works for any client that supports a local `command` + `args` style stdio server (older Claude Desktop builds, LibreChat, Goose, Sourcegraph Cody, etc.).

---

## Read-only vs full access

You choose the power level by which key you give the MCP.

| Mode | Headers sent | Tools exposed | Good for |
| --- | --- | --- | --- |
| **Read-only** | `x-fngs-public-key` only | 17 (list/get/inventory/verify) | Analytics, reporting, exploration |
| **Full access** | `x-fngs-public-key` **and** `x-fngs-secret-key` | 40 (adds create / update / archive / cancel / refund flows) | Day-to-day store management |

You can install Fungies twice with different names — e.g. `fungies-read` and `fungies-write` — to keep destructive tools behind an explicit switch.

All destructive tools (`*_archive`, `*_cancel`, `offers_keys_remove`) additionally require `confirm: true` in the call, so your AI cannot accidentally wipe things out.

---

## Full capabilities (40 tools)

All tools return structured JSON suitable for follow-up reasoning. Read-only tools are marked **R**, write tools **W**, destructive tools **D**.

### Products — 6 tools

| Tool | Type | What it does |
| --- | --- | --- |
| `products_list` | R | Browse / search / count products in your catalog |
| `products_get` | R | Full details of one product (variants, plans, status) |
| `products_duplicate` | W | Clone a product as a starting point for a new one |
| `products_create` | W | Create a new product (`OneTimePayment`, `Subscription`, `Membership`, `GameKey`) |
| `products_update` | W | Rename, rewrite copy, change slug |
| `products_archive` | D | Soft-delete a product (also archives its offers) |

### Offers & price points — 5 tools

| Tool | Type | What it does |
| --- | --- | --- |
| `offers_list` | R | Browse offers, filter by product |
| `offers_get` | R | Details of a single offer (price, currency, interval, inventory) |
| `offers_create` | W | Add a price point to a product (one-off or recurring) |
| `offers_update` | W | Rename an offer (price/currency are immutable) |
| `offers_archive` | D | Retire an offer; active subscriptions keep running |

### Game keys / license keys — 2 tools

| Tool | Type | What it does |
| --- | --- | --- |
| `offers_keys_add` | W | Upload new license/game keys into an offer's inventory |
| `offers_keys_remove` | D | Pull an unsold key back; sold keys are preserved |

### Orders — 3 tools

| Tool | Type | What it does |
| --- | --- | --- |
| `orders_list` | R | Filter orders by status, date, recency |
| `orders_get` | R | Full details by UUID or short order number (e.g. `9XMrb9Hk`) |
| `orders_cancel` | D | Mark an order CANCELLED (does not auto-refund) |

### Subscriptions — 7 tools

| Tool | Type | What it does |
| --- | --- | --- |
| `subscriptions_list` | R | Filter by status: active, canceled, paused, past_due |
| `subscriptions_get` | R | Full details: offer, period, cancel date |
| `subscriptions_create` | W | Programmatic create (migration / backfill) |
| `subscriptions_update` | W | Upgrade/downgrade, change billing |
| `subscriptions_cancel` | D | Cancel end-of-period or immediately, optional refund |
| `subscriptions_pause` | W | Pause billing; access stays active |
| `subscriptions_charge` | W | Charge a one-off extra (usage-based billing) |

### Customers — 7 tools

| Tool | Type | What it does |
| --- | --- | --- |
| `users_list` | R | Search by email or username |
| `users_get` | R | Full customer profile |
| `users_inventory` | R | Everything a customer owns (products, subscriptions, access) |
| `users_create` | W | Create a customer record (migration, manual entry) |
| `users_update` | W | Edit email, username, billing details |
| `users_archive` | D | Soft-delete, reversible |
| `users_unarchive` | W | Restore a previously archived customer |

### Discounts — 5 tools

| Tool | Type | What it does |
| --- | --- | --- |
| `discounts_list` | R | Active or archived coupons and sales |
| `discounts_get` | R | Full details of a discount |
| `discounts_create` | W | Coupon (code-redeemable) or sale (auto), % or fixed |
| `discounts_update` | W | Rename, adjust validity window |
| `discounts_archive` | D | Retire a discount |

### Payments — 2 tools

| Tool | Type | What it does |
| --- | --- | --- |
| `payments_list` | R | All transactions, filter by PAID / FAILED / REFUNDED |
| `payments_get` | R | Single payment (fee, tax, invoice URL) |

### Checkout elements — 2 tools

| Tool | Type | What it does |
| --- | --- | --- |
| `elements_list` | R | All embeddable checkout widgets in the store |
| `elements_create` | W | Bind a set of offers into a reusable checkout element |

### Webhooks — 1 tool

| Tool | Type | What it does |
| --- | --- | --- |
| `webhooks_verify` | R | Verify a Fungies webhook signature locally (HMAC-SHA256, timing-safe; no network call). Fungies does not expose a webhook delivery log over the API — use the Fungies dashboard → Developers → Webhooks for delivery history. |

---

## Example prompts

Paste any of these into your AI chat once the MCP is installed.

**Analytics**

> "How many paid orders did I have in the last 7 days? Break it down by product."

> "Show me my 10 biggest customers by lifetime spend."

> "Which subscription offers have the highest churn this quarter?"

**Catalog operations**

> "Duplicate 'Pro Plan' and call the copy 'Pro Plan — EUR'. Then create a €99 yearly offer for it."

> "Add these 500 Steam keys to the 'Indie Bundle' offer."

> "List every offer that's priced under $5."

**Customer support**

> "Find the customer with email `alice@example.com`, show me her inventory, and cancel any active subscriptions at period end."

> "What's the payment status of order 9XMrb9Hk?"

**Promotions**

> "Create a 25% off coupon code `WINTER25` that's valid from now until January 15th."

> "Archive all coupons whose validity window ended before this year."

**Webhooks**

> "Here's a webhook body and the `x-fngs-signature` header. Tell me if the signature is valid given my signing secret."

---

## Security & safety

Fungies MCP is built so your AI can be powerful without being dangerous.

- **No credential storage.** Keys live only in your AI tool's local config. Every request forwards them to `api.fungies.io` and the server forgets them.
- **Read-only install option.** If you only need analytics, use the public key alone — 23 write / destructive tools simply never appear.
- **Destructive confirm gate.** Archive / cancel / remove-key tools require the caller to pass `confirm: true`. Hosts that surface this to you (like Cursor's tool-call dialog) will ask before proceeding.
- **Tool annotations.** Every tool advertises `readOnlyHint` / `destructiveHint` / `idempotentHint` so your AI can reason about risk before calling.
- **Strict input validation.** Every tool input is a `.strict()` Zod object — unknown fields are rejected. All IDs must match `^[A-Za-z0-9_-]{1,64}$`, which blocks path traversal attacks against the upstream API.
- **Origin allowlist.** Browser `Origin` headers are checked against an allowlist (app schemes like `cursor://`, `vscode://` always pass; arbitrary websites are blocked with 403 — defeats DNS rebinding / CSRF).
- **Hard limits.** `/mcp` enforces a 256 KB body cap (413 `payload_too_large`) and a 300 req/min per-key rate limit (+ 120 req/min per IP on everything).
- **Nonce-based CSP on `/install`.** `default-src 'none'` with per-request nonces — no third-party scripts, no inline exec, no framing.
- **Log redaction + audit trail.** `pino` with strict redaction — your keys never show up in logs. Every write call records `{ tool, publicKey (masked), requestId }` with PII fields (email, billingDetails) replaced with `[REDACTED]`.
- **HTTPS-only upstream.** In production the server refuses to start if `FUNGIES_API_BASE` isn't `https://`.
- **Your data is yours.** The server never reads from or writes to a database; it is a pure passthrough to the Fungies API over TLS.
- **Revocation is one click.** Delete the key pair from the Fungies dashboard and the MCP becomes inert immediately.

If you spot a security issue, please report it privately via [help.fungies.io](https://help.fungies.io).

---

## Troubleshooting

**"missing_or_invalid_public_key" (HTTP 401)**
Your `x-fngs-public-key` header is missing or not in the `pub_...` shape. Recheck the value in your MCP config.

**"invalid_secret_key" (HTTP 401)**
Your `x-fngs-secret-key` header is present but doesn't match the `sec_...` shape. Either fix it or remove the header to fall back to read-only mode.

**Tools list is empty in my AI tool**
1. Confirm your AI tool says the server is **connected** (not "starting" / "error").
2. Hit `https://mcp.fungies.io/healthz` in a browser — you should see `{"ok":true, ...}`.
3. Restart your AI tool after editing config — MCP clients only read it on startup.

**"Forbidden" errors on write tools**
You installed with the public key only. Re-install with both keys (or add `x-fngs-secret-key` to the existing config) and restart.

**"Rate limited" messages**
The upstream Fungies API is throttling. The server automatically retries GET/PATCH/DELETE on 429/5xx, but POST is not retried. Try again in a minute.

**Tool call hangs / times out**
Default per-request timeout is 15 s. Long-running list queries? Narrow with `skip` / `take` or a `termOrId` filter.

Still stuck? Open an issue on [GitHub](https://github.com/dukenukemall/fungies-mcp/issues) or ping us in [Discord](https://discord.gg/yfH5ZyTZH4).

---

## Self-host

Want to run the MCP on your own infrastructure? It's a single container.

```bash
docker build -t fungies-mcp .
docker run -p 3000:3000 \
  -e PORT=3000 \
  -e NODE_ENV=production \
  -e LOG_LEVEL=info \
  -e FUNGIES_API_BASE=https://api.fungies.io \
  -e MCP_PUBLIC_URL=https://your-domain.example.com \
  fungies-mcp
```

| Env var | Default | Notes |
| --- | --- | --- |
| `PORT` | `3000` | HTTP listen port |
| `NODE_ENV` | `development` | Set to `production` in prod |
| `LOG_LEVEL` | `info` | `trace` / `debug` / `info` / `warn` / `error` |
| `FUNGIES_API_BASE` | `https://api.fungies.io` | Change for staging environments |
| `MCP_PUBLIC_URL` | `https://mcp.fungies.io` | Baked into the `/install` page |
| `FUNGIES_TIMEOUT_MS` | `15000` | Upstream request timeout |
| `FUNGIES_MAX_RETRIES` | `2` | Retries for GET / PATCH / DELETE on 429 / 5xx |
| `MCP_ALLOWED_ORIGINS` | `mcp.fungies.io,app.fungies.io,fungies.io` | Comma list of https hosts allowed via `Origin` header (app schemes like `cursor://`, `vscode://` are always allowed) |
| `MCP_MAX_BODY_BYTES` | `262144` | Max JSON-RPC request size (256 KB) |
| `RATE_LIMIT_IP_PER_MIN` | `120` | Per-IP request cap across the whole server |
| `RATE_LIMIT_KEY_PER_MIN` | `300` | Per-public-key request cap on `/mcp` |

The container runs as a non-root user, ships a health endpoint at `/healthz`, and exposes a clickable onboarding UI at `/install`.

---

## Sister project

[`dukenukemall/fungies-cli`](https://github.com/dukenukemall/fungies-cli) — same Fungies API surface, different transport (terminal). Great for shell scripts and CI.

## License

MIT © Fungies
