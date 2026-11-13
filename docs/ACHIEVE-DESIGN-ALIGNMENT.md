# Achieve design alignment

How the **Achieve** brand variant of these calculators is aligned with the live tools on achieve.com. FDR and bills are unchanged: every visual/structural treatment below is gated on `[data-project="achieve"]` or `brand === "achieve"`.

This is a pattern reference for our implementation, **not** an approved Achieve.com design (Amanda, Nov 2026: no approved Achieve design yet; “leverage some of the existing tool designs we have on Achieve.com already”). Tokens were already sourced from achieve.com; this document records **layout and presentation** patterns.

We do not copy Achieve image assets, licensed font files (Ultramarine), logos, or proprietary illustration. Question-style labels are ordinary English prompts, written in our CMS content. Results stay live-updating (an improvement over the live tools’ “Calculate” gate).

## Source pages (fetched 13 Nov 2026)

| Tool | URL | What we used |
|---|---|---|
| HELOC payment calculator | https://www.achieve.com/tools/heloc-payment-calculator | Primary layout pattern: tinted form card, question labels, two-column form + results, sentence empty-state, `#3300FF` Calculate / Get started CTA |
| Debt-to-income calculator | https://www.achieve.com/tools/debt-income-ratio-calculator | Same two-column structure; results are a semicircle band gauge with a pill eyebrow and three range labels |
| Debt payoff calculator | https://www.achieve.com/tools/debt-payoff-calculator | Title-divider (uppercase eyebrow + benefit headline). The interactive `DebtAssessmentSection` is client-rendered (skeleton CSS only in the SSR HTML); we take the sentence-headline “save / pay off in …” pattern, not their computed marketing figure |
| GOOD app (marketing) | https://www.achieve.com/good-app | Visual language only: purple CTAs, benefit cards, sentence headlines, light blue tints — not a calculator |
| Rocket Mortgage calculators (UX ideas only) | https://www.rocketmortgage.com/calculators | **Ideas only.** Do not copy Rocket code, assets, or copy. See below. |

Public HTML/CSS inspected from the live Next.js documents and their CSS bundles (`/_next/static/chunks/0-bh8psd74b68.css`, `1lf7hwj61j6kl.css`, deploy id `8ad1231-a1c3bfca`).

## Layout pattern (HELOC + DTI)

### Page intro

- Centered **eyebrow**: small, bold, uppercase, letter-spacing `0.25em`, color `#5C708A` (`textMuted`). HELOC: `bodySm font-bold … text-[#5c708a] tracking-[0.25em] uppercase`. DTI: `labelOverline` at `#42546B` (`textSecondary`).
- Centered **title**: `1.5rem` / `130%` leading on small screens; `32px` / `120%` / `tracking: -0.01em` from the `lg` breakpoint; `font-weight: 500` (MUI “normal” / `headingLg`); `text-balance`; charcoal `#1D252F`, not brand purple.
- Optional subtitle or intro under the title, centered, limited measure.

### Two-column shell

- `flex-col` on small screens, `lg:flex-row` on desktop: **form on the left, results on the right**.
- HELOC form is about `lg:max-w-[35%]`; DTI form is `min-w-[50%]`. Results sit beside, vertically centered or top-aligned.
- On HELOC, the empty results card is `hidden` on small screens (`hidden lg:block`) until there is something to show. **We keep our mobile estimate-first sticky bar** (an accessibility and CLS improvement) and do not hide results on mobile.
- Results update only after **Calculate** on the live tools. **We keep live estimates** as the user types.

### Form card (HELOC)

```
background: #EFF5FF;          /* --lc-bg-tint, already a token */
border: 2px solid #D2E2FE;    /* --lc-border-accent (new optional token) */
border-radius: 10px;
padding: 1rem;                /* p-4 */
gap between fields: 1rem;     /* gap-4 */
gap label → input: 0.5rem;    /* gap-2 */
```

DTI’s form sits on a white page background (no tinted card) with the same question-label + white text-input pattern; we use the HELOC tinted card as the shared Achieve form treatment so every calculator feels like one tool kit.

### Inputs

- **Question-style labels**, bold (`bodyMd font-bold`), full sentence: “What’s your home’s current value?”, “What is your monthly gross income?”
- Optional info (`i`) icon next to the label (tooltip). We surface the same content as visible hint text under the field, which is more reliable for keyboard and screen-reader users.
- White text inputs, 8px radius, placeholder “Enter amount” / an example figure. MUI `Ascend-textField-root`, `bg-white`.
- Selects (credit score, state) on a white fill, same radius.
- HELOC field order on the live tool: home value, mortgage balance, desired loan amount, credit score, state. We do not add a state field (we don’t rate by geography). For Achieve only, mortgage balance is promoted out of “More options” onto the main form.

### CTA

Live Calculate / Get started (extracted from the HELOC markup):

```
background: #3300FF;       /* --lc-primary / --lc-cta */
hover:     #154199;        /* --lc-primary-dark; set as Achieve --lc-cta-hover */
color:     #F8F9FC;
border-radius: 8px;
font-weight: 700;
font-size: 18px;
min-height: 48px;          /* min-h-12, py-2 px-6 */
width: 100% inside the form
```

White on `#3300FF` and on `#154199` both exceed WCAG AA (and AAA) for text. We already use a full-width brand CTA in the results card (placeholder, not a live application).

### Results card (HELOC)

```
background: #FFFFFF;
border: 2px solid #D2E2FE;
border-radius: 10px;
```

