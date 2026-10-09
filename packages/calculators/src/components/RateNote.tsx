import { interpolate } from "../calc/format";
import type { ResolvedRate } from "../rates/types";
import commonContent from "../content/common.content.json";

type RateNoteProps = {
  rate: ResolvedRate;
  /** What the rate is, e.g. "30-year fixed mortgage average". */
  subject: string;
  /** Optional text describing a transform, e.g. "+ 1.00% illustrative margin". */
  adjustment?: string;
  /** True when no live source exists for this rate at all (vs. a failed fetch). */
  noLiveSource?: boolean;
};

/** Plain-text provenance line under a rate input: live source + as-of, or visible fallback note. */
export function RateNote({ rate, subject, adjustment, noLiveSource }: RateNoteProps) {
  const copy = commonContent.rateNote;
  if (noLiveSource) {
    return (
      <p className="lc-rate-note lc-rate-note-fallback" data-rate-source="config">
        {interpolate(copy.noSource, { subject })}
      </p>
    );
  }
  if (rate.isFallback || !rate.info) {
    return (
      <p className="lc-rate-note lc-rate-note-fallback" data-rate-source="fallback">
        {interpolate(copy.fallback, { subject })}
      </p>
    );
  }
  return (
    <p className="lc-rate-note" data-rate-source="live">
      {interpolate(copy.live, {
        subject,
        source: rate.info.source,
        asOf: rate.info.asOf,
        value: rate.info.value.toFixed(2),
        adjustment: adjustment ? ` ${adjustment}` : "",
      })}{" "}
      <a href={rate.info.sourceUrl} target="_blank" rel="noopener noreferrer">
        {copy.linkLabel}
      </a>
    </p>
  );
}
