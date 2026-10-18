import type { NextConfig } from "next";
import path from "path";

/**
 * Technical details tab (demo/review only). Resolved once at build time:
 *   1. SHOW_TECHNICAL_TAB / NEXT_PUBLIC_SHOW_TECHNICAL_TAB = "true" | "false"  → explicit override
 *   2. on Vercel: on for preview/development deployments, OFF for VERCEL_ENV=production
 *   3. elsewhere: on for `next dev`, OFF for `next build` (treat unknown hosts as production)
 * The result is inlined as NEXT_PUBLIC_LC_SHOW_TECH_TAB so server and client agree.
 */
function resolveShowTechnicalTab(): boolean {
  const explicit = (process.env.SHOW_TECHNICAL_TAB ?? process.env.NEXT_PUBLIC_SHOW_TECHNICAL_TAB ?? "").trim().toLowerCase();
  if (explicit === "true" || explicit === "1") return true;
  if (explicit === "false" || explicit === "0") return false;
  if (process.env.VERCEL_ENV) return process.env.VERCEL_ENV !== "production";
  return process.env.NODE_ENV !== "production";
}

const nextConfig: NextConfig = {
  transpilePackages: ["@loan-calculators/core"],
  // Monorepo: trace from workspace root for file tracing
  outputFileTracingRoot: path.join(__dirname, "../.."),
  env: {
    NEXT_PUBLIC_LC_SHOW_TECH_TAB: resolveShowTechnicalTab() ? "1" : "0",
  },
};

export default nextConfig;
