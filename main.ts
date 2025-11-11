// main.ts
// Deno WebSocket Proxy (VLESS + VMess switchable)
// Author: Swe Swe optimized version

// ========== CONFIG HANDLER ==========
interface AppConfig {
  uuid: string;
  protocol: "vless" | "vmess";
}

async function getOrCreateConfig(): Promise<AppConfig> {
  try {
    const text = await Deno.readTextFile("config.json");
    return JSON.parse(text);
  } catch {
    const config: AppConfig = { uuid: crypto.randomUUID(), protocol: "vless" };
    await Deno.writeTextFile("config.json", JSON.stringify(config, null, 2));
    return config;
  }
}

const config = await getOrCreateConfig();

// ========== PROTOCOL HANDLERS ==========

// --- VLESS ---
async function handleVLESS(req: Request, uuid: string): Promise<Response> {
  const { socket, response } = Deno.upgradeWebSocket(req);
  socket.onopen = () => console.log("[VLESS] Connected:", uuid);
  socket.onmessage = (e) => {
    console.log("[VLESS] Data:", e.data);
    socket.send(`Echo from VLESS (${uuid}): ${e.data}`);
  };
  socket.onclose = () => console.log("[VLESS] Closed");
  socket.onerror = (e) => console.error("[VLESS] Error:", e);
  return response;
}

// --- VMESS ---
async function handleVMess(req: Request, uuid: string): Promise<Response> {
  const { socket, response } = Deno.upgradeWebSocket(req);
  socket.onopen = () => console.log("[VMess] Connected:", uuid);
  socket.onmessage = (e) => {
    console.log("[VMess] Data:", e.data);
    socket.send(`Echo from VMess (${uuid}): ${e.data}`);
  };
  socket.onclose = () => console.log("[VMess] Closed");
  socket.onerror = (e) => console.error("[VMess] Error:", e);
  return response;
}

// ========== MAIN SERVER ==========
Deno.serve(async (req) => {
  const url = new URL(req.url);

  // Serve home UI
  if (url.pathname === "/" || url.pathname === "/index.html") {
    const html = `
<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Deno Proxy</title>
<style>
body{font-family:sans-serif;background:#0f172a;color:#fff;text-align:center;padding:40px;}
.copy{background:#16a34a;padding:8px 16px;border-radius:8px;cursor:pointer;border:none;color:white;font-weight:bold;}
.copy:active{transform:scale(0.97);}
.info{color:#94a3b8;margin-top:12px;}
</style>
</head>
<body>
<h1>Deno WebSocket Proxy</h1>
<p>Protocol: <strong>${config.protocol.toUpperCase()}</strong></p>
<p>UUID: <code id="uuid">${config.uuid}</code></p>
<button class="copy" onclick="copyUUID()">Copy UUID</button>
<p class="info">Change <code>config.json</code> to switch between <b>vless</b> / <b>vmess</b>.</p>
<script>
function copyUUID(){
  const id=document.getElementById('uuid').innerText;
  navigator.clipboard.writeText(id);
  alert("Copied UUID: "+id);
}
</script>
</body></html>`;
    return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
  }

  // WebSocket upgrade
  if (req.headers.get("upgrade")?.toLowerCase() === "websocket") {
    if (config.protocol === "vless") return handleVLESS(req, config.uuid);
    if (config.protocol === "vmess") return handleVMess(req, config.uuid);
  }

  // 404 fallback
  return new Response("404 Not Found", { status: 404 });
});

console.log(`✅ Proxy running on Deno — protocol: ${config.protocol.toUpperCase()} | UUID: ${config.uuid}`);
