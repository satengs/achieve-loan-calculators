"use client";

import Link from "next/link";
import { getSiteContent } from "@loan-calculators/core";
import { withBrandQuery } from "@/lib/brand";
import { useBrand } from "./BrandProvider";

const SITE_URL = "https://loan-calculators-public.vercel.app";

/** Resolve section + title for a calculator slug from the landing registry (site.json) — single source of truth. */
export function breadcrumbFor(slug: string) {
  const site = getSiteContent();
  const card = site.cards.find((c) => c.id === slug || c.href === `/${slug}`);
  const section = card?.section ? site.sections?.find((s) => s.id === card.section) : undefined;
  return { card, section };
}

/**
 * Demo-only page chrome above the calculator (and above the Calculator | Technical details tabs):
 * "← All calculators" back link + `All calculators › Section › Calculator` breadcrumb.
 * Links keep ?brand= but intentionally drop ?tab=tech.
 */
export function CalculatorBreadcrumb({ slug }: { slug: string }) {
  const { brand } = useBrand();
  const { card, section } = breadcrumbFor(slug);
  const home = withBrandQuery("/", brand);
  const title = card?.title ?? slug;

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
