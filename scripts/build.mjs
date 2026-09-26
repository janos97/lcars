// Bundles src/ into dist/:
//   dist/lcars.css       readable bundle (imports inlined, nesting lowered)
//   dist/lcars.min.css   minified bundle
//   dist/lcars.js        the optional JS helper
//   dist/fonts/          Antonio webfont + licence
//
// `node scripts/build.mjs --check` builds in memory and exits non-zero if
// dist/ is out of date (used by the tests / CI).
import { bundle } from "lightningcss";
import { mkdirSync, readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "src");
const DIST = join(ROOT, "dist");
const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));

// Oldest browsers we support: the first versions with :has(), @layer and
// color-mix(). lightningcss lowers anything newer for them.
const v = (major, minor = 0) => (major << 16) | (minor << 8);
export const targets = { chrome: v(111), edge: v(111), firefox: v(121), safari: v(16, 4), ios_saf: v(16, 4) };

const banner = (name) => `/*! ${name} v${pkg.version} | MIT | ${pkg.repository.url.replace(/\.git$/, "")} */\n`;

export function buildOutputs() {
  const bundleCss = (minify) =>
    bundle({ filename: join(SRC, "css", "lcars.css"), minify, targets }).code.toString();

  const outputs = new Map([
    ["lcars.css", banner("LCARS") + bundleCss(false)],
    ["lcars.min.css", banner("LCARS") + bundleCss(true)],
    ["lcars.js", banner("LCARS helpers") + readFileSync(join(SRC, "js", "lcars.js"), "utf8")],
  ]);
  for (const file of readdirSync(join(SRC, "fonts"))) {
    outputs.set(join("fonts", file), readFileSync(join(SRC, "fonts", file)));
  }
  return outputs;
}

function write(outputs) {
  mkdirSync(join(DIST, "fonts"), { recursive: true });
  for (const [file, contents] of outputs) writeFileSync(join(DIST, file), contents);
}

export function staleFiles(outputs = buildOutputs()) {
  return [...outputs].filter(([file, contents]) => {
    const path = join(DIST, file);
    return !existsSync(path) || !readFileSync(path).equals(Buffer.from(contents));
  }).map(([file]) => file);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const outputs = buildOutputs();
  if (process.argv.includes("--check")) {
    const stale = staleFiles(outputs);
    if (stale.length) {
      console.error(`dist/ is out of date (${stale.join(", ")}). Run \`npm run build\`.`);
      process.exit(1);
    }
    console.log("dist/ is up to date.");
  } else {
    write(outputs);
    const size = (f) => `${(Buffer.byteLength(outputs.get(f)) / 1024).toFixed(1)} kB`;
    console.log(`Built dist/ — lcars.css ${size("lcars.css")}, lcars.min.css ${size("lcars.min.css")}, lcars.js ${size("lcars.js")}`);
  }
}
