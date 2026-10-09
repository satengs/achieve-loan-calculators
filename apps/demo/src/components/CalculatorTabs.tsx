"use client";

import { Suspense, useCallback, useId, useRef, type KeyboardEvent, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { DEMO_CONFIG } from "@/config/demo.config";
import type { TechEntry, TechRateRow } from "@/lib/tech";
import { TechnicalDetails } from "./TechnicalDetails";

export const TAB_QUERY_KEY = "tab";
const TABS = [
  { id: "calc", label: "Calculator" },
  { id: "tech", label: "Technical details" },
] as const;
type TabId = (typeof TABS)[number]["id"];

type Props = {
  children: ReactNode;
  tech: TechEntry;
  rateRows: TechRateRow[];
};

/**
 * Demo-only tab bar: Calculator (default) | Technical details.
 * State lives in ?tab=tech (alongside ?brand=) so links are shareable.
 * WAI-ARIA tabs pattern: role=tablist/tab/tabpanel, ←/→/Home/End move + activate.
 * The calculator panel stays mounted (hidden) so its inputs survive tab switches.
 */
export function CalculatorTabs(props: Props) {
  if (!DEMO_CONFIG.showTechnicalTab) return <>{props.children}</>;
  // useSearchParams needs a Suspense boundary for static prerender; the fallback
  // renders the same tab UI pinned to "Calculator" so the server HTML matches the default.
  return (
    <Suspense fallback={<TabsView {...props} active="calc" onSelect={() => {}} />}>
      <UrlTabs {...props} />
    </Suspense>
  );
}

function UrlTabs(props: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const active: TabId = searchParams.get(TAB_QUERY_KEY) === "tech" ? "tech" : "calc";

  const select = useCallback(
    (id: TabId) => {
      const params = new URLSearchParams(searchParams.toString());
      if (id === "tech") params.set(TAB_QUERY_KEY, "tech");
      else params.delete(TAB_QUERY_KEY);
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  return <TabsView {...props} active={active} onSelect={select} />;
}

function TabsView({
  children,
  tech,
  rateRows,
  active,
  onSelect,
}: Props & { active: TabId; onSelect: (id: TabId) => void }) {
  const baseId = useId();
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const select = (id: TabId, focus = false) => {
    onSelect(id);
    if (focus) tabRefs.current[TABS.findIndex((t) => t.id === id)]?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next = -1;
    if (e.key === "ArrowRight") next = (index + 1) % TABS.length;
    else if (e.key === "ArrowLeft") next = (index - 1 + TABS.length) % TABS.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = TABS.length - 1;
    if (next >= 0) {
      e.preventDefault();
      select(TABS[next].id, true);
    }
  };

  return (
    <div className="lc-demo-tabs-wrap">
      <div className="lc-demo-tabs" role="tablist" aria-label={`${tech.title} calculator views`}>
        {TABS.map((t, i) => {
          const selected = active === t.id;
          return (
            <button
              key={t.id}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${t.id}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${t.id}`}
              tabIndex={selected ? 0 : -1}
              className={selected ? "lc-demo-tab lc-demo-tab-active" : "lc-demo-tab"}
              onClick={() => select(t.id)}
              onKeyDown={(e) => onKeyDown(e, i)}
            >
              {t.label}
            </button>
          );
        })}
      </div>
      <div
        role="tabpanel"
        id={`${baseId}-panel-calc`}
        aria-labelledby={`${baseId}-tab-calc`}
        hidden={active !== "calc"}
      >
        {children}
      </div>
      <div
        role="tabpanel"
        id={`${baseId}-panel-tech`}
        aria-labelledby={`${baseId}-tab-tech`}
        hidden={active !== "tech"}
        tabIndex={0}
      >
        {active === "tech" ? <TechnicalDetails tech={tech} rateRows={rateRows} /> : null}
      </div>
    </div>
  );
}
