export type DepletionBar = { age: number; balance: number };

/**
 * Simple vertical bar chart of balance-by-age for spend-down calculators.
 * Heights are relative to the max balance in the series (CSS only, no chart lib).
 */
export function DepletionChart({
  bars,
  ariaLabel = "Savings balance by age",
}: {
  bars: DepletionBar[];
  ariaLabel?: string;
}) {
  if (!bars.length) return null;
  const max = Math.max(...bars.map((b) => b.balance), 1);
  // Cap label count so the axis stays readable (~12 ticks).
  const labelEvery = Math.max(1, Math.ceil(bars.length / 12));
  return (
    <div className="lc-depletion" role="img" aria-label={ariaLabel}>
      <div className="lc-depletion-bars">
        {bars.map((b, i) => {
          const h = Math.max(2, Math.round((b.balance / max) * 100));
          return (
            <div key={`${b.age}-${i}`} className="lc-depletion-col" title={`Age ${b.age}: ${Math.round(b.balance)}`}>
              <div className="lc-depletion-bar" style={{ height: `${h}%` }} />
            </div>
          );
        })}
      </div>
      <div className="lc-depletion-axis">
        {bars.map((b, i) =>
          i % labelEvery === 0 || i === bars.length - 1 ? (
            <span key={`${b.age}-lbl-${i}`} className="lc-depletion-age">
              {b.age}
            </span>
          ) : (
            <span key={`${b.age}-sp-${i}`} className="lc-depletion-age lc-depletion-age--spacer" aria-hidden="true" />
          ),
        )}
      </div>
    </div>
  );
}
