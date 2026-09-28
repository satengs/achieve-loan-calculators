"use client";

import { Suspense, type ReactNode } from "react";
import { BrandTheme } from "@loan-calculators/core";
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
export function DemoShell({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <DefaultBrandProvider>
          <BrandTheme projectName="achieve">
            <BrandSwitcher />
            {children}
          </BrandTheme>
        </DefaultBrandProvider>
      }
    >
      <BrandProvider>
        <ThemedChrome>{children}</ThemedChrome>
      </BrandProvider>
    </Suspense>
  );
}
