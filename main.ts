import { exists } from "https://deno.land/std/fs/exists.ts";

// UUID & environment
const envUUID = Deno.env.get("UUID") || "4b8dee67-3bbf-4ecc-bbd8-4654862f61de";
const proxyIP = Deno.env.get("PROXYIP") || "";
const credit = Deno.env.get("CREDIT") || "Deno Proxy";
const userID = envUUID;

Deno.serve(async (request: Request) => {
  const upgrade = request.headers.get("upgrade") || "";
  if (upgrade.toLowerCase() != "websocket") {
    const url = new URL(request.url);

    switch (url.pathname) {
      // ================================
      //  FRONT PAGE
      // ================================
      case "/": {
        const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Deno Proxy</title>
<style>
    body {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        margin: 0;
        background-color: #f0f2f5;
        color: #333;
        text-align: center;
    }
    .container {
        background-color: #ffffff;
        padding: 40px 60px;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        max-width: 600px;
        width: 90%;
    }
    h1 { color: #2c3e50; font-size: 2.5em; margin-bottom: 10px; }
    p { color: #555; margin-bottom: 25px; }
    a.button {
        display: inline-block;
        background-color: #007bff;
        color: white;
        padding: 12px 25px;
        border-radius: 8px;
        text-decoration: none;
        font-size: 1.1em;
        transition: 0.3s;
    }
    a.button:hover { background-color: #0056b3; }
    .footer {
        margin-top: 40px;
        font-size: 0.9em;
        color: #888;
    }
    .footer a {
        color: #007bff;
        text-decoration: none;
    }
</style>
</head>
<body>
<div class="container">
    <h1>🚀 Deno Proxy Online</h1>
    <p>Your VLESS over WebSocket proxy is ready.</p>
    <a href="/${userID}" class="button">Get VLESS Config</a>
    <div class="footer">
        Powered by Deno • Support: <a href="https://t.me/iqowoq" target="_blank">@iqowoq</a>
    </div>
</div>
</body>
</html>
        `;
        return new Response(htmlContent, { headers: { "Content-Type": "text/html" } });
      }

      // ================================
      //  CONFIG PAGE
      // ================================
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
      host: ${hostName}
        `;

        const htmlConfigContent = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Your VLESS Configuration</title>
<style>
body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background-color: #f8f9fa;
    color: #333;
    text-align: center;
    padding: 40px 15px;
}
.container {
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
    padding: 30px 40px;
    max-width: 800px;
    margin: auto;
}
h1 { color: #2c3e50; }
.config-block {
    background: #e9ecef;
    padding: 20px;
    border-radius: 10px;
    text-align: left;
    position: relative;
    margin-top: 20px;
}
pre {
    white-space: pre-wrap;
    word-break: break-all;
    font-family: monospace;
}
.copy-button {
    position: absolute;
    top: 10px;
    right: 10px;
    background: #007bff;
    color: white;
    border: none;
    padding: 6px 14px;
    border-radius: 5px;
    cursor: pointer;
}
.footer {
    margin-top: 30px;
    font-size: 0.9em;
    color: #777;
}
.footer a { color: #007bff; text-decoration: none; }
</style>
</head>
<body>
<div class="container">
    <h1>🔑 Your VLESS Configuration</h1>
    <p>UUID: <b>${userID}</b></p>
    <div class="config-block">
        <pre id="vless">${vlessMain}</pre>
        <button class="copy-button" onclick="copyText('vless')">Copy</button>
    </div>
    <h3>Clash-Meta Config</h3>
    <div class="config-block">
        <pre id="clash">${clashMetaConfig.trim()}</pre>
        <button class="copy-button" onclick="copyText('clash')">Copy</button>
    </div>
</div>
<script>
function copyText(id) {
  const text = document.getElementById(id).innerText;
  navigator.clipboard.writeText(text).then(() => alert('Copied!'));
}
</script>
<div class="footer">
  Powered by Deno • Support: <a href="https://t.me/iqowoq" target="_blank">@iqowoq</a>
</div>
</body>
</html>`;
        return new Response(htmlConfigContent, { headers: { "Content-Type": "text/html" } });
      }

      default:
        return new Response("Not Found", { status: 404 });
    }
  } else {
    // handle websocket if needed
    return new Response("WebSocket not implemented", { status: 501 });
  }
});
