"use client";

import { Fragment, useEffect, useMemo, useState, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { BRAND_TOKENS, tokensToCssVars } from "@loan-calculators/core";
import { DEMO_CONFIG } from "@/config/demo.config";
import { BRAND_OPTIONS } from "@/lib/brand";
import { contrastVsWhite, isColor } from "@/lib/contrast";
import type { TechEntry, TechRateRow } from "@/lib/tech";
import { useBrand } from "./BrandProvider";

const gh = (path: string) => `${DEMO_CONFIG.githubRepo}/blob/${DEMO_CONFIG.githubBranch}/${path}`;
const fileName = (path: string) => path.split("/").pop() ?? path;

const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "how", label: "How it works" },
  { id: "formulas", label: "Formulas" },
  { id: "io", label: "Inputs & outputs" },
  { id: "data", label: "Live data" },
  { id: "content", label: "Content JSON" },
  { id: "config", label: "Config JSON" },
  { id: "tokens", label: "Brand tokens" },
  { id: "code", label: "Code & tests" },
] as const;

const sid = (id: string) => `tech-${id}`;

/* ───────────────────────── primitives ───────────────────────── */

/** Markdown → React elements. Raw HTML is skipped (no injection). `inline` drops the wrapping <p>. */
function Md({ children, inline = false }: { children: string; inline?: boolean }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      skipHtml
      components={inline ? { p: ({ children: c }) => <>{c}</> } : undefined}
    >
      {children}
    </ReactMarkdown>
  );
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  return (
    <>
      <button
        type="button"
        className="lc-tt-btn"
        aria-label={`Copy ${label}`}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(text);
            setState("copied");
          } catch {
            setState("failed");
          }
          window.setTimeout(() => setState("idle"), 1800);
        }}
      >
        {state === "copied" ? "✓ Copied" : state === "failed" ? "Copy failed" : "Copy"}
      </button>
      <span className="lc-sr-only" role="status" aria-live="polite">
        {state === "copied" ? `${label} copied to clipboard` : state === "failed" ? "Copy failed" : ""}
      </span>
    </>
  );
}

function DownloadButton({ text, name }: { text: string; name: string }) {
  return (
    <button
      type="button"
      className="lc-tt-btn lc-tt-btn-ghost"
      aria-label={`Download ${name}`}
      onClick={() => {
        const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
        const a = document.createElement("a");
        a.href = url;
        a.download = name;
        a.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      }}
    >
      Download
    </button>
  );
}

