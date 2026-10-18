"use client";

import { Suspense, useCallback, useId, useRef, type KeyboardEvent, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DEMO_CONFIG } from "@/config/demo.config";
import type { TechEntry, TechRateRow } from "@/lib/tech";
import { TechnicalDetails } from "./TechnicalDetails";
import { CalculatorBreadcrumb } from "./CalculatorBreadcrumb";
import { CalcIcon, CodeIcon } from "./TechIcons";

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
  return (
    <>
      <CalculatorBreadcrumb slug={props.tech.slug} />
      {DEMO_CONFIG.showTechnicalTab ? <TabsWithUrl {...props} /> : props.children}
    </>
  );
}

function TabsWithUrl(props: Props) {
  // useSearchParams needs a Suspense boundary. Pages are prerendered, so the fallback is what
  // the HTML contains: it renders both panels and a <head> script sets html[data-lc-tab="tech"]
  // for ?tab=tech, letting CSS show the right panel before hydration (no calc→tech swap).
  return (
    <Suspense fallback={<TabsView {...props} active="calc" onSelect={() => {}} prerender />}>
      <UrlTabs {...props} />
    </Suspense>
  );
}

function UrlTabs(props: Props) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const active: TabId = searchParams.get(TAB_QUERY_KEY) === "tech" ? "tech" : "calc";

  const select = useCallback(
    (id: TabId) => {
      const params = new URLSearchParams(searchParams.toString());
      if (id === "tech") params.set(TAB_QUERY_KEY, "tech");
      else params.delete(TAB_QUERY_KEY);
      const qs = params.toString();
      // Browser path, not the proxy-rewritten /[brand]/… route path.
      const pathname = window.location.pathname;
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, searchParams],
  );

  return <TabsView {...props} active={active} onSelect={select} />;
}

function TabsView({
  children,
  tech,
  rateRows,
  active,
  onSelect,
  prerender = false,
}: Props & { active: TabId; onSelect: (id: TabId) => void; prerender?: boolean }) {
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
    <div className="lc-demo-tabs-wrap" data-prerender-tabs={prerender ? "" : undefined}>
      {/* Fixed-height row (SSR + Suspense fallback render the same markup) so nothing below shifts. */}
      <div className="lc-demo-tabs">
        <div className="lc-demo-tablist" role="tablist" aria-label={`${tech.title} calculator views`}>
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
                data-tab={t.id}
                className={selected ? "lc-demo-tab lc-demo-tab-active" : "lc-demo-tab"}
                onClick={() => select(t.id)}
                onKeyDown={(e) => onKeyDown(e, i)}
              >
                {t.id === "calc" ? <CalcIcon /> : <CodeIcon />}
                <span className="lc-demo-tab-label">{t.label}</span>
                {t.id === "tech" ? (
                  <span className="lc-demo-tab-badge" aria-hidden="true">
                    For reviewers
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
      <div
        role="tabpanel"
        id={`${baseId}-panel-calc`}
        aria-labelledby={`${baseId}-tab-calc`}
        data-panel="calc"
        hidden={active !== "calc"}
      >
        {children}
      </div>
      <div
        role="tabpanel"
        id={`${baseId}-panel-tech`}
        aria-labelledby={`${baseId}-tab-tech`}
        data-panel="tech"
        hidden={active !== "tech"}
        tabIndex={0}
      >
        {active === "tech" || prerender ? <TechnicalDetails tech={tech} rateRows={rateRows} /> : null}
      </div>
    </div>
  );
}
