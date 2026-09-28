(function () {
  'use strict';

  const { amortize, formatCurrency, formatPercent, validateRange, parseNumber } = window.CalcUtils;

  const els = {
    homeValue: document.getElementById('home-value'),
    mortgage: document.getElementById('mortgage-balance'),
    maxCltv: document.getElementById('max-cltv'),
    creditLimit: document.getElementById('credit-limit'),
    draw: document.getElementById('draw-amount'),
    apr: document.getElementById('apr'),
    termYears: document.getElementById('term-years'),
    termLabel: document.getElementById('term-label'),
    termHint: document.getElementById('term-hint'),
    homeErr: document.getElementById('home-value-error'),
    mortgageErr: document.getElementById('mortgage-error'),
    maxCltvErr: document.getElementById('max-cltv-error'),
    creditErr: document.getElementById('credit-limit-error'),
    drawErr: document.getElementById('draw-error'),
    aprErr: document.getElementById('apr-error'),
    termErr: document.getElementById('term-error'),
    outPaymentLabel: document.getElementById('out-payment-label'),
    outPayment: document.getElementById('out-payment'),
    outLimit: document.getElementById('out-limit'),
    outEquity: document.getElementById('out-equity'),
    outLtv: document.getElementById('out-ltv'),
    outCltv: document.getElementById('out-cltv'),
    outGrossEquity: document.getElementById('out-gross-equity'),
    outDraw: document.getElementById('out-draw'),
    outUnused: document.getElementById('out-unused'),
    outMode: document.getElementById('out-mode'),
    resultsMsg: document.getElementById('results-message'),
    cta: document.getElementById('cta-primary'),
  };

  let limitManuallyEdited = false;

  function payMode() {
    return document.querySelector('input[name="pay-mode"]:checked').value;
  }

  function setInvalid(input, errEl, message) {
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
    errEl.textContent = message || '';
  }

  function derivedCreditLimit(homeValue, mortgageBalance, maxCltvPct) {
    if (!isFinite(homeValue) || !isFinite(mortgageBalance) || !isFinite(maxCltvPct)) return NaN;
    return Math.max(0, homeValue * (maxCltvPct / 100) - mortgageBalance);
  }

  function syncLimitFromInputs() {
    if (limitManuallyEdited) return;
    const home = parseNumber(els.homeValue.value);
    const mort = parseNumber(els.mortgage.value);
    const maxCltv = parseNumber(els.maxCltv.value);
    const limit = derivedCreditLimit(home, isFinite(mort) ? mort : 0, maxCltv);
    if (isFinite(limit) && limit >= 0) {
      els.creditLimit.value = String(Math.round(limit * 100) / 100);
    }
  }

  function updateTermLabels() {
    const mode = payMode();
    if (mode === 'interest-only') {
      els.termLabel.textContent = 'Interest-only / draw period';
      els.termHint.textContent =
        'Shown for context on interest-only; monthly payment is interest on the draw only.';
    } else {
      els.termLabel.textContent = 'Amortization term';
      els.termHint.textContent = 'Fixed principal & interest over this many years on the draw amount.';
    }
  }

  function clearResults(msg) {
    [
      'outPayment',
      'outLimit',
      'outEquity',
      'outLtv',
      'outCltv',
      'outGrossEquity',
      'outDraw',
      'outUnused',
      'outMode',
    ].forEach((k) => {
      els[k].textContent = '—';
    });
    els.resultsMsg.textContent = msg || '';
  }

  function calculate() {
    updateTermLabels();

    const homeV = validateRange(els.homeValue.value, { min: 1, max: 100000000, label: 'Home value' });
    const mortV = validateRange(els.mortgage.value, {
      min: 0,
      max: 100000000,
      label: 'Mortgage balance',
      allowZero: true,
    });
    const maxCltvV = validateRange(els.maxCltv.value, { min: 1, max: 100, label: 'Max CLTV' });
    const limitV = validateRange(els.creditLimit.value, {
      min: 0,
      max: 100000000,
      label: 'Credit limit',
      allowZero: true,
    });
    const drawV = validateRange(els.draw.value, { min: 1, max: 100000000, label: 'Draw amount' });
    const aprV = validateRange(els.apr.value, { min: 0, max: 100, label: 'APR', allowZero: true });
    const yearsV = validateRange(els.termYears.value, { min: 1, max: 40, label: 'Term (years)' });

    setInvalid(els.homeValue, els.homeErr, homeV.ok ? '' : homeV.message);
    setInvalid(els.mortgage, els.mortgageErr, mortV.ok ? '' : mortV.message);
    setInvalid(els.maxCltv, els.maxCltvErr, maxCltvV.ok ? '' : maxCltvV.message);
    setInvalid(els.creditLimit, els.creditErr, limitV.ok ? '' : limitV.message);
    setInvalid(els.apr, els.aprErr, aprV.ok ? '' : aprV.message);
    setInvalid(els.termYears, els.termErr, yearsV.ok ? '' : yearsV.message);

    let drawMsg = drawV.ok ? '' : drawV.message;
    if (drawV.ok && limitV.ok && drawV.value > limitV.value) {
      drawMsg = 'Draw amount cannot exceed the credit limit.';
    }
    if (drawV.ok && mortV.ok && homeV.ok && mortV.value + drawV.value > homeV.value) {
      // Soft warning via results message later; still allow calc for educational CLTV > 100%
    }
    setInvalid(els.draw, els.drawErr, drawMsg);

    if (homeV.ok && mortV.ok && mortV.value > homeV.value) {
      setInvalid(els.mortgage, els.mortgageErr, 'Mortgage balance cannot exceed home value.');
      clearResults('Fix the highlighted fields to see an estimate.');
      return;
    }

    if (!homeV.ok || !mortV.ok || !maxCltvV.ok || !limitV.ok || drawMsg || !aprV.ok || !yearsV.ok) {
      clearResults('Fix the highlighted fields to see an estimate.');
      return;
    }

    const mode = payMode();
    const months = Math.round(yearsV.value * 12);
    let monthlyPayment;
    let modeLabel;

    if (mode === 'interest-only') {
      monthlyPayment = drawV.value * (aprV.value / 100 / 12);
      modeLabel = 'Interest-only on draw';
      els.outPaymentLabel.textContent = 'Estimated monthly interest';
    } else {
      const result = amortize(drawV.value, aprV.value, months);
      if (!result) {
        clearResults('Unable to calculate with these inputs.');
        return;
      }
      monthlyPayment = result.payment;
      modeLabel = 'Amortizing P&I (' + yearsV.value + ' yr)';
      els.outPaymentLabel.textContent = 'Estimated monthly payment';
    }

    const grossEquity = homeV.value - mortV.value;
    const remainingEquity = homeV.value - mortV.value - drawV.value;
    const unused = Math.max(0, limitV.value - drawV.value);
    const ltv = (mortV.value / homeV.value) * 100;
    const cltv = ((mortV.value + drawV.value) / homeV.value) * 100;

    els.outPayment.textContent = formatCurrency(monthlyPayment);
    els.outLimit.textContent = formatCurrency(limitV.value);
    els.outEquity.textContent = formatCurrency(remainingEquity);
    els.outLtv.textContent = formatPercent(ltv);
    els.outCltv.textContent = formatPercent(cltv);
    els.outGrossEquity.textContent = formatCurrency(grossEquity);
    els.outDraw.textContent = formatCurrency(drawV.value);
    els.outUnused.textContent = formatCurrency(unused);
    els.outMode.textContent = modeLabel;

    const derived = derivedCreditLimit(homeV.value, mortV.value, maxCltvV.value);
    els.resultsMsg.textContent =
      'Sample / demo only — not an offer. ' +
      modeLabel +
      (mode === 'interest-only'
        ? ' · IO period ' + yearsV.value + ' yr (context)'
        : ' · ' + months + ' payments') +
      (limitManuallyEdited
        ? ' · credit limit manually set'
        : ' · limit derived at ' + formatPercent(maxCltvV.value) + ' max CLTV (≈ ' + formatCurrency(derived) + ')');
  }

  const form = document.querySelector('.ach-form');
  form.addEventListener('input', (e) => {
    if (e.target.id === 'credit-limit') {
      limitManuallyEdited = true;
    }
    if (
      e.target.id === 'home-value' ||
      e.target.id === 'mortgage-balance' ||
      e.target.id === 'max-cltv'
    ) {
      limitManuallyEdited = false;
      syncLimitFromInputs();
    }
    calculate();
  });

  form.addEventListener('change', (e) => {
    if (e.target.name === 'pay-mode') {
      updateTermLabels();
    }
    calculate();
  });

  els.cta.addEventListener('click', (e) => e.preventDefault());

  syncLimitFromInputs();
  calculate();
})();
