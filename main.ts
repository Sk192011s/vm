import { exists } from "https://deno.land/std/fs/exists.ts";

// ===================== UUID & Environment =====================
const envUUID = Deno.env.get("UUID") || "59a5a2d1-30ff-42b7-ab70-57b55194a700";
const proxyIP = Deno.env.get("PROXYIP") || "";
const credit = Deno.env.get("CREDIT") || "Deno Proxy";
const CONFIG_FILE = "config.json";

interface Config {
  uuid?: string;
}

// ===================== Read/Save UUID =====================
async function getUUIDFromConfig(): Promise<string | undefined> {
  if (await exists(CONFIG_FILE)) {
    try {
      const configText = await Deno.readTextFile(CONFIG_FILE);
      const config: Config = JSON.parse(configText);
      if (config.uuid && isValidUUID(config.uuid)) {
        console.log(`Loaded UUID from ${CONFIG_FILE}: ${config.uuid}`);
        return config.uuid;
      }
    } catch (e) {
      console.warn(`Error reading or parsing ${CONFIG_FILE}:`, e.message);
    }
  }
  return undefined;
}

async function saveUUIDToConfig(uuid: string): Promise<void> {
  try {
    const config: Config = { uuid: uuid };
    await Deno.writeTextFile(CONFIG_FILE, JSON.stringify(config, null, 2));
    console.log(`Saved new UUID to ${CONFIG_FILE}: ${uuid}`);
  } catch (e) {
    console.error(`Failed to save UUID to ${CONFIG_FILE}:`, e.message);
  }
}

// ===================== Initialize UUID =====================
let userID: string;

if (envUUID && isValidUUID(envUUID)) {
  userID = envUUID;
} else {
  const configUUID = await getUUIDFromConfig();
  if (configUUID) {
    userID = configUUID;
  } else {
    userID = crypto.randomUUID();
    await saveUUIDToConfig(userID);
  }
}

if (!isValidUUID(userID)) throw new Error("uuid is not valid");

// ===================== Deno Serve =====================
Deno.serve(async (request: Request) => {
  const upgrade = request.headers.get("upgrade") || "";

  if (upgrade.toLowerCase() != "websocket") {
    const url = new URL(request.url);

    switch (url.pathname) {
      // -------------------- MAIN UI --------------------
      case "/": {
        const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Deno Proxy</title>
<style>
body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin:0; background:#f0f2f5; text-align:center;}
.container {background:#fff;padding:40px 60px;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,0.1);max-width:600px;width:90%;}
h1 {color:#2c3e50;font-size:2.5em;margin-bottom:10px;}
p {color:#555;margin-bottom:25px;}
a.button {display:inline-block;background:#007bff;color:white;padding:12px 25px;border-radius:8px;text-decoration:none;font-size:1.1em;transition:0.3s;}
a.button:hover {background:#0056b3;}
.footer {margin-top:40px;font-size:0.9em;color:#888;}
.footer a {color:#007bff;text-decoration:none;}
</style>
</head>
<body>
<div class="container">
<h1>🚀 Deno Proxy Online</h1>
<p>Your VLESS over WebSocket proxy is ready.</p>
<a href="/${userID}" class="button">Get VLESS Config</a>
<div class="footer">Powered by Deno • Support: <a href="https://t.me/iqowoq" target="_blank">@iqowoq</a></div>
</div>
</body>
</html>`;
        return new Response(htmlContent, {
          headers: { "Content-Type": "text/html; charset=utf-8" },
        });
      }

      // -------------------- CONFIG PAGE --------------------
      case `/${userID}`: {
        const hostName = url.hostname;
        const port = url.port || (url.protocol === "https:" ? 443 : 80);

        const vlessMain = `vless://${userID}@${hostName}:${port}?encryption=none&security=tls&sni=${hostName}&fp=randomized&type=ws&host=${hostName}&path=%2F%3Fed%3D2048#${credit}`;
        const clashMetaConfig = `
- type: vless
  name: ${hostName}
  server: ${hostName}
  port: ${port}
  uuid: ${userID}
  network: ws
  tls: true
  udp: false
  sni: ${hostName}
  client-fingerprint: chrome
  ws-opts:
    path: "/?ed=2048"
    headers:
      host: ${hostName}`;

        const htmlConfigContent = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Your VLESS Configuration</title>
<style>
body { font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; display:flex; flex-direction:column; justify-content:center; align-items:center; min-height:100vh; margin:0; background:#f0f2f5; padding:20px;}
.container {background:#fff; padding:40px 60px; border-radius:12px; box-shadow:0 10px 30px rgba(0,0,0,0.1); max-width:800px; width:90%; margin-bottom:20px;}
h1 {font-size:2em; margin-bottom:15px; color:#2c3e50;}
h2 {font-size:1.5em; margin-top:20px; margin-bottom:10px; border-bottom:2px solid #eee; padding-bottom:5px;}
.config-block {background:#e9ecef; border-left:5px solid #007bff; padding:15px; margin:15px 0; border-radius:8px; text-align:left; position:relative;}
.config-block pre {white-space:pre-wrap; word-wrap:break-word; font-family:'Cascadia Code', monospace; font-size:0.95em; color:#36454F;}
.copy-button {position:absolute; top:10px; right:10px; background:#28a745; color:white; border:none; padding:8px 15px; border-radius:5px; cursor:pointer; font-size:0.9em;}
.copy-button:hover {background:#218838;}
.footer {margin-top:20px; font-size:0.9em; color:#888;}
.footer a {color:#007bff; text-decoration:none;}
</style>
</head>
<body>
<div class="container">
<h1>🔑 Your VLESS Configuration</h1>
<p>Click "Copy" to copy your configuration.</p>

<h2>VLESS URI</h2>
<div class="config-block">
<pre id="vless-uri">${vlessMain}</pre>
<button class="copy-button" onclick="copyToClipboard('vless-uri')">Copy</button>
</div>

<h2>Clash-Meta</h2>
<div class="config-block">
<pre id="clash-meta">${clashMetaConfig.trim()}</pre>
<button class="copy-button" onclick="copyToClipboard('clash-meta')">Copy</button>
</div>

<div class="footer">Powered by Deno • Support: <a href="https://t.me/iqowoq" target="_blank">@iqowoq</a></div>
</div>

<script>
function copyToClipboard(id) {
  const text = document.getElementById(id).innerText;
  navigator.clipboard.writeText(text).then(()=>alert("Copied!")).catch(()=>alert("Copy failed"));
}
</script>

</body>
</html>
`;
        return new Response(htmlConfigContent, {
          status: 200,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        });
      }

      default:
        return new Response("Not Found", { status: 404 });
    }
  } else {
    // -------------------- WEBSOCKET / VLESS --------------------
    return await vlessOverWSHandler(request);
  }
});

// ===================== VALIDATE UUID =====================
function isValidUUID(uuid: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// ===================== VLESS Handler =====================
// Copy your original `vlessOverWSHandler(request)` implementation here
//  => This ensures VLESS client can connect normally
