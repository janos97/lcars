// Dev server: serves the repo over HTTP and rebuilds dist/ when src/ changes.
//   npm run dev            → http://localhost:4747/examples/
//   PORT=8080 npm run dev
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { watch } from "node:fs";
import { extname, join, normalize, sep } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const PORT = Number(process.env.PORT) || 4747;
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/plain; charset=utf-8",
};

const build = () => spawnSync(process.execPath, [join(ROOT, "scripts", "build.mjs")], { stdio: "inherit" });
build();

let pending;
watch(join(ROOT, "src"), { recursive: true }, () => {
  clearTimeout(pending);
  pending = setTimeout(build, 50);
});

createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  let path = normalize(join(ROOT, decodeURIComponent(url.pathname)));
  if (!path.startsWith(ROOT) || path.split(sep).includes("node_modules")) {
    res.writeHead(403).end();
    return;
  }
  try {
    if ((await stat(path)).isDirectory()) path = join(path, "index.html");
    const body = await readFile(path);
    res.writeHead(200, { "content-type": TYPES[extname(path)] ?? "application/octet-stream", "cache-control": "no-store" });
    res.end(body);
  } catch {
    res.writeHead(404, { "content-type": "text/plain" }).end("Not found");
  }
}).listen(PORT, () => console.log(`LCARS dev server → http://localhost:${PORT}/examples/`));
