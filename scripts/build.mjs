// Builds everything derived from src/:
//   dist/lcars.css            readable bundle (imports inlined)
//   dist/lcars.min.css        minified bundle
//   dist/lcars.js             the optional JS helper
//   dist/fonts/               Antonio webfont + licence
//   + the generated docs listed in scripts/docs.mjs
//
// `node scripts/build.mjs --check` builds in memory and exits non-zero if
// any generated file is out of date (used by the tests / CI).
import { bundle } from "lightningcss";
import { mkdirSync, readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { generateDocs } from "./docs.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "src");
const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));

// Oldest browsers we support: the first versions with :has(), @layer and
// color-mix(). lightningcss lowers anything newer for them.
const v = (major, minor = 0) => (major << 16) | (minor << 8);
export const targets = { chrome: v(111), edge: v(111), firefox: v(121), safari: v(16, 4), ios_saf: v(16, 4) };

const banner = (name) => `/*! ${name} v${pkg.version} | MIT | ${pkg.repository.url.replace(/\.git$/, "")} */\n`;

/** Map of repo-relative path → contents for every generated file. */
export async function buildOutputs() {
  const bundleCss = (minify) =>
    bundle({ filename: join(SRC, "css", "lcars.css"), minify, targets }).code.toString();

  const outputs = new Map([
    ["dist/lcars.css", banner("LCARS") + bundleCss(false)],
    ["dist/lcars.min.css", banner("LCARS") + bundleCss(true)],
    ["dist/lcars.js", banner("LCARS helpers") + readFileSync(join(SRC, "js", "lcars.js"), "utf8")],
  ]);
  for (const file of readdirSync(join(SRC, "fonts"))) {
    outputs.set(`dist/fonts/${file}`, readFileSync(join(SRC, "fonts", file)));
  }
  for (const [file, contents] of await generateDocs()) outputs.set(file, contents);
  return outputs;
}

function write(outputs) {
  for (const [file, contents] of outputs) {
    mkdirSync(dirname(join(ROOT, file)), { recursive: true });
    writeFileSync(join(ROOT, file), contents);
  }
}

export async function staleFiles(outputs) {
  outputs ??= await buildOutputs();
  return [...outputs]
    .filter(([file, contents]) => {
      const path = join(ROOT, file);
      return !existsSync(path) || !readFileSync(path).equals(Buffer.from(contents));
    })
    .map(([file]) => file);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const outputs = await buildOutputs();
  if (process.argv.includes("--check")) {
    const stale = await staleFiles(outputs);
    if (stale.length) {
      console.error(`Generated files are out of date (${stale.join(", ")}). Run \`npm run build\`.`);
      process.exit(1);
    }
    console.log("Generated files are up to date.");
  } else {
    write(outputs);
    const size = (f) => `${(Buffer.byteLength(outputs.get(f)) / 1024).toFixed(1)} kB`;
    console.log(
      `Built ${outputs.size} files — lcars.css ${size("dist/lcars.css")}, lcars.min.css ${size("dist/lcars.min.css")}, lcars.js ${size("dist/lcars.js")}, llms-full.txt ${size("llms-full.txt")}`,
    );
  }
}
