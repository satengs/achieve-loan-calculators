import {
  isProjectName,
  resolveProjectName,
  type ProjectName,
} from "@loan-calculators/core";

export const BRAND_STORAGE_KEY = "lc-demo-brand";
export const BRAND_QUERY_KEY = "brand";
export const DEFAULT_BRAND: ProjectName = "achieve";

export const BRAND_OPTIONS: { value: ProjectName; label: string }[] = [
  { value: "achieve", label: "Achieve" },
  { value: "fdr", label: "FDR" },
  { value: "bills", label: "bills.com" },
];

/** Validate unknown input; invalid → achieve. */
export function parseBrand(value: unknown): ProjectName {
  if (typeof value === "string" && isProjectName(value)) return value;
  return resolveProjectName(typeof value === "string" ? value : null);
}

export function readStoredBrand(): ProjectName | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(BRAND_STORAGE_KEY);
    return isProjectName(raw) ? raw : null;
  } catch {
    return null;
  }
}

export function writeStoredBrand(brand: ProjectName): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(BRAND_STORAGE_KEY, brand);
  } catch {
    /* private mode / quota — ignore */
  }
}

/**
 * Append or replace `?brand=` on an internal path (preserves other query keys / hash).
 * Absolute/external URLs are returned unchanged.
 */
export function withBrandQuery(href: string, brand: ProjectName): string {
  if (!href.startsWith("/")) return href;

  const hashIndex = href.indexOf("#");
  const hash = hashIndex >= 0 ? href.slice(hashIndex) : "";
  const withoutHash = hashIndex >= 0 ? href.slice(0, hashIndex) : href;

  const qIndex = withoutHash.indexOf("?");
  const path = qIndex >= 0 ? withoutHash.slice(0, qIndex) : withoutHash;
  const existingQuery = qIndex >= 0 ? withoutHash.slice(qIndex + 1) : "";

  const params = new URLSearchParams(existingQuery);
  params.set(BRAND_QUERY_KEY, brand);
  return `${path}?${params.toString()}${hash}`;
}