Empty state: a sentence headline (“Use the HELOC calculator to check how much you could borrow”) plus a short instructional paragraph. After calculate: payment / borrowing-power figures (client-rendered; we did not copy illustrations).

Our Achieve results use the shared `PresentationResults` primitive (sentence headline with an emphasized figure, `MicroStats`, optional chart, `TipCallout`, CTA) on a **white** card with the same blue border — form is tinted, results are not.

### DTI results

- Container: `1px solid #C0CBD8`, `rounded-md`, reserved min-height `250px`, width up to `520px`.
- Pill eyebrow: “Your estimated DTI ratio”, `color: #154199`, `background: #F5F9FF`, bold, padded, rounded.
- Semicircle **gauge** with three painted bands and a needle:
  - ≤35% — “or less is good”
  - 36–43% — “needs work”
  - ≥44% — “or more is high”
- Band colors on the live tool: mint `#75D1AF`, amber `#FBCB5B`, error `#CF264E` (the last is already our `--lc-error` token). We draw our own SVG (stroke arcs, not their path data) with semantic green / amber / error fills.
- Our math already uses these thresholds (`dtiBand(pct, 35, 43)`); FAQ copy on the same page uses slightly different bands (36 / 37–49 / 50+) — we follow the **on-tool gauge**, which is what users see.

### Disclosures

Educational copy, key takeaways, and FAQ accordions sit **below** the tool, not inside the results card. Rates and estimates are illustrative; we do not invent compliance claims. Our footer note and demo banner stay.

### Typography and color (already in tokens, with two updates)

| Role | Value | Source |
|---|---|---|
| Primary / CTA fill | `#3300FF` | Calculate / Get started `bg-[#3300FF]` |
| CTA hover | `#154199` | `hover:bg-[#154199]` (now `--lc-cta-hover`) |
| Navy (values, pill text) | `#154199` | DTI pill; HELOC “Get a low, fixed rate” section |
| Page background | `#F8F9FC` | section default / `#F8F9FC` |
| Tint | `#EFF5FF` | form card; `bgPrimaryHighlightBlue` |
| Soft blue 25 | `#F5F9FF` | DTI pill, `blue25` |
| Accent border | `#D2E2FE` | form and results `border-[#D2E2FE]`; `blue100` |
| Text | `#1D252F` | body; now also `--lc-heading` for titles |
| Secondary | `#42546B` | DTI eyebrow |
| Muted / HELOC eyebrow | `#5C708A` | `text-[#5c708a]` |
| Strong border (DTI results) | `#C0CBD8` | already `--lc-border-strong` |
| Error | `#CF264E` | already a token; DTI high band |
| Radius (cards) | `10px` | form/results `rounded-[10px]` |
| Radius (buttons, inputs) | `8px` | `rounded-[8px]` / `rounded-md` |
| Font on achieve.com | Ultramarine (licensed, not redistributable) | we keep **DM Sans**, already the Achieve token |

`#5C708A` on `#F8F9FC` is about 4.7:1 (AA for small text). Navy `#154199` on `#F5F9FF` is well above AA.

## Debt payoff & GOOD app

The debt-payoff URL is a title-divider (eyebrow “Debt Payoff Calculator”, benefit H2 “Save an estimated $N on your monthly payment”) plus long-form education. The interactive assessment is hydrated on the client; the SSR payload includes a loading-skeleton stylesheet only. Our Achieve debt-payoff results therefore use a **computed sentence headline** (payoff time and interest saved from *our* math) on `PresentationResults`, plus slider-row inputs from the retirement presentation primitives — not Achieve’s dollar figure or marketing body.

GOOD app is a product marketing page (purple CTA, feature cards, “Get Out Of Debt faster”). We borrow only the tone of sentence headlines and light-blue callouts.

## Rocket Mortgage — UX ideas only

[https://www.rocketmortgage.com/calculators](https://www.rocketmortgage.com/calculators) (fetched 13 Nov 2026; the index is a grouped catalog plus a “Not sure which calculator to use?” quiz). Worth borrowing as **ideas**, never as implementation:

- Group the catalog by goal (buying, current home, military-specific) rather than a flat list. Our landing already sections tools (Debt & loans, Home & mortgage, …) — keep that.
- A short “great for…” line on each card, which we already have as `description`.
- An optional guided “which tool should I use?” chooser — not built here; would be a later product decision.
- Do **not** copy Rocket’s quiz copy, card art, branding, or calculator UI.

## What we implemented

Shared, Achieve-gated:

- `[data-project="achieve"]` chrome: centered eyebrow/title, tinted form card, white blue-bordered results, 18px bold CTA, charcoal headings, blue tip callout.
- `ResultsPanel` `variant="presentation"` (Achieve only) reuses `PresentationResults`, `MicroStats`, and `TipCallout`.
- Optional CMS `question` strings, shown only when `brand === "achieve"`.
- `DtiGauge` on the Achieve DTI results card.
- HELOC: mortgage balance on the main Achieve form.
- Debt payoff and other slider tools: `SliderField` `layout="row"` on Achieve, reusing the retirement primitive.

FDR and bills keep the previous `ResultsPanel` default, stacked sliders, short labels, and their own `[data-project="fdr"|"bills"]` CSS.

## Out of scope / not copied

- Achieve photography, spot illustrations, logo, Trustpilot blocks, or Ultramarine font files.
- “Calculate” as a required click (we stay live).
- A US-state field or credit-based pricing engine.
- Rocket Mortgage UI or copy.
- Elfsight (removed from public copy; stays gone).
