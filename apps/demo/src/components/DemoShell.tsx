"use client";

import type { ReactNode } from "react";
import { BrandTheme, type ProjectName } from "@loan-calculators/core";
import { BrandProvider, useBrand } from "./BrandProvider";
import { BrandSwitcher } from "./BrandSwitcher";

function ThemedChrome({ children }: { children: ReactNode }) {
  const { brand } = useBrand();
  return (
    <BrandTheme projectName={brand}>
      <BrandSwitcher />
      {children}
    </BrandTheme>
  );
}

/**
 * Shared demo chrome: brand context + top switcher inside BrandTheme
 * so the bar restyles with the active brand tokens. The initial brand is the [brand]
 * route param (resolved by proxy.ts), so SSR, prerender and first client render agree.
 */
export function DemoShell({ children, initialBrand = "achieve" }: { children: ReactNode; initialBrand?: ProjectName }) {
  return (
    <BrandProvider initialBrand={initialBrand}>
      <ThemedChrome>{children}</ThemedChrome>
    </BrandProvider>
  );
}
