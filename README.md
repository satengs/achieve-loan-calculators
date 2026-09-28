# Loan Calculators (Achieve-styled demos)

Self-contained personal loan, mortgage, and HELOC calculators, plus a life insurance coverage-need estimator, styled to match public Achieve.com visual patterns.

**These are prototypes for UX / product exploration.** Sample rates and defaults are **illustrative only — not offers, quotes, or guarantees of savings or approval.**

## How to open locally

From this directory:

```bash
cd /workspace/loan-calculators
python3 -m http.server 8765
```

Then open:

- Landing: http://localhost:8765/
- Personal loan: http://localhost:8765/personal-loan/
- Mortgage: http://localhost:8765/mortgage/
- HELOC: http://localhost:8765/heloc/
- Life insurance estimator: http://localhost:8765/life-insurance/

Or open any `index.html` directly in a browser (file://). No build step required.

## File map

```
loan-calculators/
  README.md
  index.html             # Static-site landing (links to all calculators)
  shared/
    achieve-tokens.css   # Achieve-inspired CSS variables + shared UI
    calc-utils.js        # Amortization, fee helper, formatting, life estimate
  personal-loan/
    index.html
    styles.css
    app.js
  mortgage/
    index.html
    styles.css
    app.js
  heloc/
    index.html
    styles.css
    app.js
  life-insurance/
    index.html
    styles.css
    app.js
```

## Formulas

### Amortizing monthly payment (personal loan, mortgage P&I, HELOC amortizing)

\[
P = \frac{r(1+r)^n}{(1+r)^n - 1} \times \text{Principal}
\]

Where:

- \(r\) = monthly rate = APR% ÷ 100 ÷ 12  
- \(n\) = number of months  
- If APR = 0%, payment = Principal ÷ n  

Total interest = (monthly payment × n) − principal (with last-payment rounding applied in the schedule helper).

### Personal loan — origination fee

**Default mode in this demo: financed into principal.**

- You enter the amount you want to **receive** (cash).
- Fee% × that amount is computed and **added** to the financed balance.
- Amortization runs on `financedPrincipal = loanAmount + feeAmount`.
- Results label **Cash received** vs **Financed principal** clearly.

*(Public Achieve personal-loan disclosures describe origination fees in the ~1.99%–9.99% range as included in APR / loan balance. This demo does not claim a specific live fee.)*

Alternative mode documented in code (`applyOriginationFee(..., 'upfront')`): fee paid at closing; financed principal unchanged; cash received = principal − fee. UI currently uses **financed**.

### Mortgage — PITI estimate

- P&I from the same amortization formula on **loan amount**.
- Optional monthly property tax + home insurance + HOA are **user-entered estimates**.
- Estimated PITI = P&I + tax + insurance + HOA.
- Does **not** include PMI, closing costs, or escrow true-ups.

### HELOC — equity, draw payment, LTV / CLTV

**Derived credit limit (editable):**

```
creditLimit = max(0, homeValue × (maxCLTV% / 100) − mortgageBalance)
```

Demo default max CLTV = **85%**. Editing home value, mortgage, or max CLTV re-derives the limit unless the user overrides the limit field.

**Interest-only monthly interest on draw:**

```
monthlyInterest = drawAmount × (APR% / 100 / 12)
```

**Amortizing mode:** same amortizing payment formula on `drawAmount` over the selected term (years → months).

**Ratios & equity (simplified demo):**

```
LTV  = mortgageBalance / homeValue
CLTV = (mortgageBalance + drawAmount) / homeValue
grossEquity     = homeValue − mortgageBalance
remainingEquity = homeValue − mortgageBalance − drawAmount
unusedLine      = max(0, creditLimit − drawAmount)
```

APR is labeled **variable-rate, illustrative** — sample / demo only, not an offer. Does not model draw periods vs repayment periods, rate indexes, floors/caps, or fees.

### Life insurance coverage need (illustrative heuristic)

```
grossNeed = (annualIncome × yearsToReplace) + debts + finalExpenses + educationFund
netNeed   = max(0, grossNeed − existingCoverage − liquidAssets)
```

Term length is shown for context only and does **not** change the need math. **Not a quote or premium.**

## Illustrative sample defaults (not offers)

| Calculator | Default | Notes |
|---|---|---|
| Personal loan APR | **11.99%** | Mid-range demo assumption (not a live quote). Public Achieve pages disclose APR ranges (e.g. as low as 6.25% APR for qualified borrowers under limited criteria); we intentionally use a labeled mid demo default rather than presenting the floor as typical. |
| Personal loan amount / term | $15,000 / 36 months | Within common personal-loan ranges |
| Origination fee | 0% | Optional; when set, financed into principal |
| Mortgage APR | **6.50%** | Illustrative mid-single-digit demo rate |
| Mortgage | $400,000 price, 20% down, 30-year | Common planning defaults |
| HELOC APR | **8.50%** | Illustrative variable-rate sample (demo only) |
| HELOC | $450,000 home, $280,000 mortgage, 85% max CLTV, $50,000 draw, interest-only | Derived limit ≈ $102,500 |
| Life insurance | See form defaults | DIME-style heuristic only |

**Do not treat any default as a current Achieve product rate or offer.**

## Known-good QA sample (personal loan)

| Input | Value |
|---|---|
| Principal | $10,000 |
| APR | 10% |
| Term | 36 months |
| Fee | 0% |

**Expected monthly payment ≈ $322.67**  
**Total interest ≈ $1,616.19**  
**Total cost ≈ $11,616.19**

(Verified with `CalcUtils.monthlyPayment` / `amortize`.)

### Mortgage spot-check

$320,000 loan, 6.50% APR, 30 years (360 months) → monthly P&I ≈ **$2,022.62** (rounded to cents).

### HELOC spot-check

Home $450,000, mortgage $280,000, max CLTV 85% → credit limit **$102,500**.  
Draw $50,000 at 8.50% APR interest-only → monthly interest ≈ **$354.17**.  
LTV ≈ **62.22%**; CLTV (after draw) ≈ **73.33%**; remaining equity **$120,000**.

### Life insurance spot-check

Income $75,000 × 10 years + debts $250,000 + final $15,000 + education $50,000 − existing $100,000 − assets $25,000 → **net need $940,000**.

## Visual token sources

Inspected public Achieve pages and CSS (September 2026):

- https://www.achieve.com/ (homepage HTML + inline color values)
- https://www.achieve.com/personal-loans (product messaging / disclosed APR floor language)
- Next.js CSS chunks linked from achieve.com, e.g. `/_next/static/chunks/*.css`

**Captured tokens (in `shared/achieve-tokens.css`):**

| Token | Value | Role |
|---|---|---|
| `--ach-primary` | `#3300FF` | Primary CTA / accent |
| `--ach-primary-hover` | `#2C47F6` | Hover blue |
| `--ach-primary-dark` | `#154199` | Results panel / deep brand |
| `--ach-bg` | `#F8F9FC` | Page background |
| `--ach-bg-tint` | `#EFF5FF` | Soft blue panels |
| `--ach-bg-tint-strong` | `#D2E2FE` | Tint border |
| `--ach-text` | `#1D252F` | Body text |
| `--ach-text-secondary` | `#42546B` | Secondary text |
| `--ach-text-muted` | `#5C708A` | Hints |
| `--ach-border-strong` | `#C0CBD8` | Input borders |
| `--ach-error` | `#CF264E` | Validation |
| Radius | 8px / 12px / 16px | Cards & controls |
| Font | DM Sans (public Google Fonts stand-in for Achieve’s Ultramarine + DM Sans stack) | Typography |

**UX layout patterns** (inputs + results panel + CTA slot) were informed by publicly described calculator-widget template patterns (e.g. Elfsight Calculator Form Widget marketing pages). **No Elfsight code, embeds, scripts, or brand assets are included.**

## Compliance / brand notes

- Achieve loan widgets contain **no FDR settlement claims**.
- No invented “guaranteed savings” or compliance guarantees.
- CTAs are placeholders (preventDefault) — not live applications.
- No secrets in this repo.

## Accessibility

- Labels associated with inputs; `aria-invalid` + alert regions for errors.
- Results panels use `aria-live="polite"`.
- Segmented controls keyboard-focusable; focus rings on inputs/buttons.
- Color contrast aimed at professional dark-on-light forms and white-on-brand results.

## Gaps / follow-ups

- Origination fee UI is financed-only (upfront mode exists in utils but not exposed).
- Mortgage omits PMI, points, and escrow analysis.
- HELOC omits draw vs repayment period split, rate indexes/caps, and HELOC fees.
- Life estimator has no premium table (by design — coverage need only).
- Achieve proprietary Ultramarine webfont is not embedded; DM Sans is the public substitute.
- FDR debt-payoff variant intentionally **not** included per Achieve-first scope.
