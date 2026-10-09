#!/usr/bin/env node
/**
 * Build-time generator for the demo "Technical details" tab.
 *
 * Reads (monorepo root):
 *   docs/calculators/<slug>.md
 *   packages/calculators/src/content/<slug>.content.json
 *   packages/calculators/src/config/<slug>.config.json
 *   packages/calculators/src/calc/*.test.ts (counts it() inside the mapped describe blocks)
 * Writes apps/demo/src/generated/tech-registry.json (committed, regenerated on predev/prebuild).
 *
 * Markdown is stored as plain text and rendered client-side with react-markdown
 * (raw HTML skipped), so docs and UI stay in sync without HTML injection.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const demoRoot = resolve(here, "..");
const repoRoot = resolve(demoRoot, "../..");
const outFile = join(demoRoot, "src/generated/tech-registry.json");
const metaFile = join(demoRoot, "src/lib/tech-meta.json");

const meta = JSON.parse(readFileSync(metaFile, "utf8"));

if (!existsSync(join(repoRoot, "docs/calculators"))) {
  if (existsSync(outFile)) {
    console.log("[tech-registry] docs/ not available — keeping committed registry");
    process.exit(0);
  }
  console.error("[tech-registry] docs/ missing and no committed registry");
  process.exit(1);
}

/** Count it()/test() calls per top-level describe block in a test file. */
function countByDescribe(src) {
  const counts = {};
  const titles = {};
  let current = null;
  for (const line of src.split(/\r?\n/)) {
    const d = line.match(/^describe\(\s*["'`](.+?)["'`]/);
    if (d) {
      current = d[1];
      counts[current] = 0;
      titles[current] = [];
      continue;
    }
    const t = line.match(/^\s+(?:it|test)\(\s*["'`](.+?)["'`]/);
    if (t && current) {
      counts[current] += 1;
      titles[current].push(t[1]);
    }
  }
  return { counts, titles };
}

const testCache = {};
function testInfo(file) {
  if (!testCache[file]) {
    testCache[file] = countByDescribe(readFileSync(join(repoRoot, file), "utf8"));
  }
  return testCache[file];
}


/** Split a calculator doc into "## " sections (title → markdown body). */
function splitSections(md) {
  const out = {};
  let title = "_intro";
  let buf = [];
  for (const line of md.split(/\r?\n/)) {
    const h = line.match(/^## (.+)$/);
    if (h) {
      out[title] = buf.join("\n").trim();
      title = h[1].trim();
      buf = [];
    } else buf.push(line);
  }
  out[title] = buf.join("\n").trim();
  return out;
}

const firstParagraph = (md = "") => md.split(/\n\s*\n/).map((p) => p.trim()).find((p) => p && !p.startsWith("|") && !p.startsWith("-")) ?? "";
const bullets = (md = "") => md.split(/\r?\n/).filter((l) => /^\s*[-*] /.test(l)).map((l) => l.replace(/^\s*[-*] /, "").trim());

/** Formula items: each `code` span in the Formulas section, labelled by the nearest preceding **Label:**. */
function parseFormulas(md = "") {
  const [main, ...rest] = md.split(/^### Worked example.*$/m);
  const example = rest.join("\n").trim();
  const items = [];
  for (const para of main.split(/\n\s*\n/)) {
    const label = (para.match(/\*\*([^*]+?):?\*\*/) || [])[1]?.replace(/:$/, "") ?? null;
    const fence = para.match(/```[a-z]*\n([\s\S]*?)```/);
    if (fence) items.push({ label: label ?? "Formula", expr: fence[1].trim() });
    for (const m of para.replace(/```[\s\S]*?```/g, "").matchAll(/`([^`]+)`/g)) {
      items.push({ label: label ?? "Formula", expr: m[1].trim() });
    }
  }
  // Worked example → rows (split on sentence / semicolon boundaries, keep inline markdown).
  const exampleRows = example
    .replace(/\n+/g, " ")
    .replace(/\b(e\.g|i\.e|vs|approx|incl|est)\./g, "$1\u2024")
    .split(/(?<=[.;])\s+(?=[A-Z$(0-9])/)
    .map((r) => r.trim().replace(/[;]$/, ""))
    .filter(Boolean)
    .map((r) => r.replace(/\u2024/g, "."));
  return { items: items.filter((i) => /[=←≤≥<>]/.test(i.expr)).length ? items.filter((i) => /[=←≤≥<>]/.test(i.expr)) : items, notes: main.trim(), exampleRows };
}

/** Inputs from config.defaults + config.validation + content.form.fields (labels/prefix/suffix/options). */
function deriveInputs(config, content) {
  const fields = content?.form?.fields ?? {};
  const validation = config?.validation ?? {};
  return Object.entries(config?.defaults ?? {}).map(([key, def]) => {
    const v = validation[key] ?? {};
    const f = fields[key] ?? {};
    const options = Array.isArray(f.options)
      ? f.options.map((o) => (typeof o === "object" && o ? String(o.label ?? o.value) : String(o)))
      : f.options && typeof f.options === "object"
        ? Object.values(f.options).map(String)
        : null;
    return {
      key,
      label: f.label ?? v.label ?? key,
      type: typeof def === "number" ? "number" : typeof def === "boolean" ? "boolean" : options ? "enum" : typeof def,
      default: def,
      min: v.min ?? null,
      max: v.max ?? null,
      allowZero: v.allowZero ?? null,
      unit: f.prefix ?? f.suffix ?? null,
      options,
      configKey: `defaults.${key}`,
    };
  });
}

const read = (p) => readFileSync(join(repoRoot, p), "utf8");

const entries = {};
for (const [slug, m] of Object.entries(meta.calculators)) {
  const docPath = `docs/calculators/${slug}.md`;
  const contentPath = `packages/calculators/src/content/${slug}.content.json`;
  const configPath = `packages/calculators/src/config/${slug}.config.json`;
  const tests = m.tests.map(({ file, describe }) => {
    const info = testInfo(file);
    if (!(describe in info.counts)) throw new Error(`[tech-registry] ${slug}: describe "${describe}" not found in ${file}`);
    return { file, describe, count: info.counts[describe], titles: info.titles[describe] };
  });
  const docMarkdown = read(docPath);
  const content = JSON.parse(read(contentPath));
  const config = JSON.parse(read(configPath));
  const sections = splitSections(docMarkdown);
  const formulas = parseFormulas(sections["Formulas"]);
  entries[slug] = {
    slug,
    title: m.title,
    component: m.component,
    componentPath: `packages/calculators/src/calculators/${m.component}.tsx`,
    calcModules: m.calcModules,
    rateKeys: m.rateKeys,
    docPath,
    docMarkdown,
    doc: {
      intro: sections["_intro"] ?? "",
      lead: firstParagraph(sections["Purpose"]),
      purpose: sections["Purpose"] ?? "",
      formulas: formulas.items,
      formulaNotes: formulas.notes,
      workedExample: formulas.exampleRows,
      outputs: bullets(sections["Outputs"]),
      outputsNote: (sections["Outputs"] ?? "").split(/\r?\n/).filter((l) => l.trim() && !/^\s*[-*] /.test(l)).join("\n"),
      assumptions: bullets(sections["Assumptions & limitations"]),
      dataSources: sections["Data sources / APIs"] ?? "",
      configVsContent: sections["Config vs content"] ?? "",
      tests: sections["Tests"] ?? "",
    },
    inputs: deriveInputs(config, content),
    contentPath,
    content,
    configPath,
    config,
    tests,
    testCount: tests.reduce((a, t) => a + t.count, 0),
  };
}

mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, JSON.stringify({ generatedFrom: "apps/demo/scripts/gen-tech-registry.mjs", entries }, null, 2) + "\n");
console.log(`[tech-registry] wrote ${Object.keys(entries).length} entries → ${outFile.replace(repoRoot + "/", "")}`);
