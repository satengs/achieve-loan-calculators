import { cpSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function copyJsonTree(fromRel, toRel) {
  const from = join(root, fromRel);
  const to = join(root, toRel);
  mkdirSync(to, { recursive: true });
  for (const name of readdirSync(from)) {
    const src = join(from, name);
    const dest = join(to, name);
    if (statSync(src).isDirectory()) {
      copyJsonTree(join(fromRel, name), join(toRel, name));
    } else if (name.endsWith(".json")) {
      cpSync(src, dest);
    }
  }
}

copyJsonTree("src/content", "dist/content");
copyJsonTree("src/config", "dist/config");
console.log("Copied JSON assets into dist/");
