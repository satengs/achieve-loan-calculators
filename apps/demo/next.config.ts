import type { NextConfig } from "next";
import path from "path";

/**
 * Technical details tab. ON by default in every environment (preview, production,
 * local). Override with SHOW_TECHNICAL_TAB / NEXT_PUBLIC_SHOW_TECHNICAL_TAB =
 * "false" | "0" to hide. The result is inlined as NEXT_PUBLIC_LC_SHOW_TECH_TAB so
 * server and client agree.
 */
function resolveShowTechnicalTab(): boolean {
  const explicit = (process.env.SHOW_TECHNICAL_TAB ?? process.env.NEXT_PUBLIC_SHOW_TECHNICAL_TAB ?? "").trim().toLowerCase();
  if (explicit === "false" || explicit === "0") return false;
  if (explicit === "true" || explicit === "1") return true;
  return true;
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
