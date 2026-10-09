"use client";

import Link from "next/link";
import { DemoBanner, getSiteContent } from "@loan-calculators/core";
import { landingChromeFor, withBrandQuery } from "@/lib/brand";
import { useBrand } from "./BrandProvider";

export function HomePageClient() {
  const { brand } = useBrand();
  const site = getSiteContent();
  const chrome = landingChromeFor(brand);
  const sections = site.sections?.length ? site.sections : [{ id: "all", title: "", description: "" }];

  return (
    <main className="lc-page">
      <header className="lc-header">
        <span className="lc-eyebrow">{chrome.eyebrow}</span>
        <h1>{site.header.title}</h1>
        <p>{site.header.intro}</p>
      </header>

      <DemoBanner icon={site.demoBanner.icon} strong={site.demoBanner.strong} body={site.demoBanner.body} />

      {sections.map((section) => {
        const cards = site.cards.filter((c) => (section.id === "all" ? true : c.section === section.id));
        if (cards.length === 0) return null;
        return (
          <section className="lc-landing-section" key={section.id} aria-labelledby={`sec-${section.id}`}>
            {section.title ? <h2 id={`sec-${section.id}`}>{section.title}</h2> : null}
            {section.description ? <p>{section.description}</p> : null}
            <div className="lc-landing-grid" role="list">
              {cards.map((card) => (
                <Link key={card.id} href={withBrandQuery(card.href, brand)} className="lc-card lc-landing-card" role="listitem">
                  <span className="lc-eyebrow">{card.eyebrow}</span>
                  <h3 className="lc-landing-card-title">{card.title}</h3>
                  <p>{card.description}</p>
                  <span className="lc-link-label">{card.linkLabel}</span>
                </Link>
              ))}
            </div>
          </section>
        );
      })}

      <p className="lc-footer-note">{chrome.footerNote}</p>
    </main>
  );
}
