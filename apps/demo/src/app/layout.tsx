import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Loan Calculators | Multi-brand demos",
  description:
    "Personal loan, mortgage, HELOC, and life insurance calculators. Sample rates are illustrative only — not offers.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={dmSans.variable}>
      <body style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif" }}>{children}</body>
    </html>
  );
}
