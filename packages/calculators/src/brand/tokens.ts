import type { ProjectName } from "./types";

/**
 * Design tokens per brand. Applied as CSS variables via BrandTheme.
 * Distinct professional palettes — not proprietary asset copies.
 */
export type BrandTokens = {
  primary: string;
  primaryHover: string;
  primaryDark: string;
  bg: string;
  bgTint: string;
  surface: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  borderStrong: string;
  error: string;
  focusRing: string;
  radius: string;
  radiusLg: string;
  font: string;
  shadow: string;
  /** Optional: main conversion CTA fill when it differs from `primary` (e.g. FDR red). Defaults to primary. */
  cta?: string;
  /** Optional: CTA hover fill. Defaults to primaryHover. */
  ctaHover?: string;
  /** Optional: CTA label color. Defaults to #fff. */
  ctaText?: string;
  /** Optional: inline text-link color. Defaults to primary. */
  link?: string;
  /** Optional: heading color. Defaults to primaryDark. */
  heading?: string;
};

export const BRAND_TOKENS: Record<ProjectName, BrandTokens> = {
  achieve: {
    primary: "#3300FF",
    primaryHover: "#2C47F6",
    primaryDark: "#154199",
    bg: "#F8F9FC",
    bgTint: "#EFF5FF",
    surface: "#FFFFFF",
    text: "#1D252F",
    textSecondary: "#42546B",
    textMuted: "#5C708A",
    border: "#E7ECF3",
    borderStrong: "#C0CBD8",
    error: "#CF264E",
    focusRing: "rgba(51, 0, 255, 0.35)",
    radius: "8px",
    radiusLg: "12px",
    font: "'DM Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif",
    shadow: "0 4px 24px rgba(29, 37, 47, 0.08)",
  },
  /**
   * Freedom Debt Relief — values extracted from freedomdebtrelief.com (Oct 2026) computed styles
   * and its Tailwind CSS bundle. See docs/BRANDS.md for the selector/source of every value.
   */
  fdr: {
    primary: "#154199", // .bg-content-accent — in-page savings tool CTA, apply-flow Continue, slider thumb
    primaryHover: "#002D87", // .bg-blue-700 (FDR palette) — darker hover so state change is visible
    primaryDark: "#041B93", // .text-blue-base / .border-blue-base — outline CTA + "Client Dashboard"
    bg: "#F9F9F9", // .bg-secondary — hero + alternating section background
    bgTint: "#F0F3FF", // .bg-blue-540 — Client Dashboard pill / tinted surfaces
    surface: "#FFFFFF", // tool cards (.rounded-lg.bg-white)
    text: "#2F2F2F", // .text-content-primary — headings + body copy
    textSecondary: "#454545", // body paragraph color (computed)
    textMuted: "#737373", // .text-content-secondary — eyebrow, slider min/max, helper text
    border: "#E7ECF3", // .bg-gray-75 / hairlines
    borderStrong: "#C0CBD8", // select.border-gray-145 — form control border
    error: "#D01F1D", // .text-red-500
    focusRing: "rgba(51, 0, 255, 0.2)", // slider thumb hover ring (box-shadow 0 0 0 6px #30f3)
    radius: "8px", // .rounded-lg on buttons, selects, cards
    radiusLg: "8px", // tool cards are also rounded-lg (8px)
    // Ultramarine is FDR's licensed, self-hosted face (not redistributable). FDR's own apply flow
    // declares `Ultramarine, "DM Sans"` — we load DM Sans and list Ultramarine first for local installs.
    font: "Ultramarine, var(--font-dm-sans, 'DM Sans'), 'DM Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif",
    shadow:
      "0 2.5px 7px rgba(29, 37, 47, 0.06), 0 1px 1.8px rgba(29, 37, 47, 0.01), 0 0.3px 1.5px rgba(20, 46, 87, 0.03)", // apply-flow step card
    cta: "#CB000E", // .bg-red-850 — hero "Continue" + header "See if you qualify"
    ctaHover: "#A3000B", // darker red hover (FDR's own hover leaves the fill unchanged)
    ctaText: "#FFFFFF", // white bold label (5.92:1 on #CB000E)
    link: "#3300FF", // .text-blue-560 — inline links ("privacy policy", "How are these numbers calculated?")
    heading: "#2F2F2F", // headings use content-primary, not brand blue
  },
  /**
   * bills.com — values extracted from www.bills.com (Oct 2026): homepage "Find a personal loan" slider tool,
   * /resources/home-equity/heloc-calculator, computed styles + Tailwind bundle. See docs/BRANDS.md.
   */
  bills: {
    primary: "#0F4C81", // .bg-blue-500 — "Get your rate" pill CTA, active tool tab, slider fill, $30,000 amount
    primaryHover: "#10385A", // .bg-blue-700 — darker step (bills.com's own hover keeps the fill unchanged)
    primaryDark: "#10385A", // .bg-blue-700 — "Explore more finance topics" dark band
    bg: "#F8F8F8", // .bg-gray-130 / .bg-gray-200 — tool section + topic cards background
    bgTint: "#EFF5FF", // .bg-blue-135 — light blue tinted surfaces
    surface: "#FFFFFF", // tool card .bg-white
    text: "#212121", // most-used heading/body color (h3 cards, nav links)
    textSecondary: "#6E6E6E", // nav section headings / secondary copy
    textMuted: "#6B7280", // slider min/max labels ($5,000 / $50,000)
    border: "#E9E9E9", // .border-gray-150
    borderStrong: "#C7C7CC", // .border-gray-190
    error: "#D01F1D", // .bg-red-500
    focusRing: "rgba(0, 123, 255, 0.35)", // input :focus border #007BFF (.border-blue-800)
    radius: "8px", // .rounded-lg — HELOC "See if you qualify", tool card (mobile)
    radiusLg: "16px", // .rounded-2xl — tool card (desktop), topic cards
    // Noto Sans + DM Sans are bills.com's own declared stack (both Google Fonts, self-hosted via next/font there).
    font: "var(--font-noto-sans, 'Noto Sans'), 'Noto Sans', var(--font-dm-sans, 'DM Sans'), 'DM Sans', ui-sans-serif, system-ui, -apple-system, sans-serif",
    shadow: "0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.1)", // HELOC calculator card .shadow-md
    cta: "#0F4C81", // .bg-blue-500.rounded-full "Get your rate"
    ctaHover: "#10385A",
    ctaText: "#FFFFFF", // .text-white.font-bold (8.9:1)
    link: "#1857F8", // .text-blue-530 inline links
    heading: "#212121",
  },
};

