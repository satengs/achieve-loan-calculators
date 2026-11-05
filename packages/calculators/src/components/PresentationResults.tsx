import type { ReactNode } from "react";
import { MicroStats, type MicroStat } from "./MicroStats";
import { TipCallout } from "./TipCallout";

type PresentationResultsProps = {
  /** Mobile sticky bar label/value (compact). */
  stickyLabel: string;
  stickyValue: string;
  /**
   * Sentence headline. Prefer passing a React node so a duration span can be emphasized.
   * Plain string is fine too.
   */
  headline: ReactNode;
  stats?: MicroStat[];
  /** Chart or other visual under the stats. */
  chart?: ReactNode;
  tip?: ReactNode;
  message?: string;
  cta?: ReactNode;
};

/**
 * Soft-tinted results card used by presentation-style calculators:
 * sentence headline → micro-stats → chart → tip callout → optional note/CTA.
 * Keeps the mobile sticky estimate bar.
 */
export function PresentationResults({
  stickyLabel,
  stickyValue,
  headline,
  stats = [],
  chart,
  tip,
  message,
  cta,
}: PresentationResultsProps) {
  return (
    <>
      <div className="lc-estimate-sticky" role="status" aria-live="polite">
        <span className="lc-estimate-sticky-label">{stickyLabel}</span>
        <strong className="lc-estimate-sticky-value">{stickyValue}</strong>
      </div>
      <section className="lc-card lc-results lc-results--presentation" aria-live="polite" aria-atomic="true">
        <h2 className="lc-presentation-headline">{headline}</h2>
        <MicroStats items={stats} />
        {chart}
        <TipCallout>{tip}</TipCallout>
        {message ? <p className="lc-note">{message}</p> : null}
        {cta}
      </section>
    </>
  );
}
