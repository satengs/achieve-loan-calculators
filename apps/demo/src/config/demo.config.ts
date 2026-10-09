/**
 * Demo-level feature flags (apps/demo only — the @loan-calculators/core
 * components never read these, so production embeds stay clean).
 *
 * showTechnicalTab: render the "Calculator | Technical details" tab bar on every
 * calculator page. Override at build time with NEXT_PUBLIC_SHOW_TECHNICAL_TAB=false.
 */
export const DEMO_CONFIG = {
  showTechnicalTab: process.env.NEXT_PUBLIC_SHOW_TECHNICAL_TAB !== "false",
  githubRepo: "https://github.com/satengs/achieve-loan-calculators",
  githubBranch: "main",
} as const;
