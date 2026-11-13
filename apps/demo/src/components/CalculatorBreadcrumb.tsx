"use client";

import Link from "next/link";
import { getSiteContent } from "@loan-calculators/core";
import { withBrandQuery } from "@/lib/brand";
import { useBrand } from "./BrandProvider";

const SITE_URL = "https://loan-calculators-public.vercel.app";

/** SEO alias routes that share a landing card but want their own crumb title. */
const BREADCRUMB_ALIASES: Record<string, { cardId: string; title: string }> = {
  "debt-snowball": { cardId: "debt-snowball-avalanche", title: "Debt snowball calculator" },
  "debt-avalanche": { cardId: "debt-snowball-avalanche", title: "Debt avalanche calculator" },
};

/** Resolve section + title for a calculator slug from the landing registry (site.json) — single source of truth. */
export function breadcrumbFor(slug: string) {
  const site = getSiteContent();
  const alias = BREADCRUMB_ALIASES[slug];
  const resolved = alias?.cardId ?? slug;
  const card = site.cards.find((c) => c.id === resolved || c.href === `/${resolved}` || c.id === slug || c.href === `/${slug}`);
  const section = card?.section ? site.sections?.find((s) => s.id === card.section) : undefined;
  const title = alias?.title ?? card?.title ?? slug;
  return { card, section, title };
}

/**
 * Demo-only page chrome above the calculator (and above the Calculator | Technical details tabs):
 * "← All calculators" back link + `All calculators › Section › Calculator` breadcrumb.
 * Links keep ?brand= but intentionally drop ?tab=tech.
 */
export function CalculatorBreadcrumb({ slug }: { slug: string }) {
  const { brand } = useBrand();
  const { card, section, title } = breadcrumbFor(slug);
  const home = withBrandQuery("/", brand);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "All calculators", item: `${SITE_URL}/` },
      ...(section ? [{ "@type": "ListItem", position: 2, name: section.title, item: `${SITE_URL}/#${section.id}` }] : []),
      { "@type": "ListItem", position: section ? 3 : 2, name: title, item: `${SITE_URL}/${slug}` },
    ],
  };

  return (
    <div className="lc-crumbs-bar">
      <div className="lc-crumbs-inner">
        <nav aria-label="Breadcrumb" className="lc-crumbs">
          <ol>
            <li className="lc-crumb-home">
              <Link href={home}>All calculators</Link>
            </li>
            {section ? (
              <li>
                <Link href={withBrandQuery(`/#${section.id}`, brand)}>{section.title}</Link>
              </li>
            ) : null}
            <li>
              <span aria-current="page">{title}</span>
            </li>
          </ol>
        </nav>
        <Link href={home} className="lc-back-link">
          <span aria-hidden="true">←</span> All calculators
        </Link>
      </div>
      <script
        type="application/ld+json"
        // Static data from our own site.json; "<" escaped so it can't close the script tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
    </div>
  );
}
