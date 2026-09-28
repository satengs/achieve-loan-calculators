"use client";

import type { CSSProperties, ReactNode } from "react";
import { BRAND_TOKENS, tokensToCssVars } from "./tokens";
import { resolveProjectName, type ProjectName } from "./types";

export type BrandThemeProps = {
  projectName?: ProjectName | string;
  children: ReactNode;
  className?: string;
};

/**
 * Wraps calculator UI and applies brand CSS variables via data-project.
 * Consumer: <BrandTheme projectName="achieve">…</BrandTheme>
 * Each calculator also applies BrandTheme internally when projectName is set.
 */
export function BrandTheme({ projectName, children, className }: BrandThemeProps) {
  const brand = resolveProjectName(projectName);
  const vars = tokensToCssVars(BRAND_TOKENS[brand]);
  return (
    <div
      data-project={brand}
      className={["lc-root", className].filter(Boolean).join(" ")}
      style={vars as CSSProperties}
    >
      {children}
    </div>
  );
}
