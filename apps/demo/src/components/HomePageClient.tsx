"use client";

import Link from "next/link";
import { DemoBanner, getSiteContent } from "@loan-calculators/core";
import { landingChromeFor, withBrandQuery } from "@/lib/brand";
import { useBrand } from "./BrandProvider";
import { DEMO_CONFIG } from "@/config/demo.config";
import { CodeIcon } from "./TechIcons";

const TECH_EXAMPLE_SLUG = "/debt-payoff";

/** `/slug?tab=tech&brand=…` — deep link straight into a calculator's Technical details view. */
function techHref(href: string, brand: Parameters<typeof withBrandQuery>[1]) {
  return withBrandQuery(`${href}${href.includes("?") ? "&" : "?"}tab=tech`, brand);
}

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

      {DEMO_CONFIG.showTechnicalTab ? (
        <aside className="lc-reviewer-callout" aria-label="For reviewers">
          <span className="lc-reviewer-callout-icon">
            <CodeIcon />
          </span>
          <p className="lc-reviewer-callout-text">
            <strong>For reviewers:</strong> every calculator has a <strong>Technical details</strong> view — formulas,
            content &amp; config JSON, live data and brand tokens.
          </p>
          <Link className="lc-reviewer-callout-link" href={techHref(TECH_EXAMPLE_SLUG, brand)}>
            See an example <span aria-hidden="true">→</span>
          </Link>
        </aside>
      ) : null}

      <DemoBanner icon={site.demoBanner.icon} strong={site.demoBanner.strong} body={site.demoBanner.body} />

      {sections.map((section) => {
        const cards = site.cards.filter((c) => (section.id === "all" ? true : c.section === section.id));
        if (cards.length === 0) return null;
        return (
          <section className="lc-landing-section" id={section.id === "all" ? undefined : section.id} key={section.id} aria-labelledby={`sec-${section.id}`}>
            {section.title ? <h2 id={`sec-${section.id}`}>{section.title}</h2> : null}
            {section.description ? <p>{section.description}</p> : null}
            <div className="lc-landing-grid" role="list">
              {cards.map((card) => (
                <div key={card.id} className="lc-card lc-landing-card" role="listitem">
                  <span className="lc-eyebrow">{card.eyebrow}</span>
                  <h3 className="lc-landing-card-title">
                    {/* Stretched link: the whole card opens the calculator (as before). */}
                    <Link href={withBrandQuery(card.href, brand)} className="lc-landing-card-link">
                      {card.title}
                    </Link>
                  </h3>
                  <p>{card.description}</p>
                  <div className="lc-landing-card-actions">
                    <span className="lc-link-label" aria-hidden="true">
                      {card.linkLabel}
                    </span>
                    {DEMO_CONFIG.showTechnicalTab ? (
                      <Link
                        href={techHref(card.href, brand)}
                        className="lc-landing-card-tech"
                        aria-label={`${card.title}: technical details`}
                      >
                        <CodeIcon />
                        Technical details
                      </Link>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })}

      <p className="lc-footer-note">{chrome.footerNote}</p>
    </main>
  );
}
