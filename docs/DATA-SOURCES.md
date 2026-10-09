# Data sources

All live market inputs come from **FRED** (Federal Reserve Bank of St. Louis), which republishes official series (Freddie Mac PMMS, Federal Reserve G.19 / H.15, FDIC, BLS). They are used only as **default input values**, always labeled “Illustrative only — not an offer or rate quote,” and always editable.

| Rate key | FRED series | Underlying publisher | Frequency | Used by | Transform | Config fallback |
|---|---|---|---|---|---|---|
| `mortgage30` | [MORTGAGE30US](https://fred.stlouisfed.org/series/MORTGAGE30US) | Freddie Mac PMMS | weekly | mortgage, refinance (new rate) | none | mortgage `apr` 6.5; refinance `newRate` 6.5 |
| `mortgage15` | [MORTGAGE15US](https://fred.stlouisfed.org/series/MORTGAGE15US) | Freddie Mac PMMS | weekly | mortgage (when config default term = 15) | none | mortgage `apr` |
| `personalLoan24` | [TERMCBPER24NS](https://fred.stlouisfed.org/series/TERMCBPER24NS) | Federal Reserve G.19 | monthly (~2-mo lag) | personal-loan, loan, consolidation-options | consolidation: + credit-band offsets, clamped | PL 11.99; loan 12; consolidation base 12 |
| `auto48` | [TERMCBAUTO48NS](https://fred.stlouisfed.org/series/TERMCBAUTO48NS) | Federal Reserve G.19 | monthly | car-loan, auto-lease (APR proxy → money factor) | lease: MF = APR/2400 | car-loan 7.5; auto-lease 6 |
| `prime` | [DPRIME](https://fred.stlouisfed.org/series/DPRIME) | Federal Reserve H.15 | daily | heloc, consolidation-options (home equity) | + illustrative margin by credit band | heloc `apr` 8.5 (prime 7.0 + 1.5); consolidation base 7.5 |
| `creditCard` | [TERMCBCCALLNS](https://fred.stlouisfed.org/series/TERMCBCCALLNS) | Federal Reserve G.19 | monthly | debt-payoff, consolidation-options (minimums) | none | 22.77 |
| `savings` | [SNDR](https://fred.stlouisfed.org/series/SNDR) | FDIC national rate (savings) | monthly | savings | none | 0.40 |
| `inflationYoY` | [CPIAUCSL](https://fred.stlouisfed.org/series/CPIAUCSL) | BLS CPI-U | monthly | savings, retirement | YoY % = latest / 12-obs-prior − 1 | 3.0 |

## Endpoints

- **Keyless (default):** `https://fred.stlouisfed.org/graph/fredgraph.csv?id=<SERIES>` — verified working server-side from the build box (Oct 2026). Parsed by `parseFredCsv` (skips blank / `.` values).
- **Official API (optional):** `https://api.stlouisfed.org/fred/series/observations?series_id=<SERIES>&api_key=$FRED_API_KEY&file_type=json&sort_order=desc&limit=30` — used automatically when the env var **`FRED_API_KEY`** is set (Vercel → Project → Settings → Environment Variables). Not currently set; not required.

## Caching & refresh

- `apps/demo/src/lib/rates.ts` → `getMarketRates(keys?)`; each `fetch` uses `{ next: { revalidate: 86400 } }`.
- Calculator pages that use rates are async server components with `export const revalidate = 86400` (daily ISR). The build prerenders with current values; Vercel regenerates at most once per day.
- `GET /api/rates` returns `{ rates: { [key]: { value, asOf, source, sourceUrl, seriesId } }, errors, mode: "fred-csv" | "fred-api", fetchedAt }`, cached `s-maxage=86400`.

## Fallback behavior

If a series errors or returns no data, its key is omitted. The package's `resolveRate()` then returns the config default with `isFallback: true`, and `RateNote` shows: “Default … is an illustrative fallback from config (live data unavailable).”

## No live source (by design)

| Calculator | Why | What we do |
|---|---|---|
| Car insurance, Home insurance | No free/public real-time quote API; published averages vary by methodology and we did not find a keyless, citable series to fetch. | Transparent factor tables in `config/*.config.json` (`features.factors`), labeled “rough estimate — not a quote.” No averages are claimed. |
| Life insurance premium | No public premium API. | Illustrative rate-per-$1,000 table in config, labeled not a quote. |
| Student loan | Federal rates are set annually by statute (studentaid.gov), not published as a FRED series; private rates vary. | Config default 6.5% with a “no keyless public data series is wired” note. |
| Retirement expected return | Forecasts are not data. | Editable illustrative assumption (6%). |
| DTI, Budget | User-entered only. | — |
| Debt-resolution program cost | Achieve/FDR median offers come from a private API (`/api/achieve-tools/debt-assessment`). | Editable illustrative cost % / length; never presented as provider results. |
