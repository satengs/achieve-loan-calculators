"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { isProjectName, type ProjectName } from "@loan-calculators/core";
import {
  BRAND_QUERY_KEY,
  DEFAULT_BRAND,
  parseBrand,
  writeStoredBrand,
} from "@/lib/brand";

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

/** Static provider for Suspense fallback / SSR shell (Achieve default). */
export function DefaultBrandProvider({
  children,
  brand = DEFAULT_BRAND,
}: {
  children: ReactNode;
  brand?: ProjectName;
}) {
  const value = useMemo<BrandContextValue>(() => ({ brand, setBrand: () => {} }), [brand]);
  return <BrandContext.Provider value={value}>{children}</BrandContext.Provider>;
}

/**
 * Resolve order: valid ?brand= → localStorage → Achieve.
 * On setBrand: write localStorage + router.replace keeping path, updating brand query.
 */
export function BrandProvider({
  children,
  initialBrand = DEFAULT_BRAND,
}: {
  children: ReactNode;
  /** Brand resolved on the server (?brand= header or cookie) so SSR and first client render agree. */
  initialBrand?: ProjectName;
}) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const queryRaw = searchParams.get(BRAND_QUERY_KEY);
  const queryBrand = isProjectName(queryRaw) ? queryRaw : null;

  const [brand, setBrandState] = useState<ProjectName>(queryBrand ?? initialBrand);

  useEffect(() => {
    if (queryBrand) {
      setBrandState(queryBrand);
      writeStoredBrand(queryBrand);
      return;
    }

    // No ?brand=: keep the brand the page was server-rendered with (cookie → default, and the
    // <head> migration script already redirected stale localStorage-only users before paint).
    // Never swap the theme after paint here — only sync storage/cookie and the URL to it.
    const resolved = brand;
    writeStoredBrand(resolved);

    const params = new URLSearchParams(searchParams.toString());
    if (queryRaw !== null && !isProjectName(queryRaw)) {
      params.delete(BRAND_QUERY_KEY);
    }
    if (params.get(BRAND_QUERY_KEY) !== resolved) {
      params.set(BRAND_QUERY_KEY, resolved);
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }
  }, [brand, queryBrand, queryRaw, pathname, router, searchParams]);

  const setBrand = useCallback(
    (next: ProjectName) => {
      const resolved = parseBrand(next);
      setBrandState(resolved);
      writeStoredBrand(resolved);
      const params = new URLSearchParams(searchParams.toString());
      params.set(BRAND_QUERY_KEY, resolved);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const value = useMemo(() => ({ brand, setBrand }), [brand, setBrand]);

  return <BrandContext.Provider value={value}>{children}</BrandContext.Provider>;
}
