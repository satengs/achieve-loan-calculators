import type { ReactNode } from "react";

type ResultItem = { label: string; value: string };

type ResultsPanelProps = {
  heading: string;
  primaryLabel: string;
  primaryValue: string;
  items?: ResultItem[];
  summary?: ResultItem[];
  message?: string;
  cta?: ReactNode;
};

export function ResultsPanel({
  heading,
  primaryLabel,
  primaryValue,
  items = [],
  summary = [],
  message,
  cta,
}: ResultsPanelProps) {
  return (
    <section className="lc-card lc-results" aria-live="polite" aria-atomic="true">
      <h2>{heading}</h2>
      <div className="lc-result-primary">
        <div className="lc-result-label">{primaryLabel}</div>
        <div className="lc-result-value">{primaryValue}</div>
      </div>
      {items.length > 0 ? (
        <div className="lc-result-grid">
          {items.map((item) => (
            <div className="lc-result-item" key={item.label}>
              <div className="lc-result-label">{item.label}</div>
              <div className="lc-result-value">{item.value}</div>
            </div>
          ))}
        </div>
      ) : null}
      {summary.length > 0 ? (
        <ul className="lc-summary">
          {summary.map((item) => (
            <li key={item.label}>
              <span>{item.label}</span>
              <span>{item.value}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {message ? <p className="lc-note">{message}</p> : null}
      {cta}
    </section>
  );
}
