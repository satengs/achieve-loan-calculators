import type { ReactNode } from "react";
import { PresentationResults } from "./PresentationResults";
import type { MicroStat } from "./MicroStats";

type ResultItem = {
  label: string;
  value: string;
  /** "negative" renders the value as a cost/loss (error colour), never as a saving. */
  tone?: "negative";
  /** Optional short explanation under the value (text only). */
  note?: string;
};

type ResultsPanelProps = {
  heading: string;
  primaryLabel: string;
  primaryValue: string;
  items?: ResultItem[];
  summary?: ResultItem[];
  message?: string;
  cta?: ReactNode;
  /**
   * `presentation` uses the sentence-headline card (Achieve).
   * Default keeps the original labelled layout (FDR / bills).
   */
  variant?: "default" | "presentation";
  /** Override the auto-generated "Your estimated {label} is {value}" headline. */
  headline?: ReactNode;
  chart?: ReactNode;
  tip?: ReactNode;
  stats?: MicroStat[];
};

/** Strip "estimated" / "est." / "your estimated" so we don't write "Your estimated estimated …". */
export function resultNoun(label: string): string {
  const cleaned = label
    .replace(/^(your\s+)?(estimated|est\.?)\s+/i, "")
    .replace(/:$/, "")
    .trim();
  if (!cleaned) return "result";
  return cleaned[0].toLowerCase() + cleaned.slice(1);
}

function defaultHeadline(primaryLabel: string, primaryValue: string): ReactNode {
  return (
    <>
      Your estimated {resultNoun(primaryLabel)} is <span className="lc-headline-em">{primaryValue}</span>
    </>
  );
}

function SummaryList({ items }: { items: ResultItem[] }) {
  if (!items.length) return null;
  return (
    <ul className="lc-summary">
      {items.map((item) => (
        <li key={item.label}>
          <span>{item.label}</span>
          <span>{item.value}</span>
        </li>
      ))}
    </ul>
  );
}

export function ResultsPanel({
  heading,
  primaryLabel,
  primaryValue,
  items = [],
  summary = [],
  message,
  cta,
  variant = "default",
  headline,
  chart,
  tip,
  stats,
}: ResultsPanelProps) {
  if (variant === "presentation") {
    const micro: MicroStat[] =
      stats ??
      items.map((item) => ({
        label: item.label,
        value: item.value,
        accent: item.tone === "negative" ? "negative" : "primary",
      }));
    return (
      <PresentationResults
        stickyLabel={primaryLabel}
        stickyValue={primaryValue}
        headline={headline ?? defaultHeadline(primaryLabel, primaryValue)}
        stats={micro}
        chart={chart}
        tip={tip}
        footer={<SummaryList items={summary} />}
        message={message}
        cta={cta}
      />
    );
  }

  return (
    <>
      <div className="lc-estimate-sticky" role="status" aria-live="polite">
        <span className="lc-estimate-sticky-label">{primaryLabel}</span>
        <strong className="lc-estimate-sticky-value">{primaryValue}</strong>
      </div>
      <section className="lc-card lc-results" aria-live="polite" aria-atomic="true">
        <h2>{heading}</h2>
        <div className="lc-result-primary">
          <div className="lc-result-label">{primaryLabel}</div>
          <div className="lc-result-value">{primaryValue}</div>
        </div>
        {items.length > 0 ? (
          <div className="lc-result-grid">
            {items.map((item) => (
              <div className={item.tone === "negative" ? "lc-result-item lc-result-item--negative" : "lc-result-item"} key={item.label}>
                <div className="lc-result-label">{item.label}</div>
                <div className="lc-result-value">{item.value}</div>
                {item.note ? <div className="lc-result-item-note">{item.note}</div> : null}
              </div>
            ))}
          </div>
        ) : null}
        {chart}
        <SummaryList items={summary} />
        {message ? <p className="lc-note">{message}</p> : null}
        {cta}
      </section>
    </>
  );
}
