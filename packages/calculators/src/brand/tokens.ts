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
  fdr: {
    primary: "#0B6E4F",
    primaryHover: "#095C42",
    primaryDark: "#064032",
    bg: "#F4F7F5",
    bgTint: "#E6F2EC",
    surface: "#FFFFFF",
    text: "#1A2421",
    textSecondary: "#3D4F48",
    textMuted: "#5A6B64",
    border: "#D7E3DC",
    borderStrong: "#A8BDB3",
    error: "#B42318",
    focusRing: "rgba(11, 110, 79, 0.35)",
    radius: "6px",
    radiusLg: "10px",
    font: "Georgia, 'Times New Roman', Times, serif",
    shadow: "0 4px 20px rgba(26, 36, 33, 0.08)",
  },
  bills: {
    primary: "#E85D04",
    primaryHover: "#D00000",
    primaryDark: "#9D0208",
    bg: "#FFF8F3",
    bgTint: "#FFE8D6",
    surface: "#FFFFFF",
    text: "#212529",
    textSecondary: "#495057",
    textMuted: "#6C757D",
    border: "#F1E3D3",
    borderStrong: "#D4B896",
    error: "#D00000",
    focusRing: "rgba(232, 93, 4, 0.35)",
    radius: "12px",
    radiusLg: "16px",
    font: "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    shadow: "0 6px 28px rgba(33, 37, 41, 0.1)",
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
  };
}
