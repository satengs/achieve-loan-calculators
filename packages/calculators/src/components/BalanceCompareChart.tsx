import type { BalancePoint } from "../calc/snowball";

const W = 400;
const H = 168;
const PL = 44;
const PR = 10;
const PT = 12;
const PB = 28;

export type BalanceCompareChartProps = {
  snowball: BalancePoint[];
  avalanche: BalancePoint[];
  snowballLabel?: string;
  avalancheLabel?: string;
  ariaLabel?: string;
  /** Which series to emphasize; the other is drawn at lower opacity. */
  emphasize?: "both" | "snowball" | "avalanche";
  formatMoney?: (n: number) => string;
};

function points(series: BalancePoint[], maxMonth: number, maxBal: number): string {
  const innerW = W - PL - PR;
  const innerH = H - PT - PB;
  return series
    .map((p) => {
      const x = PL + (maxMonth === 0 ? 0 : (p.month / maxMonth) * innerW);
      const y = PT + (maxBal === 0 ? innerH : (1 - p.total / maxBal) * innerH);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

/**
 * Two-series line chart of remaining total balance vs month.
 * Original SVG (no chart library). First/last x labels and a $0 / max y label.
 */
export function BalanceCompareChart({
  snowball,
  avalanche,
  snowballLabel = "Snowball",
  avalancheLabel = "Avalanche",
  ariaLabel = "Remaining total balance over time for snowball and avalanche",
  emphasize = "both",
  formatMoney = (n) => `$${Math.round(n).toLocaleString("en-US")}`,
}: BalanceCompareChartProps) {
  if (!snowball.length && !avalanche.length) return null;
  const all = [...snowball, ...avalanche];
  const maxMonth = Math.max(...all.map((p) => p.month), 1);
  const maxBal = Math.max(...all.map((p) => p.total), 1);
  const sPts = points(snowball, maxMonth, maxBal);
  const aPts = points(avalanche, maxMonth, maxBal);
  const innerW = W - PL - PR;
  const innerH = H - PT - PB;
  const xEnd = PL + innerW;
  const yBase = PT + innerH;
  const sOp = emphasize === "avalanche" ? 0.35 : 1;
  const aOp = emphasize === "snowball" ? 0.35 : 1;

  return (
    <div className="lc-balance-chart" role="img" aria-label={ariaLabel}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        <line className="lc-balance-chart-axis" x1={PL} y1={yBase} x2={xEnd} y2={yBase} />
        <line className="lc-balance-chart-axis" x1={PL} y1={PT} x2={PL} y2={yBase} />
        {sPts ? (
          <polyline
            className="lc-balance-chart-line lc-balance-chart-line--snowball"
            points={sPts}
            style={{ opacity: sOp }}
          />
        ) : null}
        {aPts ? (
          <polyline
            className="lc-balance-chart-line lc-balance-chart-line--avalanche"
            points={aPts}
            style={{ opacity: aOp }}
          />
        ) : null}
        <text className="lc-balance-chart-label" x={PL} y={H - 8} textAnchor="start">
          Mo 0
        </text>
        <text className="lc-balance-chart-label" x={xEnd} y={H - 8} textAnchor="end">
          {`Mo ${maxMonth}`}
        </text>
        <text className="lc-balance-chart-label" x={PL - 6} y={PT + 4} textAnchor="end">
          {formatMoney(maxBal)}
        </text>
        <text className="lc-balance-chart-label" x={PL - 6} y={yBase} textAnchor="end">
          $0
        </text>
      </svg>
      <ul className="lc-balance-chart-legend">
        <li className="lc-balance-chart-legend--snowball">{snowballLabel}</li>
        <li className="lc-balance-chart-legend--avalanche">{avalancheLabel}</li>
      </ul>
    </div>
  );
}
