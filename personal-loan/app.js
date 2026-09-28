(function () {
  'use strict';

  const { amortize, applyOriginationFee, formatCurrency, validateRange, parseNumber } = window.CalcUtils;

  const els = {
    amount: document.getElementById('loan-amount'),
    apr: document.getElementById('apr'),
    termValue: document.getElementById('term-value'),
    termUnit: () => document.querySelector('input[name="term-unit"]:checked'),
    fee: document.getElementById('origination-fee'),
    amountErr: document.getElementById('loan-amount-error'),
    aprErr: document.getElementById('apr-error'),
    termErr: document.getElementById('term-error'),
    feeErr: document.getElementById('fee-error'),
    outMonthly: document.getElementById('out-monthly'),
    outInterest: document.getElementById('out-interest'),
    outTotal: document.getElementById('out-total'),
    outFinanced: document.getElementById('out-financed'),
    outCash: document.getElementById('out-cash'),
    outFirst: document.getElementById('out-first'),
    outLast: document.getElementById('out-last'),
    outFeeAmt: document.getElementById('out-fee-amt'),
    amortSummary: document.getElementById('amort-summary'),
    resultsMsg: document.getElementById('results-message'),
    amortBody: document.getElementById('amort-body'),
    cta: document.getElementById('cta-primary'),
  };

  function setInvalid(input, errEl, message) {
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
    errEl.textContent = message || '';
  }

  function clearResults(message) {
    els.outMonthly.textContent = '—';
    els.outInterest.textContent = '—';
    els.outTotal.textContent = '—';
    els.outFinanced.textContent = '—';
    els.outCash.textContent = '—';
    els.amortSummary.hidden = true;
    els.resultsMsg.textContent = message || '';
    els.amortBody.innerHTML = '<tr><td colspan="5">Enter valid inputs to see schedule.</td></tr>';
  }

  function termMonths() {
    const unit = els.termUnit().value;
    const raw = parseNumber(els.termValue.value);
    if (!isFinite(raw) || raw <= 0) return NaN;
    return unit === 'years' ? Math.round(raw * 12) : Math.round(raw);
  }

  function renderSchedule(schedule) {
    if (!schedule || !schedule.length) {
      els.amortBody.innerHTML = '<tr><td colspan="5">No schedule.</td></tr>';
      return;
    }
    const rows = [];
    const take = schedule.slice(0, 3);
    take.forEach((row) => {
      rows.push(rowHtml(row));
    });
    if (schedule.length > 4) {
      rows.push('<tr><td colspan="5" style="text-align:center;color:var(--ach-text-muted)">…</td></tr>');
    }
    if (schedule.length > 3) {
      rows.push(rowHtml(schedule[schedule.length - 1]));
    }
    els.amortBody.innerHTML = rows.join('');
  }

  function rowHtml(row) {
    return (
      '<tr>' +
      '<td>' + row.month + '</td>' +
      '<td>' + formatCurrency(row.payment) + '</td>' +
      '<td>' + formatCurrency(row.principal) + '</td>' +
      '<td>' + formatCurrency(row.interest) + '</td>' +
      '<td>' + formatCurrency(row.balance) + '</td>' +
      '</tr>'
    );
  }

  function calculate() {
    const amountV = validateRange(els.amount.value, { min: 1, max: 1000000, label: 'Loan amount' });
    const aprV = validateRange(els.apr.value, { min: 0, max: 100, label: 'APR', allowZero: true });
    const feeV = validateRange(els.fee.value, { min: 0, max: 100, label: 'Origination fee', allowZero: true });
    const months = termMonths();

    setInvalid(els.amount, els.amountErr, amountV.ok ? '' : amountV.message);
    setInvalid(els.apr, els.aprErr, aprV.ok ? '' : aprV.message);
    setInvalid(els.fee, els.feeErr, feeV.ok ? '' : feeV.message);

    let termMsg = '';
    if (!isFinite(months) || months < 1) {
      termMsg = 'Term must be at least 1 month.';
    } else if (months > 480) {
      termMsg = 'Term must be at most 480 months.';
    }
    setInvalid(els.termValue, els.termErr, termMsg);

    if (!amountV.ok || !aprV.ok || !feeV.ok || termMsg) {
      clearResults('Fix the highlighted fields to see an estimate.');
      return;
    }

    const feeInfo = applyOriginationFee(amountV.value, feeV.value, 'financed');
    const result = amortize(feeInfo.financedPrincipal, aprV.value, months);

    if (!result) {
      clearResults('Unable to calculate with these inputs.');
      return;
    }

    els.outMonthly.textContent = formatCurrency(result.payment);
    els.outInterest.textContent = formatCurrency(result.totalInterest);
    els.outTotal.textContent = formatCurrency(result.totalPaid);
    els.outFinanced.textContent = formatCurrency(feeInfo.financedPrincipal);
    els.outCash.textContent = formatCurrency(feeInfo.cashReceived);
    els.amortSummary.hidden = false;

    if (result.firstPayment) {
      els.outFirst.textContent =
        formatCurrency(result.firstPayment.principal) + ' / ' + formatCurrency(result.firstPayment.interest);
    }
    if (result.lastPayment) {
      els.outLast.textContent =
        formatCurrency(result.lastPayment.principal) + ' / ' + formatCurrency(result.lastPayment.interest);
    }
    els.outFeeAmt.textContent = formatCurrency(feeInfo.feeAmount);
    els.resultsMsg.textContent =
      months +
      ' payments · fee mode: financed into principal' +
      (feeInfo.feeAmount > 0
        ? ' (fee ' + formatCurrency(feeInfo.feeAmount) + ' added to balance)'
        : ' (no fee)');

    renderSchedule(result.schedule);
  }

  function syncPresetFromValue() {
    const months = termMonths();
    document.querySelectorAll('input[name="term-preset"]').forEach((el) => {
      el.checked = Number(el.value) === months && els.termUnit().value === 'months';
    });
  }

  ['input', 'change'].forEach((evt) => {
    document.querySelector('.ach-form').addEventListener(evt, (e) => {
      if (e.target.name === 'term-preset' && e.target.checked) {
        document.querySelector('input[name="term-unit"][value="months"]').checked = true;
        els.termValue.value = e.target.value;
      }
      if (e.target.name === 'term-unit' || e.target.id === 'term-value') {
        syncPresetFromValue();
      }
      calculate();
    });
  });

  els.cta.addEventListener('click', (e) => {
    e.preventDefault();
  });

  calculate();
})();