/** Tiny JSON tokenizer (pretty-printed JSON keeps every string on one line). */
const JSON_TOKEN = /("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false|null)\b|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|([{}[\],])/g;

function highlightJsonLine(line: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let i = 0;
  for (const m of line.matchAll(JSON_TOKEN)) {
    const idx = m.index ?? 0;
    if (idx > last) out.push(line.slice(last, idx));
    if (m[1] !== undefined) {
      out.push(
        <span key={i++} className={m[2] ? "lc-j-key" : "lc-j-str"}>
          {m[1]}
        </span>,
      );
      if (m[2]) out.push(<span key={i++} className="lc-j-punc">{m[2]}</span>);
    } else if (m[3] !== undefined) out.push(<span key={i++} className="lc-j-lit">{m[3]}</span>);
    else if (m[4] !== undefined) out.push(<span key={i++} className="lc-j-num">{m[4]}</span>);
    else out.push(<span key={i++} className="lc-j-punc">{m[5]}</span>);
    last = idx + m[0].length;
  }
  if (last < line.length) out.push(line.slice(last));
  return out;
}

const COLLAPSE_AFTER = 40;

function JsonViewer({ value, path, title }: { value: unknown; path: string; title: string }) {
  const text = useMemo(() => JSON.stringify(value, null, 2), [value]);
  const lines = useMemo(() => text.split("\n"), [text]);
  const long = lines.length > COLLAPSE_AFTER;
  const [expanded, setExpanded] = useState(!long);
  const shown = expanded ? lines : lines.slice(0, COLLAPSE_AFTER);
  const topKeys = value && typeof value === "object" ? Object.keys(value as object) : [];

  return (
    <div className="lc-tt-code">
      <div className="lc-tt-code-head">
        <div className="lc-tt-code-meta">
          <span className="lc-tt-code-title">{title}</span>
          <a href={gh(path)} target="_blank" rel="noreferrer" className="lc-tt-path">
            {path}
            <span className="lc-sr-only"> (opens GitHub in a new tab)</span>
          </a>
        </div>
        <div className="lc-tt-code-actions">
          <CopyButton text={text} label={fileName(path)} />
          <DownloadButton text={text} name={fileName(path)} />
        </div>
      </div>
      {topKeys.length ? (
        <p className="lc-tt-code-keys">
          <span>{lines.length} lines · top-level keys:</span>{" "}
          {topKeys.map((k) => (
            <code key={k}>{k}</code>
          ))}
        </p>
      ) : null}
      <div className="lc-tt-pre" tabIndex={0} role="region" aria-label={`${fileName(path)} source`}>
        <table className="lc-tt-lines">
          <tbody>
            {shown.map((line, n) => (
              <tr key={n}>
                <td className="lc-tt-ln" aria-hidden="true">{n + 1}</td>
                <td className="lc-tt-lc">
                  <code>{highlightJsonLine(line)}</code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {long ? (
        <button type="button" className="lc-tt-more" aria-expanded={expanded} onClick={() => setExpanded((v) => !v)}>
          {expanded ? "Collapse" : `Show all ${lines.length} lines`}
        </button>
      ) : null}
    </div>
  );
}

function Section({ id, title, kicker, children }: { id: string; title: string; kicker?: string; children: ReactNode }) {
  return (
    <section className="lc-tt-section" id={sid(id)} aria-labelledby={`${sid(id)}-h`}>
      <h2 id={`${sid(id)}-h`}>
        {title}
        {kicker ? <span className="lc-tt-kicker">{kicker}</span> : null}
      </h2>
      {children}
    </section>
  );
}

function Badge({ tone, children }: { tone: "live" | "fallback" | "neutral"; children: ReactNode }) {
  return <span className={`lc-tt-badge lc-tt-badge-${tone}`}>{children}</span>;
}

function fmt(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "number") return v.toLocaleString("en-US");
  return String(v);
}

/* ───────────────────────── navigation ───────────────────────── */

function SectionNav() {
  const [active, setActive] = useState<string>(SECTIONS[0].id);

  useEffect(() => {
    const els = SECTIONS.map((s) => document.getElementById(sid(s.id))).filter(Boolean) as HTMLElement[];
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id.replace(/^tech-/, ""));
      },
      { rootMargin: "-120px 0px -60% 0px", threshold: 0 },
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    // keep the active chip visible in the mobile horizontal scroller
    document.querySelector(`.lc-tt-nav a[data-id="${active}"]`)?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [active]);

  return (
    <nav className="lc-tt-nav" aria-label="Technical details sections">
      <p className="lc-tt-nav-title">On this page</p>
      <ol>
        {SECTIONS.map((s) => (
          <li key={s.id}>
            <a
              href={`#${sid(s.id)}`}
              data-id={s.id}
              aria-current={active === s.id ? "location" : undefined}
              className={active === s.id ? "is-active" : undefined}
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById(sid(s.id));
                el?.scrollIntoView({ behavior: "smooth", block: "start" });
                el?.querySelector("h2")?.setAttribute("tabindex", "-1");
                (el?.querySelector("h2") as HTMLElement | null)?.focus({ preventScroll: true });
                setActive(s.id);
              }}
            >
              {s.label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

/* ───────────────────────── panel ───────────────────────── */

export function TechnicalDetails({ tech, rateRows }: { tech: TechEntry; rateRows: TechRateRow[] }) {
  const { brand } = useBrand();
  const tokens = BRAND_TOKENS[brand];
  const cssVars = tokensToCssVars(tokens);
  const brandLabel = BRAND_OPTIONS.find((b) => b.value === brand)?.label ?? brand;
  const importSnippet = `import { ${tech.component} } from "@loan-calculators/core";\nimport "@loan-calculators/core/styles.css";\n\nexport default function Page() {\n  return <${tech.component} projectName="${brand}" />;\n}`;
  const { doc } = tech;

  const formulaGroups = useMemo(() => {
    const groups: Array<{ label: string; exprs: string[] }> = [];
    for (const f of doc.formulas) {
      const g = groups.find((x) => x.label === f.label);
      if (g) g.exprs.push(f.expr);
      else groups.push({ label: f.label, exprs: [f.expr] });
    }
    return groups;
  }, [doc.formulas]);

  const colorVars = Object.entries(cssVars).filter(([, v]) => isColor(v));
  const otherVars = Object.entries(cssVars).filter(([, v]) => !isColor(v));
  const liveCount = rateRows.filter((r) => r.status === "live").length;

  return (
    <div className="lc-root lc-tt">
      <div className="lc-tt-shell">
        <header className="lc-tt-header">
          <span className="lc-tt-review-badge">For demo review — not shown to end users</span>
          <h1>{tech.title} calculator</h1>
          <p className="lc-tt-sub">Technical details for PM, architecture and UI review. Generated at build time from the repo.</p>
        </header>

        <div className="lc-tt-layout">
          <SectionNav />

          <div className="lc-tt-main">
            {/* 1 · Overview */}
            <Section id="overview" title="Overview">
              <ul className="lc-tt-overview">
                <li>
                  <span className="lc-tt-ov-label">Component</span>
                  <code className="lc-tt-ov-value">{tech.component}</code>
                  <span className="lc-tt-ov-foot">@loan-calculators/core</span>
                </li>
                <li>
                  <span className="lc-tt-ov-label">Inputs / outputs</span>
                  <span className="lc-tt-ov-value">
                    {tech.inputs.length} <small>in</small> · {doc.outputs.length} <small>out</small>
                  </span>
                  <span className="lc-tt-ov-foot">from config + doc</span>
                </li>
                <li className="lc-tt-ov-wide">
                  <span className="lc-tt-ov-label">Data sources</span>
                  {rateRows.length ? (
                    <span className="lc-tt-ov-badges">
                      {rateRows.map((r) => (
                        <Badge key={r.key} tone={r.status === "live" ? "live" : "fallback"}>
                          {r.seriesId} {r.status === "live" ? `· ${r.asOf}` : "· fallback"}
                        </Badge>
                      ))}
                    </span>
                  ) : (
                    <span className="lc-tt-ov-value lc-tt-ov-text">Config defaults</span>
                  )}
                  <span className="lc-tt-ov-foot">
                    {rateRows.length ? `${liveCount}/${rateRows.length} live (FRED)` : "no live series"}
                  </span>
                </li>
                <li>
                  <span className="lc-tt-ov-label">Unit tests</span>
                  <span className="lc-tt-ov-value">{tech.testCount}</span>
                  <span className="lc-tt-ov-foot">{tech.tests.length} describe blocks</span>
                </li>
                <li>
                  <span className="lc-tt-ov-label">Brand</span>
                  <span className="lc-tt-ov-value lc-tt-ov-brand">
                    <span className="lc-tt-dot" style={{ background: tokens.primary }} aria-hidden="true" />
                    <span className="lc-tt-dot" style={{ background: tokens.cta ?? tokens.primary }} aria-hidden="true" />
                    {brandLabel}
                  </span>
                  <span className="lc-tt-ov-foot">switch in the top bar</span>
                </li>
              </ul>
            </Section>

            {/* 2 · How it works */}
            <Section id="how" title="How it works">
              <div className="lc-tt-prose lc-tt-lead">
                <Md>{doc.lead}</Md>
              </div>
              {doc.assumptions.length ? (
                <aside className="lc-tt-callout" aria-label="Assumptions and limitations">
                  <p className="lc-tt-callout-title">Assumptions & limits</p>
                  <ul>
                    {doc.assumptions.map((a, i) => (
                      <li key={i}>
                        <Md inline>{a}</Md>
                      </li>
                    ))}
                  </ul>
                </aside>
              ) : null}
              <div className="lc-tt-split">
                <details className="lc-tt-disclosure">
                  <summary>Data sources / APIs</summary>
                  <div className="lc-tt-prose"><Md>{doc.dataSources}</Md></div>
                </details>
                <details className="lc-tt-disclosure">
                  <summary>Config vs content</summary>
                  <div className="lc-tt-prose"><Md>{doc.configVsContent}</Md></div>
                </details>
                <details className="lc-tt-disclosure">
                  <summary>Full design doc</summary>
                  <div className="lc-tt-prose">
                    <p>
                      Source: <a href={gh(tech.docPath)} target="_blank" rel="noreferrer">{tech.docPath}</a>
                    </p>
                    <Md>{tech.docMarkdown}</Md>
                  </div>
                </details>
              </div>
            </Section>

            {/* 3 · Formulas */}
            <Section id="formulas" title="Formulas">
              {formulaGroups.length ? (
                <div className="lc-tt-formulas">
                  {formulaGroups.map((g) => (
                    <figure key={g.label} className="lc-tt-formula">
                      <figcaption>{g.label}</figcaption>
                      {g.exprs.map((e, i) => (
                        <code key={i}>{e}</code>
                      ))}
                    </figure>
                  ))}
                </div>
              ) : null}
              <details className="lc-tt-disclosure" open={!formulaGroups.length}>
                <summary>Formula notes</summary>
                <div className="lc-tt-prose"><Md>{doc.formulaNotes}</Md></div>
              </details>
              {doc.workedExample.length ? (
                <>
                  <h3 className="lc-tt-h3">Worked example (defaults)</h3>
                  <table className="lc-tt-table lc-tt-example">
                    <thead>
                      <tr>
                        <th scope="col">#</th>
                        <th scope="col">Step</th>
                      </tr>
                    </thead>
                    <tbody>
                      {doc.workedExample.map((row, i) => (
                        <tr key={i}>
                          <td className="lc-tt-num">{i + 1}</td>
                          <td><Md inline>{row}</Md></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              ) : null}
            </Section>

            {/* 4 · Inputs & outputs */}
            <Section id="io" title="Inputs & outputs" kicker={`${tech.inputs.length} inputs`}>
              <div className="lc-tt-scroll">
                <table className="lc-tt-table lc-tt-stack">
                  <thead>
                    <tr>
                      <th scope="col">Input</th>
                      <th scope="col">Type</th>
                      <th scope="col">Default</th>
                      <th scope="col">Min – max</th>
                      <th scope="col">Config key</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tech.inputs.map((inp) => (
                      <tr key={inp.key}>
                        <th scope="row" data-label="Input">
                          <span className="lc-tt-in-label">{inp.label}</span>
                          <code>{inp.key}</code>
                        </th>
                        <td data-label="Type">
                          <span>
                            {inp.type}
                            {inp.options ? <span className="lc-tt-opts">{inp.options.join(" · ")}</span> : null}
                          </span>
                        </td>
                        <td data-label="Default">
                          <span>
                            {inp.unit === "$" ? "$" : ""}
                            {fmt(inp.default)}
                            {inp.unit && inp.unit !== "$" ? ` ${inp.unit}` : ""}
                          </span>
                        </td>
                        <td data-label="Min – max">
                          {inp.min !== null || inp.max !== null ? `${fmt(inp.min)} – ${fmt(inp.max)}` : "—"}
                        </td>
                        <td data-label="Config key"><code>{inp.configKey}</code></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <h3 className="lc-tt-h3">Outputs</h3>
              <ul className="lc-tt-outputs">
                {doc.outputs.map((o, i) => (
                  <li key={i}><Md inline>{o}</Md></li>
                ))}
              </ul>
            </Section>

            {/* 5 · Live data */}
            <Section id="data" title="Live data">
              {rateRows.length === 0 ? (
                <p className="lc-tt-empty">
                  No live rate series — this calculator uses illustrative defaults and estimate tables from its config file.
                </p>
              ) : (
                <table className="lc-tt-table lc-tt-stack">
                  <thead>
                    <tr>
                      <th scope="col">Series</th>
                      <th scope="col">Status</th>
                      <th scope="col">Value</th>
                      <th scope="col">As of</th>
                      <th scope="col">Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rateRows.map((r) => (
                      <tr key={r.key}>
                        <th scope="row" data-label="Series">
                          <code>{r.seriesId}</code>
                          <span className="lc-tt-in-label lc-tt-muted">{r.key}</span>
                        </th>
                        <td data-label="Status">
                          <span>
                            <Badge tone={r.status === "live" ? "live" : "fallback"}>
                              {r.status === "live" ? "Live" : "Fallback"}
                            </Badge>
                          </span>
                        </td>
                        <td data-label="Value" className="lc-tt-num">{r.value !== undefined ? `${r.value}%` : "config default"}</td>
                        <td data-label="As of">{r.asOf ?? "—"}</td>
                        <td data-label="Source">
                          <span>
                            <a href={r.sourceUrl} target="_blank" rel="noreferrer">
                              FRED {r.seriesId}
                              <span className="lc-sr-only"> (opens in a new tab)</span>
                            </a>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <p className="lc-tt-note">
                Fetched server-side from FRED, cached 24h (ISR). On failure the calculator falls back to its config default and
                says so. Full payload: <a href="/api/rates" target="_blank" rel="noreferrer">/api/rates</a>
              </p>
            </Section>

            {/* 6 · Content JSON */}
            <Section id="content" title="Content JSON" kicker="copy & labels (CMS-ready)">
              <JsonViewer value={tech.content} path={tech.contentPath} title={fileName(tech.contentPath)} />
            </Section>

            {/* 7 · Config JSON */}
            <Section id="config" title="Config JSON" kicker="defaults, validation, features">
              <JsonViewer value={tech.config} path={tech.configPath} title={fileName(tech.configPath)} />
            </Section>

            {/* 8 · Brand tokens */}
            <Section id="tokens" title="Brand tokens" kicker={brandLabel}>
              <p className="lc-tt-note">
                <code>BRAND_TOKENS.{brand}</code> → CSS variables via <code>BrandTheme</code>. Contrast is measured against white
                (translucent colors blended over white); 4.5:1 is the text minimum, 3:1 for UI fills.
              </p>
              <ul className="lc-tt-swatches">
                {colorVars.map(([k, v]) => {
                  const ratio = contrastVsWhite(v);
                  return (
                    <li key={k}>
                      <span className="lc-tt-swatch" style={{ background: v }} aria-hidden="true" />
                      <span className="lc-tt-sw-body">
                        <code className="lc-tt-sw-name">{k}</code>
                        <span className="lc-tt-sw-val">{v}</span>
                        {ratio !== null ? (
                          <span className={ratio >= 4.5 ? "lc-tt-ratio ok" : ratio >= 3 ? "lc-tt-ratio ui" : "lc-tt-ratio low"}>
                            {ratio.toFixed(2)}:1 {ratio >= 4.5 ? "AA text" : ratio >= 3 ? "UI only" : "decorative"}
                          </span>
                        ) : null}
                      </span>
                    </li>
                  );
                })}
              </ul>
              <dl className="lc-tt-dl">
                {otherVars.map(([k, v]) => (
                  <Fragment key={k}>
                    <dt><code>{k}</code></dt>
                    <dd><code>{v}</code></dd>
                  </Fragment>
                ))}
              </dl>
            </Section>

            {/* 9 · Code & tests */}
            <Section id="code" title="Code & tests">
              <div className="lc-tt-code lc-tt-snippet">
                <div className="lc-tt-code-head">
                  <div className="lc-tt-code-meta">
                    <span className="lc-tt-code-title">Usage</span>
                  </div>
                  <div className="lc-tt-code-actions">
                    <CopyButton text={importSnippet} label="import snippet" />
                  </div>
                </div>
                <pre className="lc-tt-pre lc-tt-pre-plain" tabIndex={0}>
                  <code>{importSnippet}</code>
                </pre>
              </div>

              <h3 className="lc-tt-h3">Source files</h3>
              <ul className="lc-tt-files">
                {[
                  { kind: "Component", path: tech.componentPath },
                  ...tech.calcModules.map((m) => ({ kind: "Calc module", path: m })),
                  { kind: "Content", path: tech.contentPath },
                  { kind: "Config", path: tech.configPath },
                  { kind: "Design doc", path: tech.docPath },
                ].map((f) => (
                  <li key={f.kind + f.path}>
                    <span className="lc-tt-file-kind">{f.kind}</span>
                    <a href={gh(f.path)} target="_blank" rel="noreferrer">
                      {f.path}
                      <span className="lc-sr-only"> (opens GitHub in a new tab)</span>
                    </a>
                  </li>
                ))}
              </ul>

              <h3 className="lc-tt-h3">
                Tests <span className="lc-tt-kicker">{tech.testCount} total</span>
              </h3>
              <div className="lc-tt-tests">
                {tech.tests.map((t) => (
                  <details key={t.file + t.describe} className="lc-tt-disclosure">
                    <summary>
                      <code>{t.describe}</code>
                      <span className="lc-tt-muted">
                        {fileName(t.file)} · {t.count} {t.count === 1 ? "test" : "tests"}
                      </span>
                    </summary>
                    <ul className="lc-tt-test-list">
                      {t.titles.map((title) => (
                        <li key={title}>✓ {title}</li>
                      ))}
                    </ul>
                    <a href={gh(t.file)} target="_blank" rel="noreferrer">Open {fileName(t.file)} on GitHub</a>
                  </details>
                ))}
              </div>
            </Section>
          </div>
        </div>
      </div>
    </div>
  );
}
