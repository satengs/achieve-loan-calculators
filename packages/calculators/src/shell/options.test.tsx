import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { CalculatorShell } from "../components/CalculatorShell";
import { CALCULATOR_PROP_DEFAULTS, resolveCalculatorOptions, sectionHeadingTag } from "./options";
import { CALCS } from "./fixtures";
import { getCalculatorContent, type CalculatorId } from "../content/load";

const html = (Component: (typeof CALCS)[number]["Component"], props: Record<string, unknown> = {}) =>
  renderToStaticMarkup(createElement(Component, { projectName: "achieve", ...props }));

/** Attributes of the <input> rendered with this id. */
function inputTag(markup: string, id: string): string {
  const m = markup.match(new RegExp(`<input[^>]*\\bid="${id}"[^>]*>`));
  assert.ok(m, `input #${id} not rendered`);
  return m[0];
}

describe("shared prop defaults", () => {
  it("resolves v1 defaults and ignores undefined overrides", () => {
    const r = resolveCalculatorOptions("loan", { showHeader: undefined, variant: "compact" });
    assert.equal(r.showHeader, true);
    assert.equal(r.showDemoBanner, false);
    assert.equal(r.showBreakdown, true);
    assert.equal(r.showCta, true);
    assert.equal(r.showDisclaimer, true);
    assert.equal(r.headingLevel, "h2");
    assert.equal(r.variant, "compact");
    assert.equal(r.calculator, "loan");
    assert.equal(CALCULATOR_PROP_DEFAULTS.showDemoBanner, false);
  });

  it("maps section headings one level below the title", () => {
    assert.equal(sectionHeadingTag("h1"), "h2");
    assert.equal(sectionHeadingTag("h2"), "h3");
    assert.equal(sectionHeadingTag("h3"), "h4");
    assert.equal(sectionHeadingTag("div"), "h3");
  });

  it("CalculatorShell keeps the legacy explicit-copy props working", () => {
    const out = renderToStaticMarkup(
      createElement(CalculatorShell, {
        projectName: "fdr",
        eyebrow: "E",
        title: "Legacy title",
        intro: "Legacy intro",
        banner: { strong: "Demo", body: "Body" },
        footerNote: "Legal note.",
        options: { showDemoBanner: true },
        children: null,
      }),
    );
    assert.match(out, /<h2 class="lc-title">Legacy title<\/h2>/);
    assert.match(out, /Legacy intro/);
    assert.match(out, /lc-demo-banner/);
    assert.match(out, /Legal note\./);
  });
});

