"use client";

import { useState, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { BRAND_TOKENS, tokensToCssVars } from "@loan-calculators/core";
import { DEMO_CONFIG } from "@/config/demo.config";
import type { TechEntry, TechRateRow } from "@/lib/tech";
import { useBrand } from "./BrandProvider";

const gh = (path: string) =>
  `${DEMO_CONFIG.githubRepo}/blob/${DEMO_CONFIG.githubBranch}/${path}`;

function CopyButton({ text }: { text: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  return (
    <button
      type="button"
      className="lc-tech-copy"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setState("copied");
        } catch {
          setState("failed");
        }
        setTimeout(() => setState("idle"), 1600);
      }}
    >
      {state === "copied" ? "Copied" : state === "failed" ? "Copy failed" : "Copy"}
    </button>
  );
}

function CodeBlock({
  title,
  path,
  code,
  defaultOpen = false,
}: {
  title: string;
  path?: string;
  code: string;
  defaultOpen?: boolean;
}) {
  return (
    <details className="lc-tech-code" open={defaultOpen}>
      <summary>
        <span className="lc-tech-code-title">{title}</span>
        {path ? <code className="lc-tech-path">{path}</code> : null}
      </summary>
      <div className="lc-tech-code-body">
        <div className="lc-tech-code-actions">
          {path ? (
            <a href={gh(path)} target="_blank" rel="noreferrer">
              View on GitHub
            </a>
          ) : null}
          <CopyButton text={code} />
        </div>
        <pre tabIndex={0}>
          <code>{code}</code>
        </pre>
      </div>
    </details>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section className="lc-card lc-tech-section" aria-labelledby={id}>
      <h2 id={id}>{title}</h2>
      {children}
    </section>
  );
}

/**
 * Read-only review panel. All strings render as React text; markdown goes through
 * react-markdown with raw HTML skipped (no dangerouslySetInnerHTML anywhere).
 */
export function TechnicalDetails({ tech, rateRows }: { tech: TechEntry; rateRows: TechRateRow[] }) {
  const { brand } = useBrand();
  const tokens = BRAND_TOKENS[brand];
  const cssVars = tokensToCssVars(tokens);
  const importSnippet = `import { ${tech.component} } from "@loan-calculators/core";\nimport "@loan-calculators/core/styles.css";\n\n<${tech.component} projectName="${brand}" />`;

  return (
    <div className="lc-root lc-tech">
      <div className="lc-page">
        <header className="lc-header">
          <span className="lc-eyebrow">For demo review — not shown to end users</span>
          <h1>{tech.title}: technical details</h1>
          <p>
            How this calculator is implemented, the content and config files it reads, live data it uses, and the
            active brand tokens. Generated at build time from the repo, so it stays in sync with the docs.
          </p>
        </header>

        <Section id="tech-how" title="1. How it works">
          <p className="lc-note">
            Rendered from <a href={gh(tech.docPath)} target="_blank" rel="noreferrer"><code>{tech.docPath}</code></a>
          </p>
          <div className="lc-tech-md">
            <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml>
              {tech.docMarkdown}
            </ReactMarkdown>
          </div>
        </Section>

        <Section id="tech-content" title="2. Content file">
          <CodeBlock title="Content JSON (copy / labels)" path={tech.contentPath} code={JSON.stringify(tech.content, null, 2)} />
        </Section>

        <Section id="tech-config" title="3. Config file">
          <CodeBlock title="Config JSON (defaults / validation / features)" path={tech.configPath} code={JSON.stringify(tech.config, null, 2)} />
        </Section>

        <Section id="tech-data" title="4. Live data">
          {rateRows.length === 0 ? (
            <p className="lc-note">
              No live rate series. This calculator uses illustrative defaults and estimate tables from its config file.
            </p>
          ) : (
            <div className="lc-table-wrap">
              <table className="lc-table">
                <thead>
                  <tr>
                    <th scope="col">Key</th>
                    <th scope="col">Series</th>
                    <th scope="col">Value</th>
                    <th scope="col">As of</th>
                    <th scope="col">Status</th>
                    <th scope="col">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {rateRows.map((r) => (
                    <tr key={r.key}>
                      <th scope="row"><code>{r.key}</code></th>
                      <td><code>{r.seriesId}</code></td>
                      <td>{r.value !== undefined ? `${r.value}%` : "—"}</td>
                      <td>{r.asOf ?? "—"}</td>
                      <td>
                        <span className={r.status === "live" ? "lc-tech-badge lc-tech-badge-live" : "lc-tech-badge lc-tech-badge-fallback"}>
                          {r.status === "live" ? "Live" : "Fallback (config default)"}
                        </span>
                      </td>
                      <td>
                        <a href={r.sourceUrl} target="_blank" rel="noreferrer">FRED</a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="lc-note">
            Fetched server-side from FRED with daily ISR (24h). Full payload: <a href="/api/rates" target="_blank" rel="noreferrer"><code>/api/rates</code></a>.
          </p>
        </Section>

        <Section id="tech-brand" title={`5. Brand tokens (${brand})`}>
          <p className="lc-note">
            Resolved from <code>BRAND_TOKENS.{brand}</code> in{" "}
            <a href={gh("packages/calculators/src/brand/tokens.ts")} target="_blank" rel="noreferrer"><code>packages/calculators/src/brand/tokens.ts</code></a>{" "}
            and applied as CSS variables by <code>BrandTheme</code>. Switch brand in the top bar to compare.
          </p>
          <div className="lc-table-wrap">
            <table className="lc-table lc-tech-tokens">
              <thead>
                <tr>
                  <th scope="col">CSS variable</th>
                  <th scope="col">Value</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(cssVars).map(([k, v]) => (
                  <tr key={k}>
                    <th scope="row"><code>{k}</code></th>
                    <td>
                      {/^#|^rgba?\(/.test(v) ? <span className="lc-tech-swatch" style={{ background: v }} aria-hidden="true" /> : null}
                      <code>{v}</code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section id="tech-arch" title="6. Architecture">
          <ul className="lc-summary">
            <li><span>Package component</span><a href={gh(tech.componentPath)} target="_blank" rel="noreferrer"><code>{tech.component}</code></a></li>
            {tech.calcModules.map((m) => (
              <li key={m}><span>Calc module</span><a href={gh(m)} target="_blank" rel="noreferrer"><code>{m.split("/").pop()}</code></a></li>
            ))}
            {tech.tests.map((t) => (
              <li key={`${t.file}:${t.describe}`}>
                <span>Tests: <code>{t.describe}</code></span>
                <a href={gh(t.file)} target="_blank" rel="noreferrer"><code>{t.file.split("/").pop()}</code> ({t.count})</a>
              </li>
            ))}
            <li><span>Total unit tests covering this calculator</span><strong>{tech.testCount}</strong></li>
          </ul>
          <CodeBlock title="Usage" code={importSnippet} defaultOpen />
        </Section>
      </div>
    </div>
  );
}
