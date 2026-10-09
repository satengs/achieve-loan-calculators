import type { Metadata } from "next";
import { DM_Sans, Noto_Sans } from "next/font/google";
import { cookies, headers } from "next/headers";
import { isProjectName } from "@loan-calculators/core";
import { DemoShell } from "@/components/DemoShell";
import { BRAND_COOKIE, DEFAULT_BRAND } from "@/lib/brand";
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
async function resolveInitialBrand() {
  const fromQuery = (await headers()).get(BRAND_HEADER);
  if (isProjectName(fromQuery)) return fromQuery;
  const fromCookie = (await cookies()).get(BRAND_COOKIE)?.value;
  if (isProjectName(fromCookie)) return fromCookie;
  return DEFAULT_BRAND;
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const initialBrand = await resolveInitialBrand();
  const initialTab = (await headers()).get(TAB_HEADER) === "tech" ? "tech" : "calc";
  return (
    <html lang="en" className={`${dmSans.variable} ${notoSans.variable}`}>
      <body style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif" }}>
        <RequestHintsProvider value={{ initialTab }}>
          <DemoShell initialBrand={initialBrand}>{children}</DemoShell>
        </RequestHintsProvider>
      </body>
    </html>
  );
}