export function tokensToCssVars(tokens: BrandTokens): Record<string, string> {
  return {
    "--lc-primary": tokens.primary,
    "--lc-primary-hover": tokens.primaryHover,
    "--lc-primary-dark": tokens.primaryDark,
    "--lc-bg": tokens.bg,
    "--lc-bg-tint": tokens.bgTint,
    "--lc-surface": tokens.surface,
    "--lc-text": tokens.text,
    "--lc-text-secondary": tokens.textSecondary,
    "--lc-text-muted": tokens.textMuted,
    "--lc-border": tokens.border,
    "--lc-border-strong": tokens.borderStrong,
    "--lc-error": tokens.error,
    "--lc-focus-ring": tokens.focusRing,
    "--lc-radius": tokens.radius,
    "--lc-radius-lg": tokens.radiusLg,
    "--lc-font": tokens.font,
    "--lc-shadow": tokens.shadow,
    "--lc-cta": tokens.cta ?? tokens.primary,
    "--lc-cta-hover": tokens.ctaHover ?? tokens.primaryHover,
    "--lc-cta-text": tokens.ctaText ?? "#FFFFFF",
    "--lc-link": tokens.link ?? tokens.primary,
    "--lc-heading": tokens.heading ?? tokens.primaryDark,
  };
}
