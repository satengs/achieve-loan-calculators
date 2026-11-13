import { dtiNeedleDegrees, type DtiBandId } from "../calc/dti";

export type DtiGaugeBandCopy = {
  title: string;
  label: string;
};

export type DtiGaugeProps = {
  /** DTI percent, or null when inputs are invalid. */
  ratio: number | null;
  band: DtiBandId | null;
  goodMax?: number;
  fairMax?: number;
  eyebrow?: string;
  good: DtiGaugeBandCopy;
  fair: DtiGaugeBandCopy;
  high: DtiGaugeBandCopy;
};

const CX = 110;
const CY = 110;
const R = 88;
const STROKE = 18;

/** Arc path from startDeg to endDeg (CSS-style: 0° = right, counterclockwise in SVG is clockwise visually if we sweep).
 * We walk the top semicircle from 180° (left) to 0° (right). */
function arc(startDeg: number, endDeg: number, r = R): string {
  const to = (deg: number) => {
    const rad = (deg * Math.PI) / 180;
    return [CX + r * Math.cos(rad), CY - r * Math.sin(rad)];
  };
  const [x1, y1] = to(startDeg);
  const [x2, y2] = to(endDeg);
  // Travel the TOP semicircle (180° left → 0° right through 90° up).
  // In SVG (y down) that is sweep-flag 0 (counterclockwise).
  const large = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${large} 0 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}

/**
 * Semicircle DTI band gauge for the Achieve results card.
 * Original SVG (stroke arcs); band thresholds match the live Achieve tool (≤35 / 36–43 / ≥44).
 */
export function DtiGauge({
  ratio,
  band,
  goodMax = 35,
  fairMax = 43,
  eyebrow = "Your estimated DTI ratio",
  good,
  fair,
  high,
}: DtiGaugeProps) {
  const scaleMax = 100;
  const goodEnd = (goodMax / scaleMax) * 180; // degrees from the left (180 → 0)
  const fairEnd = (fairMax / scaleMax) * 180;
  // Left is 180°, right is 0°. A band from 0–35% spans 180° → 180-goodEnd.
  const goodStartDeg = 180;
  const goodEndDeg = 180 - goodEnd;
  const fairEndDeg = 180 - fairEnd;
  const highEndDeg = 0;
  const needle = dtiNeedleDegrees(ratio ?? 0, scaleMax);
  const hasValue = ratio != null && Number.isFinite(ratio);
  const needleColor = hasValue ? "var(--lc-primary-dark)" : "var(--lc-border-strong)";

  const bands: Array<{ id: DtiBandId; copy: DtiGaugeBandCopy; pos: "left" | "mid" | "right" }> = [
    { id: "good", copy: good, pos: "left" },
    { id: "fair", copy: fair, pos: "mid" },
    { id: "high", copy: high, pos: "right" },
  ];

  const aria = hasValue
    ? `${eyebrow}: ${ratio!.toFixed(1)} percent, ${
        band === "good" ? good.label : band === "fair" ? fair.label : high.label
      }`
    : `${eyebrow}: enter your numbers to see an estimate`;

  return (
    <div className="lc-dti-gauge" role="img" aria-label={aria}>
      <span className="lc-dti-gauge-eyebrow">{eyebrow}</span>
      <div className="lc-dti-gauge-graphic">
        <svg viewBox="0 0 220 128" width="220" height="128" aria-hidden="true" focusable="false">
          <path d={arc(180, 0)} fill="none" stroke="var(--lc-border)" strokeWidth={STROKE} strokeLinecap="butt" />
          <path d={arc(goodStartDeg, goodEndDeg)} fill="none" stroke="#2A9B6F" strokeWidth={STROKE} strokeLinecap="butt" />
          <path d={arc(goodEndDeg, fairEndDeg)} fill="none" stroke="#E5A93B" strokeWidth={STROKE} strokeLinecap="butt" />
          <path d={arc(fairEndDeg, highEndDeg)} fill="none" stroke="var(--lc-error)" strokeWidth={STROKE} strokeLinecap="butt" />
          <g transform={`translate(${CX} ${CY}) rotate(${needle})`}>
            <polygon points="0,-4 78,0 0,4" fill={needleColor} />
            <circle r="6" fill={needleColor} />
          </g>
        </svg>
      </div>
      <div className="lc-dti-gauge-labels">
        {bands.map((b) => (
          <div
            key={b.id}
            className={`lc-dti-gauge-band lc-dti-gauge-band--${b.pos}${band === b.id ? " is-active" : ""}`}
          >
            <span className="lc-dti-gauge-band-title">{b.copy.title}</span>
            <span className="lc-dti-gauge-band-label">{b.copy.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
