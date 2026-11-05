/**
 * Demo-level feature flags (apps/demo only — the @loan-calculators/core
 * components never read these, so production embeds stay clean).
 *
 * showTechnicalTab: the "Calculator | Technical details" tab bar, the home-page reviewer
 * callout and the card "Technical details" links. ON by default in every environment
 * (including production). Resolved at build time in next.config.ts; set
 * SHOW_TECHNICAL_TAB=false (or NEXT_PUBLIC_SHOW_TECHNICAL_TAB=false) in the Vercel
 * project env to hide, then redeploy. When off, ?tab=tech is ignored and the
 * technical registry is not sent to the browser.
 */
export const DEMO_CONFIG = {
  showTechnicalTab: process.env.NEXT_PUBLIC_LC_SHOW_TECH_TAB !== "0",
  githubRepo: "https://github.com/satengs/achieve-loan-calculators",
  githubBranch: "main",
} as const;
