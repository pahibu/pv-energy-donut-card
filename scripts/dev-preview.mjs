import { createReadStream, existsSync, statSync, watch } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";
import http from "node:http";

const PORT = 4173;
const HOST = "127.0.0.1";
const ROOT = resolve(".");
const INDEX_FILE = join(ROOT, "preview.html");

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ts": "text/plain; charset=utf-8"
};

const clients = new Set();

const sendReload = () => {
  for (const client of clients) {
    client.write("event: reload\n");
    client.write(`data: ${Date.now()}\n\n`);
  }
};

const watchTargets = [
  join(ROOT, "dist"),
  join(ROOT, "preview"),
  join(ROOT, "preview.html")
];

for (const target of watchTargets) {
  if (!existsSync(target)) continue;
  watch(target, { recursive: statSafe(target)?.isDirectory() ?? false }, () => {
    sendReload();
  });
}

const server = http.createServer((request, response) => {
  const url = new URL(request.url ?? "/", `http://${HOST}:${PORT}`);

  if (url.pathname === "/__dev_reload") {
    response.writeHead(200, {
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Content-Type": "text/event-stream"
    });
    response.write("retry: 250\n\n");
    clients.add(response);
    request.on("close", () => {
      clients.delete(response);
    });
    return;
  }

  const requestedPath = url.pathname === "/" ? "/preview.html" : url.pathname;
  const safePath = normalize(requestedPath).replace(/^(\.\.[/\\])+/, "");
  const filePath = join(ROOT, safePath);

  if (!filePath.startsWith(ROOT) || !existsSync(filePath) || statSafe(filePath)?.isDirectory()) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  const ext = extname(filePath);
  response.writeHead(200, {
    "Cache-Control": "no-store",
    "Content-Type": contentTypes[ext] ?? "application/octet-stream"
  });
  createReadStream(filePath).pipe(response);
});

server.listen(PORT, HOST, () => {
  console.log(`Live preview running at http://${HOST}:${PORT}/`);
  console.log("Run `npm run dev` in a second terminal for automatic rebuilds.");
});

function statSafe(path) {
  try {
    return statSync(path);
  } catch {
    return null;
  }
}
