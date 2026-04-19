const MCP_PUBLIC_URL = process.env.MCP_PUBLIC_URL ?? 'https://mcp.fungies.io'

export function installPage(nonce: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="robots" content="noindex"/>
<title>Install Fungies MCP in Cursor</title>
<style nonce="${nonce}">
:root { color-scheme: light dark; }
*,*::before,*::after { box-sizing: border-box; }
body { margin: 0; font: 16px/1.55 -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif; background: #0b0d10; color: #e7eaee; min-height: 100vh; display: grid; place-items: center; padding: 24px; }
.card { width: 100%; max-width: 560px; background: #12161b; border: 1px solid #1f262f; border-radius: 16px; padding: 28px; box-shadow: 0 20px 60px rgba(0,0,0,.35); }
h1 { margin: 0 0 6px; font-size: 22px; letter-spacing: -0.01em; }
p.sub { margin: 0 0 22px; color: #9aa4b1; font-size: 14px; }
label { display: block; font-size: 13px; font-weight: 600; margin: 14px 0 6px; color: #cfd6df; }
input { width: 100%; padding: 12px 14px; background: #0b0d10; color: #e7eaee; border: 1px solid #242d38; border-radius: 10px; font: inherit; font-family: ui-monospace, "SF Mono", Menlo, monospace; font-size: 13px; transition: border-color .15s, box-shadow .15s; }
input:focus { outline: none; border-color: #3a6df0; box-shadow: 0 0 0 3px rgba(58,109,240,.25); }
input::placeholder { color: #515b68; }
.row { display: grid; gap: 12px; grid-template-columns: 1fr 1fr; margin-top: 24px; }
button { appearance: none; border: 0; padding: 14px 16px; border-radius: 10px; font: inherit; font-weight: 600; cursor: pointer; transition: transform .06s ease, filter .15s ease, opacity .15s ease; }
button:active { transform: translateY(1px); }
button:disabled { opacity: .45; cursor: not-allowed; }
.btn-primary { background: linear-gradient(180deg,#4f7ff7,#2f59d4); color: #fff; }
.btn-primary:hover:not(:disabled) { filter: brightness(1.05); }
.btn-secondary { background: #1d242c; color: #e7eaee; border: 1px solid #2a333d; }
.btn-secondary:hover:not(:disabled) { background: #232a33; }
.hint { margin-top: 14px; color: #9aa4b1; font-size: 12.5px; }
.hint a { color: #7ea4ff; }
.badge { display: inline-block; background: #1d242c; color: #9aa4b1; padding: 2px 8px; border-radius: 999px; font-size: 11px; margin-left: 8px; vertical-align: middle; }
pre.snippet { background:#0b0d10; border:1px solid #1f262f; border-radius:10px; padding:12px; font-size:12px; overflow:auto; margin-top:16px; color:#b6c2cf; }
</style>
</head>
<body>
  <main class="card">
    <h1>Install Fungies MCP in Cursor <span class="badge">v0.2.2</span></h1>
    <p class="sub">Paste your Fungies API keys, then pick read-only or full access. Your keys stay in this browser &mdash; they are never sent to our server.</p>

    <label for="pub">Public key (required)</label>
    <input id="pub" autocomplete="off" spellcheck="false" placeholder="pub_..." />

    <label for="sec">Secret key (optional, enables write tools)</label>
    <input id="sec" autocomplete="off" spellcheck="false" placeholder="sec_..." type="password" />

    <div class="row">
      <button id="installRead" class="btn-secondary" disabled>Install read-only</button>
      <button id="installFull" class="btn-primary" disabled>Install read + write</button>
    </div>

    <p class="hint">Don't have keys? Generate them in the <a href="https://app.fungies.io/devs/api-keys" target="_blank" rel="noreferrer">Fungies dashboard</a>.</p>

    <pre class="snippet" id="snippet" hidden></pre>
  </main>
<script nonce="${nonce}">
(function(){
  var PUB_RE = /^pub_[A-Za-z0-9_-]+$/;
  var SEC_RE = /^sec_[A-Za-z0-9_-]+$/;
  var MCP_URL = ${JSON.stringify(`${MCP_PUBLIC_URL}/mcp`)};
  var pub = document.getElementById('pub');
  var sec = document.getElementById('sec');
  var btnRead = document.getElementById('installRead');
  var btnFull = document.getElementById('installFull');
  var snippet = document.getElementById('snippet');

  function validate() {
    var pubOk = PUB_RE.test(pub.value.trim());
    var secVal = sec.value.trim();
    var secOk = secVal === '' || SEC_RE.test(secVal);
    btnRead.disabled = !pubOk;
    btnFull.disabled = !(pubOk && secVal && secOk);
  }

  function buildDeeplink(includeSecret) {
    var headers = { 'x-fngs-public-key': pub.value.trim() };
    if (includeSecret) headers['x-fngs-secret-key'] = sec.value.trim();
    var cfg = { url: MCP_URL, headers: headers };
    var b64 = btoa(JSON.stringify(cfg));
    return 'cursor://anysphere.cursor-deeplink/mcp/install?name=fungies&config=' + encodeURIComponent(b64);
  }

  function showSnippet(includeSecret) {
    var headers = { 'x-fngs-public-key': pub.value.trim() };
    if (includeSecret) headers['x-fngs-secret-key'] = sec.value.trim();
    var jsonCfg = JSON.stringify({ mcpServers: { fungies: { url: MCP_URL, headers: headers } } }, null, 2);
    snippet.hidden = false;
    snippet.textContent = jsonCfg;
  }

  pub.addEventListener('input', validate);
  sec.addEventListener('input', validate);
  btnRead.addEventListener('click', function(){
    window.location.href = buildDeeplink(false);
    showSnippet(false);
  });
  btnFull.addEventListener('click', function(){
    window.location.href = buildDeeplink(true);
    showSnippet(true);
  });
})();
</script>
</body>
</html>`
}
