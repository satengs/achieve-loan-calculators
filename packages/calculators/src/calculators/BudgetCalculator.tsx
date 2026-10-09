"use client";

import { useMemo } from "react";
import { budgetSummary, type BudgetCategory } from "../calc";
import { resolveProjectName, type ProjectName } from "../brand/types";
import { CalculatorShell } from "../components/CalculatorShell";
import { DataTable } from "../components/DataTable";
import { Fieldset } from "../components/Field";
import { MoreOptions } from "../components/MoreOptions";
import { ResultsPanel } from "../components/ResultsPanel";
import { CalculatorCta, pct, useCalculatorSetup } from "./common";
import { NumberFields, useNumberInputs } from "./useNumberInputs";
import { PLACEHOLDER } from "./utils";

export type BudgetCalculatorProps = { projectName?: ProjectName | string };

const CATS: BudgetCategory[] = ["needs", "wants", "savings"];

export function BudgetCalculator({ projectName = "achieve" }: BudgetCalculatorProps) {
  const brand = resolveProjectName(projectName);
  const { content, config, whole, fields, results, labels, features } = useCalculatorSetup("budget");
  const categories = features.categories as Record<BudgetCategory, string[]>;
  const targets = features.targets as Record<BudgetCategory, number>;
  const keys = useMemo(() => ["netIncome", "otherIncome", ...CATS.flatMap((c) => categories[c])], [categories]);
  const inputs = useNumberInputs(config, keys);
  const sections = (content.sections || {}) as Record<string, string>;
  const table = (content.table || {}) as Record<string, any>;

  const computed = useMemo(() => {
    if (!inputs.ok) return null;
    const v = inputs.values;
    return budgetSummary(
      [v.netIncome, v.otherIncome],
      CATS.flatMap((c) => categories[c].map((k) => ({ key: k, amount: v[k], category: c }))),
      targets,
    );
  }, [inputs.ok, inputs.values, categories, targets]);

  return (
    <CalculatorShell projectName={brand} eyebrow={content.header.eyebrow} title={content.header.title} intro={content.header.intro} banner={content.demoBanner} footerNote={content.footer.note}>
      <div className="lc-layout">
        <section className="lc-card lc-form">
          <h2>{content.form.heading}</h2>
          <Fieldset legend={sections.income}>
            <NumberFields idPrefix="bd" keys={["netIncome", "otherIncome"]} fields={fields} inputs={inputs} />
          </Fieldset>
          <Fieldset legend={sections.needs}>
            <NumberFields idPrefix="bd" keys={categories.needs} fields={fields} inputs={inputs} />
          </Fieldset>
          <MoreOptions>
            <Fieldset legend={sections.wants}>
              <NumberFields idPrefix="bd" keys={categories.wants} fields={fields} inputs={inputs} />
            </Fieldset>
            <Fieldset legend={sections.savings}>
              <NumberFields idPrefix="bd" keys={categories.savings} fields={fields} inputs={inputs} />
            </Fieldset>
          </MoreOptions>
        </section>
        <ResultsPanel
          heading={String(results.heading)}
          primaryLabel={String(results.primaryLabel)}
          primaryValue={computed ? whole(computed.leftover) : PLACEHOLDER}
          items={[
            { label: labels.income, value: computed ? whole(computed.totalIncome) : PLACEHOLDER },
            { label: labels.needs, value: computed ? `${whole(computed.byCat.needs)} · ${pct(computed.pctOfIncome.needs, 0)}` : PLACEHOLDER },
            { label: labels.wants, value: computed ? `${whole(computed.byCat.wants)} · ${pct(computed.pctOfIncome.wants, 0)}` : PLACEHOLDER },
            { label: labels.savings, value: computed ? `${whole(computed.byCat.savings)} · ${pct(computed.pctOfIncome.savings, 0)}` : PLACEHOLDER },
          ]}
          summary={
            computed
              ? [
                  { label: labels.outflow, value: whole(computed.totalOutflow) },
                  { label: labels.savingsRate, value: pct(computed.savingsRate, 0) },
                ]
              : []
          }
          message={
            !computed ? String(results.invalidMessage) : computed.leftover < 0 ? `${results.overBudget} ${results.summaryMessage}` : String(results.summaryMessage)
          }
          cta={<CalculatorCta id="budget" />}
        />
      </div>
      <div className="lc-card lc-amort-card">
        <h2>{table.heading}</h2>
        <DataTable
          caption={table.heading}
          columns={table.columns || []}
          rows={
            computed
              ? CATS.map((c) => [sections[c], whole(computed.byCat[c]), pct(computed.pctOfIncome[c], 0), `${targets[c]}%`, whole(computed.targetAmounts[c])])
              : []
          }
          emptyText={String(results.invalidMessage)}
        />
      </div>
    </CalculatorShell>
  );
}
