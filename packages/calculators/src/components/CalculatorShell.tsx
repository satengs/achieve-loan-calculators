import type { ReactNode } from "react";
import { BrandTheme } from "../brand/BrandTheme";
import type { ProjectName } from "../brand/types";
import { DemoBanner } from "./DemoBanner";

type CalculatorShellProps = {
  projectName: ProjectName | string;
  eyebrow: string;
  title: string;
  intro: string;
  banner: { icon?: string; strong: string; body: string };
  footerNote: string;
  children: ReactNode;
};

/**
 * Shared page chrome: brand theme, header, demo banner, footer.
 * Does not use dangerouslySetInnerHTML — all copy is text.
 */
export function CalculatorShell({
  projectName,
  eyebrow,
  title,
  intro,
  banner,
  footerNote,
  children,
}: CalculatorShellProps) {
  return (
    <BrandTheme projectName={projectName}>
      <div className="lc-page">
        <header className="lc-header">
          <span className="lc-eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          <p>{intro}</p>
        </header>
        <DemoBanner icon={banner.icon} strong={banner.strong} body={banner.body} />
        {children}
        <p className="lc-footer-note">{footerNote}</p>
      </div>
    </BrandTheme>
  );
}
