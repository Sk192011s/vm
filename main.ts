import { serve } from "https://deno.land/std@0.203.0/http/server.ts";

const userID = "4b8dee67-3bbf-4ecc-bbd8-4654862f61de";
const credit = "DenoBy-ModsBots";

serve((req) => {
  const url = new URL(req.url);

  if (req.headers.get("upgrade")?.toLowerCase() === "websocket") {
    // WebSocket handler placeholder
    const { socket, response } = Deno.upgradeWebSocket(req);
    socket.onmessage = (e) => console.log("WS msg:", e.data);
    socket.onclose = () => console.log("WS closed");
    return response;
  }

  switch (url.pathname) {
    case "/":
      return new Response(generateHomeHTML(userID), {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    case `/${userID}`:
      return new Response(generateConfigHTML(userID, url.hostname), {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    default:
      return new Response("Not Found", { status: 404 });
  }
});

function generateHomeHTML(userID: string) {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Deno Proxy Online</title>
  <style>
    body{font-family:sans-serif;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;background:#f0f2f5}
    .card{background:#fff;padding:40px;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,0.1);max-width:500px;text-align:center}
    h1{color:#2c3e50;font-size:2.5em;margin-bottom:20px}
    p{color:#555;font-size:1.1em}
    a.button{display:inline-block;margin-top:30px;padding:12px 25px;background:#007bff;color:#fff;border-radius:8px;text-decoration:none;transition:.3s}
    a.button:hover{background:#0056b3}
  </style></head>
  <body>
    <div class="card">
      <h1>🚀 Deno Proxy Online!</h1>
      <p>Your VLESS over WebSocket proxy is ready.</p>
      <a class="button" href="/${userID}">Get My VLESS Config</a>
    </div>
  </body>
  </html>
  `;
}

function generateConfigHTML(userID: string, host: string) {
  const port = 443;
  const vlessURI = `vless://${userID}@${host}:${port}?encryption=none&security=tls&sni=${host}&fp=randomized&type=ws&host=${host}&path=%2F%3Fed%3D2048#${credit}`;
  const clashConfig = `- type: vless\n  name: ${host}\n  server: ${host}\n  port: ${port}\n  uuid: ${userID}\n  network: ws\n  tls: true\n  ws-opts:\n    path: "/?ed=2048"\n    headers:\n      host: ${host}`;

  return `
  <!DOCTYPE html>
  <html lang="en">
  <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>VLESS Config</title>
  <style>
    body{font-family:monospace;display:flex;flex-direction:column;align-items:center;background:#f0f2f5;margin:0;padding:20px}
    .card{background:#fff;padding:30px;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,0.1);width:90%;max-width:800px;margin-bottom:20px;position:relative}
    pre{background:#e9ecef;padding:15px;border-radius:8px;overflow-x:auto}
    button{position:absolute;top:15px;right:15px;padding:8px 15px;border:none;border-radius:5px;background:#28a745;color:#fff;cursor:pointer}
    button:hover{background:#218838}
  </style></head>
  <body>
    <div class="card">
      <h2>VLESS URI</h2>
      <pre id="vless">${vlessURI}</pre>
      <button onclick="copy('vless')">Copy</button>
    </div>
    <div class="card">
      <h2>Clash Config</h2>
      <pre id="clash">${clashConfig}</pre>
      <button onclick="copy('clash')">Copy</button>
    </div>
    <script>
      function copy(id){navigator.clipboard.writeText(document.getElementById(id).innerText).then(()=>alert('Copied!'));}
    </script>
  </body>
  </html>
  `;
}
