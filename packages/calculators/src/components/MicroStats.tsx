export type MicroStat = {
  label: string;
  value: string;
  /** Optional accent: primary (default) or muted/secondary bar color. */
  accent?: "primary" | "growth" | "negative";
};

/** Uppercase micro-stat pair used in presentation results cards. */
export function MicroStats({ items }: { items: MicroStat[] }) {
  if (!items.length) return null;
  return (
    <div className="lc-micro-stats">
      {items.map((item) => (
        <div
          key={item.label}
          className={
            item.accent === "growth"
              ? "lc-micro-stat lc-micro-stat--growth"
              : item.accent === "negative"
                ? "lc-micro-stat lc-micro-stat--negative"
                : "lc-micro-stat"
          }
        >
          <div className="lc-micro-stat-label">{item.label}</div>
          <div className="lc-micro-stat-value">{item.value}</div>
        </div>
      ))}
    </div>
  );
}
