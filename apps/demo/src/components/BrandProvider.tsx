"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { ProjectName } from "@loan-calculators/core";
import { BRAND_QUERY_KEY, DEFAULT_BRAND, parseBrand, writeStoredBrand } from "@/lib/brand";

type BrandContextValue = {
  brand: ProjectName;
  setBrand: (next: ProjectName) => void;
};

const BrandContext = createContext<BrandContextValue>({
  brand: DEFAULT_BRAND,
  setBrand: () => {},
});

export function useBrand(): BrandContextValue {
  return useContext(BrandContext);
}

/** Keep ?brand= in the address bar in sync without a navigation (history API; Next syncs useSearchParams). */
function syncBrandQuery(brand: ProjectName) {
  try {
    const url = new URL(window.location.href);
    if (url.searchParams.get(BRAND_QUERY_KEY) === brand) return;
    url.searchParams.set(BRAND_QUERY_KEY, brand);
    window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
  } catch {
    /* ignore */
  }
}

/**
 * The brand comes from the [brand] route segment, which proxy.ts resolves from
 * ?brand= → cookie → Achieve, so there is nothing to re-resolve on the client and the
 * theme never swaps after paint. On mount we persist it (localStorage + cookie) and put it
 * in the URL. setBrand re-themes in place (inputs are kept) and updates URL/cookie; the next
 * navigation is served from that brand's prerendered variant.
 */
export function BrandProvider({ children, initialBrand = DEFAULT_BRAND }: { children: ReactNode; initialBrand?: ProjectName }) {
  const [brand, setBrandState] = useState<ProjectName>(initialBrand);

  useEffect(() => {
    writeStoredBrand(brand);
    syncBrandQuery(brand);
  }, [brand]);

  const setBrand = useCallback((next: ProjectName) => {
    setBrandState(parseBrand(next));
  }, []);

  const value = useMemo(() => ({ brand, setBrand }), [brand, setBrand]);
  return <BrandContext.Provider value={value}>{children}</BrandContext.Provider>;
}
