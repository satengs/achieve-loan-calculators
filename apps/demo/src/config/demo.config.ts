/**
 * Demo-level feature flags (apps/demo only — the @loan-calculators/core
 * components never read these, so production embeds stay clean).
 *
 * showTechnicalTab: the "Calculator | Technical details" tab bar, the home-page reviewer
 * callout and the card "Technical details" links. OFF in production by default, ON in
 * Vercel preview and `next dev`. Resolved at build time in next.config.ts; override with
 * SHOW_TECHNICAL_TAB=true|false (or NEXT_PUBLIC_SHOW_TECHNICAL_TAB) in the Vercel project
 * env for the target environment and redeploy. When off, ?tab=tech is ignored and the
 * technical registry is not sent to the browser.
 */
export const DEMO_CONFIG = {
  showTechnicalTab: process.env.NEXT_PUBLIC_LC_SHOW_TECH_TAB === "1",
  githubRepo: "https://github.com/satengs/achieve-loan-calculators",
  githubBranch: "main",
} as const;