describe("unified config props (all 19 calculators)", () => {
  it("covers every exported calculator", () => {
    assert.equal(CALCS.length, 19);
  });

  for (const calc of CALCS) {
    const content = getCalculatorContent(calc.id as CalculatorId);

    it(`${calc.name}: package defaults — h2 title, no demo banner, header/CTA/disclaimer on, full variant`, () => {
      const out = html(calc.Component);
      assert.match(out, /<h2 class="lc-title">/);
      assert.doesNotMatch(out, /<h1/);
      assert.doesNotMatch(out, /lc-demo-banner/);
      assert.doesNotMatch(out, /Placeholder CTA/);
      if (content.footer.demoNote) assert.ok(!out.includes(content.footer.demoNote), "demo footer line hidden");
      // CSS targets section headings as direct children of the form / results cards.
      assert.match(out, /class="lc-card lc-form"[^>]*><h3 class="lc-section-heading/);
      assert.match(out, /class="lc-card lc-results[^"]*"[^>]*><h3 class="lc-section-heading/);
      assert.match(out, /class="lc-header"/);
      assert.match(out, /class="lc-cta"/);
      assert.match(out, /class="lc-footer-note"/);
      assert.match(out, /class="lc-page" data-variant="full"/);
      assert.match(out, new RegExp(`data-calculator="${calc.id}"`));
      // Section headings sit one level below the h2 title.
      assert.match(out, /<h3 class="lc-section-heading/);
      assert.doesNotMatch(out, /<h2 class="lc-section-heading/);
    });

    it(`${calc.name}: showDemoBanner shows the demo banner and demo-only notes`, () => {
      const out = html(calc.Component, { showDemoBanner: true });
      assert.match(out, /lc-demo-banner/);
      if (content.cta.demoNote) assert.ok(out.includes(content.cta.demoNote.slice(0, 20)), "placeholder CTA note");
      if (content.footer.demoNote) assert.ok(out.includes(content.footer.demoNote), "demo footer line");
    });

    it(`${calc.name}: showHeader / title / subtitle / headingLevel`, () => {
      assert.doesNotMatch(html(calc.Component, { showHeader: false }), /lc-header/);
      const custom = html(calc.Component, { title: "Host title", subtitle: "Host subtitle", headingLevel: "h3" });
      assert.match(custom, /<h3 class="lc-title">Host title<\/h3>/);
      assert.match(custom, /<p>Host subtitle<\/p>/);
      assert.match(custom, /<h4 class="lc-section-heading/);
      const asDiv = html(calc.Component, { headingLevel: "div" });
      assert.match(asDiv, /<div class="lc-title">/);
      assert.match(asDiv, /<h3 class="lc-section-heading/);
      assert.match(html(calc.Component, { headingLevel: "h1" }), /<h1 class="lc-title">/);
    });

    it(`${calc.name}: showCta / ctaLabel / ctaHref`, () => {
      assert.doesNotMatch(html(calc.Component, { showCta: false }), /class="lc-cta"/);
      const out = html(calc.Component, { ctaLabel: "Host CTA", ctaHref: "/apply?src=calc", showDemoBanner: true });
      assert.match(out, /<a class="lc-btn" href="\/apply\?src=calc" role="button">Host CTA<\/a>/);
      assert.doesNotMatch(out, /Placeholder CTA/, "host href drops the placeholder note");
      const unsafe = html(calc.Component, { ctaHref: "javascript:alert(1)" });
      assert.match(unsafe, /class="lc-btn" href="#"/);
    });

    it(`${calc.name}: showDisclaimer hides the legal footnote`, () => {
      const out = html(calc.Component, { showDisclaimer: false });
      assert.doesNotMatch(out, /lc-footer-note/);
      if (content.cta.note) assert.ok(!out.includes(content.cta.note.slice(0, 30)), "CTA disclosure hidden");
    });

    it(`${calc.name}: showBreakdown={false} hides breakdown sections`, () => {
      const on = html(calc.Component);
      const off = html(calc.Component, { showBreakdown: false });
      if (calc.breakdown) {
        assert.match(on, calc.breakdown);
        assert.doesNotMatch(off, calc.breakdown);
      } else {
        assert.equal(off, on, "no breakdown section: markup unchanged");
      }
    });

    it(`${calc.name}: defaults prefill the initial inputs`, () => {
      const out = html(calc.Component, { defaults: { [calc.prefill.key]: 12345 } });
      assert.match(inputTag(out, calc.prefill.inputId), /value="12345"/);
    });

    it(`${calc.name}: variant="compact"`, () => {
      const out = html(calc.Component, { variant: "compact" });
      assert.match(out, /class="lc-page lc-page--compact" data-variant="compact"/);
    });
  }
});

describe("defaults precedence", () => {
  const live = { personalLoan24: { value: 12.34, asOf: "2026-08-01", source: "FRED", seriesId: "X", sourceUrl: "https://fred.stlouisfed.org/series/X" } };
  it("host defaults win over live-rate defaults", () => {
    const loan = CALCS.find((c) => c.name === "LoanCalculator")!;
    const withLive = html(loan.Component, { rates: live });
    assert.match(inputTag(withLive, "ln-apr"), /value="12.34"/);
    const host = html(loan.Component, { rates: live, defaults: { apr: 9.87 } });
    assert.match(inputTag(host, "ln-apr"), /value="9.87"/);
    const pl = CALCS.find((c) => c.name === "PersonalLoanCalculator")!;
    assert.match(inputTag(html(pl.Component, { rates: live, defaults: { apr: 7.5 } }), "apr"), /value="7.5"/);
  });

  it("non-numeric defaults (selects / modes / debt lists) are honored", () => {
    const refi = CALCS.find((c) => c.name === "RefinanceCalculator")!;
    assert.match(html(refi.Component, { defaults: { rollCosts: "roll" } }), /checked="" value="roll"/);
    const snow = CALCS.find((c) => c.name === "DebtSnowballAvalancheCalculator")!;
    const out = html(snow.Component, { defaults: { debts: [{ name: "Host card", balance: 2222, apr: 20, minPayment: 60 }] } });
    assert.match(out, /value="Host card"/);
    assert.match(out, /value="2222"/);
  });

  it("mortgage derives the loan amount from a host home price", () => {
    const m = CALCS.find((c) => c.name === "MortgageCalculator")!;
    const out = html(m.Component, { defaults: { homePrice: 500000, downPayment: 20 } });
    assert.match(inputTag(out, "loan-amount"), /value="400000"/);
    const explicit = html(m.Component, { defaults: { homePrice: 500000, loanAmount: 300000 } });
    assert.match(inputTag(explicit, "loan-amount"), /value="300000"/);
  });
});
