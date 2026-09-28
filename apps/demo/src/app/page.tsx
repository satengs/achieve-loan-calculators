import Link from "next/link";
import { BrandTheme, getSiteContent } from "@loan-calculators/core";
import { DemoBanner } from "@loan-calculators/core";

const BRAND = (process.env.NEXT_PUBLIC_BRAND || "achieve") as "achieve" | "fdr" | "bills";

export default function HomePage() {
  const site = getSiteContent();

  return (
    <BrandTheme projectName={BRAND}>
      <main className="lc-page">
        <header className="lc-header">
          <span className="lc-eyebrow">{site.header.eyebrow}</span>
          <h1>{site.header.title}</h1>
          <p>{site.header.intro}</p>
        </header>

        <DemoBanner
          icon={site.demoBanner.icon}
          strong={site.demoBanner.strong}
          body={site.demoBanner.body}
        />

        <p className="lc-hint" style={{ marginBottom: "1rem" }}>
          Brand theme: <strong>{BRAND}</strong> (set NEXT_PUBLIC_BRAND=achieve|fdr|bills). Calculators accept{" "}
          <code>projectName</code> prop.
        </p>

        <div className="lc-landing-grid" role="list">
          {site.cards.map((card) => (
            <Link key={card.id} href={card.href} className="lc-card lc-landing-card" role="listitem">
              <span className="lc-eyebrow">{card.eyebrow}</span>
              <h2>{card.title}</h2>
              <p>{card.description}</p>
              <span className="lc-link-label">{card.linkLabel}</span>
            </Link>
          ))}
        </div>

        <p className="lc-footer-note">{site.footer.note}</p>
      </main>
    </BrandTheme>
  );
}
