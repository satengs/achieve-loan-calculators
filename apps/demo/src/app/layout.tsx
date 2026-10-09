import type { Metadata } from "next";
import { DM_Sans, Noto_Sans } from "next/font/google";
import { cookies, headers } from "next/headers";
import { isProjectName, type ProjectName } from "@loan-calculators/core";
import { DemoShell } from "@/components/DemoShell";
import { BRAND_COOKIE, BRAND_STORAGE_KEY, DEFAULT_BRAND } from "@/lib/brand";
import { BRAND_HEADER, TAB_HEADER } from "@/lib/brand-header";
import { RequestHintsProvider } from "@/components/RequestHints";
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

/** Resolve the first-paint brand on the server: ?brand= (via proxy header) → cookie → Achieve. */
async function resolveInitialBrand(): Promise<{ brand: ProjectName; fromDefault: boolean }> {
  const fromQuery = (await headers()).get(BRAND_HEADER);
  if (isProjectName(fromQuery)) return { brand: fromQuery, fromDefault: false };
  const fromCookie = (await cookies()).get(BRAND_COOKIE)?.value;
  if (isProjectName(fromCookie)) return { brand: fromCookie, fromDefault: false };
  return { brand: DEFAULT_BRAND, fromDefault: true };
}

/**
 * One-time migration for visitors whose brand lives only in localStorage (pre-cookie).
 * Emitted only when the server fell back to the default brand (no ?brand=, no cookie).
 * Runs in <head> before the body is parsed/painted: copies the stored brand into the cookie
 * and, if it isn't the default, hides the document and reloads with ?brand= so the very first
 * visible paint is already the right brand (no Achieve→brand swap). No loop: the reloaded
 * URL carries ?brand=, so the server doesn't emit this script again.
 */
const BRAND_MIGRATION_SCRIPT = `(function(){try{var k=${JSON.stringify(BRAND_STORAGE_KEY)},b=localStorage.getItem(k);if(b!=="fdr"&&b!=="bills"&&b!=="achieve")return;document.cookie=${JSON.stringify(BRAND_COOKIE)}+"="+b+"; path=/; max-age=31536000; samesite=lax";if(b===${JSON.stringify(DEFAULT_BRAND)})return;var u=new URL(location.href);if(u.searchParams.get("brand"))return;u.searchParams.set("brand",b);document.documentElement.style.visibility="hidden";location.replace(u.href);}catch(e){}})();`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { brand: initialBrand, fromDefault } = await resolveInitialBrand();
  const initialTab = (await headers()).get(TAB_HEADER) === "tech" ? "tech" : "calc";
  return (
    <html lang="en" className={`${dmSans.variable} ${notoSans.variable}`}>
      <head>
        {fromDefault ? <script dangerouslySetInnerHTML={{ __html: BRAND_MIGRATION_SCRIPT }} /> : null}
      </head>
      <body style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif" }}>
        <RequestHintsProvider value={{ initialTab }}>
          <DemoShell initialBrand={initialBrand}>{children}</DemoShell>
        </RequestHintsProvider>
      </body>
    </html>
  );
}
