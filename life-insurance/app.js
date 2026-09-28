(function () {
  'use strict';

  const { lifeCoverageEstimate, formatCurrency, validateRange } = window.CalcUtils;

  const fields = [
    { id: 'annual-income', err: 'income-error', opts: { min: 0, max: 1e8, label: 'Annual income', allowZero: true } },
    { id: 'years-replace', err: 'years-error', opts: { min: 0, max: 50, label: 'Years to replace', allowZero: true } },
    { id: 'total-debts', err: 'debts-error', opts: { min: 0, max: 1e9, label: 'Total debts', allowZero: true } },
    { id: 'final-expenses', err: 'final-error', opts: { min: 0, max: 1e7, label: 'Final expenses', allowZero: true } },
    { id: 'education-fund', err: 'edu-error', opts: { min: 0, max: 1e8, label: 'Education fund', allowZero: true } },
    { id: 'existing-coverage', err: 'exist-error', opts: { min: 0, max: 1e9, label: 'Existing coverage', allowZero: true } },
    { id: 'liquid-assets', err: 'assets-error', opts: { min: 0, max: 1e9, label: 'Liquid assets', allowZero: true } },
  ];

  const out = {
    net: document.getElementById('out-net'),
    gross: document.getElementById('out-gross'),
    income: document.getElementById('out-income'),
    debts: document.getElementById('out-debts'),
    offset: document.getElementById('out-offset'),
    final: document.getElementById('out-final'),
    edu: document.getElementById('out-edu'),
    term: document.getElementById('out-term'),
    msg: document.getElementById('results-message'),
  };

  function calculate() {
    const values = {};
    let ok = true;
    fields.forEach(({ id, err, opts }) => {
      const input = document.getElementById(id);
      const errEl = document.getElementById(err);
      const v = validateRange(input.value, opts);
      input.setAttribute('aria-invalid', v.ok ? 'false' : 'true');
      errEl.textContent = v.ok ? '' : v.message;
      if (!v.ok) ok = false;
      values[id] = v.value;
    });

    if (!ok) {
      Object.keys(out).forEach((k) => {
        if (k !== 'msg') out[k].textContent = '—';
      });
      out.msg.textContent = 'Fix the highlighted fields to see an estimate.';
      return;
    }

    const termEl = document.querySelector('input[name="term-years"]:checked');
    const termYears = termEl ? Number(termEl.value) : 20;

    const est = lifeCoverageEstimate({
      annualIncome: values['annual-income'],
      yearsIncomeReplace: values['years-replace'],
      totalDebts: values['total-debts'],
      finalExpenses: values['final-expenses'],
      educationFund: values['education-fund'],
      existingCoverage: values['existing-coverage'],
      liquidAssets: values['liquid-assets'],
    });

    out.net.textContent = formatCurrency(est.netNeed, { maximumFractionDigits: 0, minimumFractionDigits: 0 });
    out.gross.textContent = formatCurrency(est.grossNeed, { maximumFractionDigits: 0, minimumFractionDigits: 0 });
    out.income.textContent = formatCurrency(est.incomeNeed, { maximumFractionDigits: 0, minimumFractionDigits: 0 });
    out.debts.textContent = formatCurrency(est.debts, { maximumFractionDigits: 0, minimumFractionDigits: 0 });
    out.offset.textContent = formatCurrency(est.existing + est.assets, { maximumFractionDigits: 0, minimumFractionDigits: 0 });
    out.final.textContent = formatCurrency(est.finals, { maximumFractionDigits: 0, minimumFractionDigits: 0 });
    out.edu.textContent = formatCurrency(est.education, { maximumFractionDigits: 0, minimumFractionDigits: 0 });
    out.term.textContent = termYears + ' years';
    out.msg.textContent =
      'Heuristic only. Rounded for readability. Not a premium quote or guarantee of coverage.';
  }

  document.querySelector('.ach-form').addEventListener('input', calculate);
  document.querySelector('.ach-form').addEventListener('change', calculate);
  document.getElementById('cta-primary').addEventListener('click', (e) => e.preventDefault());
  calculate();
})();
