"use client";

import Link from "next/link";
import { DemoBanner, getSiteContent } from "@loan-calculators/core";
import { landingChromeFor, withBrandQuery } from "@/lib/brand";
import { useBrand } from "./BrandProvider";

export function HomePageClient() {
  const { brand } = useBrand();
  const site = getSiteContent();
  const chrome = landingChromeFor(brand);

  return (
    <main className="lc-page">
      <header className="lc-header">
        <span className="lc-eyebrow">{chrome.eyebrow}</span>
        <h1>{site.header.title}</h1>
        <p>{site.header.intro}</p>
      </header>

      <DemoBanner
        icon={site.demoBanner.icon}
        strong={site.demoBanner.strong}
        body={site.demoBanner.body}
      />

      <div className="lc-landing-grid" role="list">
        {site.cards.map((card) => (
          <Link
            key={card.id}
            href={withBrandQuery(card.href, brand)}
            className="lc-card lc-landing-card"
            role="listitem"
          >
            <span className="lc-eyebrow">{card.eyebrow}</span>
            <h2>{card.title}</h2>
            <p>{card.description}</p>
            <span className="lc-link-label">{card.linkLabel}</span>
          </Link>
        ))}
      </div>

      <p className="lc-footer-note">{chrome.footerNote}</p>
    </main>
  );
}
