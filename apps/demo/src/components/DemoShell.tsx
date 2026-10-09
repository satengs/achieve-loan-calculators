"use client";

import { Suspense, type ReactNode } from "react";
import { BrandTheme, type ProjectName } from "@loan-calculators/core";
import { BrandProvider, DefaultBrandProvider, useBrand } from "./BrandProvider";
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
 * so the bar restyles with the active brand tokens.
 */
export function DemoShell({
  children,
  initialBrand = "achieve",
}: {
  children: ReactNode;
  initialBrand?: ProjectName;
}) {
  return (
    <Suspense
      fallback={
        <DefaultBrandProvider brand={initialBrand}>
          <BrandTheme projectName={initialBrand}>
            <BrandSwitcher />
            {children}
          </BrandTheme>
        </DefaultBrandProvider>
      }
    >
      <BrandProvider initialBrand={initialBrand}>
        <ThemedChrome>{children}</ThemedChrome>
      </BrandProvider>
    </Suspense>
  );
}
