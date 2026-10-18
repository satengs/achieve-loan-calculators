import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DM_Sans, Noto_Sans } from "next/font/google";
import { isProjectName } from "@loan-calculators/core";
import { DemoShell } from "@/components/DemoShell";
import { DEMO_CONFIG } from "@/config/demo.config";
import { BRAND_COOKIE, BRAND_STORAGE_KEY, DEFAULT_BRAND } from "@/lib/brand";
import { BRAND_IDS } from "@/lib/brand-header";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

/** bills.com theme font (bills.com declares "Noto Sans", "DM Sans"). Exposed as a variable only. */
const notoSans = Noto_Sans({
  subsets: ["latin"],
  variable: "--font-noto-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Loan Calculators | Multi-brand demos",
  description:
    "Personal loan, mortgage, HELOC, and life insurance calculators. Sample rates are illustrative only — not offers.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "32x32" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

/**
 * M1: the brand is a static route param. proxy.ts rewrites /x?brand=fdr (or the cookie) to
 * /fdr/x, and each brand variant is prerendered, so no page is forced dynamic by
 * headers()/cookies() in the root layout.
 */
export function generateStaticParams() {
  return BRAND_IDS.map((brand) => ({ brand }));
}
export const dynamicParams = false;

/**
 * Runs in <head> before first paint:
 * 1. One-time migration for visitors whose brand lives only in localStorage (pre-cookie): if
 *    there is no ?brand= and no cookie, copy it into the cookie and, if it isn't the default,
 *    hide the document and reload with ?brand= so the first visible paint is the right brand.
 *    No loop: the reloaded URL carries ?brand=.
 * 2. When the tech tab is enabled, mark <html data-lc-tab="tech"> for ?tab=tech so the
 *    prerendered tab fallback shows the right panel before hydration (no calc→tech swap).
 */
function headScript(withTab: boolean) {
  const migrate = `var q=new URLSearchParams(location.search);if(!q.get("brand")&&document.cookie.indexOf(${JSON.stringify(BRAND_COOKIE + "=")})<0){var b=localStorage.getItem(${JSON.stringify(BRAND_STORAGE_KEY)});if(b==="fdr"||b==="bills"||b==="achieve"){document.cookie=${JSON.stringify(BRAND_COOKIE)}+"="+b+"; path=/; max-age=31536000; samesite=lax";if(b!==${JSON.stringify(DEFAULT_BRAND)}){var u=new URL(location.href);u.searchParams.set("brand",b);document.documentElement.style.visibility="hidden";location.replace(u.href);}}}`;
  const tab = withTab ? `if(q.get("tab")==="tech")document.documentElement.setAttribute("data-lc-tab","tech");` : "";
  return `(function(){try{${migrate}${tab}}catch(e){}})();`;
}

export default async function BrandRootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ brand: string }>;
}) {
  const { brand } = await params;
  if (!isProjectName(brand)) notFound();
  return (
    <html lang="en" className={`${dmSans.variable} ${notoSans.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: headScript(DEMO_CONFIG.showTechnicalTab) }} />
      </head>
      <body style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif" }}>
        <DemoShell initialBrand={brand}>{children}</DemoShell>
      </body>
    </html>
  );
}
