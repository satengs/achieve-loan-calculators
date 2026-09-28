(function () {
  'use strict';

  const { amortize, formatCurrency, validateRange, parseNumber } = window.CalcUtils;

  const els = {
    price: document.getElementById('home-price'),
    down: document.getElementById('down-payment'),
    loan: document.getElementById('loan-amount'),
    apr: document.getElementById('apr'),
    termYears: document.getElementById('term-years'),
    tax: document.getElementById('tax-monthly'),
    ins: document.getElementById('ins-monthly'),
    hoa: document.getElementById('hoa-monthly'),
    dpPrefix: document.getElementById('dp-prefix'),
    dpSuffix: document.getElementById('dp-suffix'),
    priceErr: document.getElementById('home-price-error'),
    dpErr: document.getElementById('dp-error'),
    loanErr: document.getElementById('loan-amount-error'),
    aprErr: document.getElementById('apr-error'),
    termErr: document.getElementById('term-error'),
    taxErr: document.getElementById('tax-error'),
    insErr: document.getElementById('ins-error'),
    hoaErr: document.getElementById('hoa-error'),
    outPi: document.getElementById('out-pi'),
    outPiti: document.getElementById('out-piti'),
    outLoan: document.getElementById('out-loan'),
    outInterest: document.getElementById('out-interest'),
    outDown: document.getElementById('out-down'),
    bdPi: document.getElementById('bd-pi'),
    bdTax: document.getElementById('bd-tax'),
    bdIns: document.getElementById('bd-ins'),
    bdHoa: document.getElementById('bd-hoa'),
    resultsMsg: document.getElementById('results-message'),
    cta: document.getElementById('cta-primary'),
  };

  let loanManuallyEdited = false;

  function dpMode() {
    return document.querySelector('input[name="dp-mode"]:checked').value;
  }

  function setInvalid(input, errEl, message) {
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
    errEl.textContent = message || '';
  }

  function updateDpAffixes() {
    const mode = dpMode();
    if (mode === 'percent') {
      els.dpPrefix.hidden = true;
      els.dpSuffix.hidden = false;
      els.down.classList.add('has-suffix');
      els.down.classList.remove('has-prefix');
    } else {
      els.dpPrefix.hidden = false;
      els.dpSuffix.hidden = true;
      els.down.classList.add('has-prefix');
      els.down.classList.remove('has-suffix');
    }
  }

  function derivedDownAndLoan(price) {
    const mode = dpMode();
    const raw = parseNumber(els.down.value);
    if (!isFinite(price) || !isFinite(raw) || raw < 0) {
      return { downDollars: NaN, loanAmount: NaN };
    }
    let downDollars;
    if (mode === 'percent') {
      if (raw > 100) return { downDollars: NaN, loanAmount: NaN };
      downDollars = price * (raw / 100);
    } else {
      downDollars = raw;
    }
    const loanAmount = price - downDollars;
    return { downDollars, loanAmount };
  }

  function syncLoanFromPriceDown() {
    if (loanManuallyEdited) return;
    const price = parseNumber(els.price.value);
    const { loanAmount } = derivedDownAndLoan(price);
    if (isFinite(loanAmount) && loanAmount >= 0) {
      els.loan.value = String(Math.round(loanAmount * 100) / 100);
    }
  }

  function clearResults(msg) {
    ['outPi', 'outPiti', 'outLoan', 'outInterest', 'outDown', 'bdPi', 'bdTax', 'bdIns', 'bdHoa'].forEach((k) => {
      els[k].textContent = '—';
    });
    els.resultsMsg.textContent = msg || '';
  }

  function calculate() {
    updateDpAffixes();

    const priceV = validateRange(els.price.value, { min: 1, max: 100000000, label: 'Home price' });
    const aprV = validateRange(els.apr.value, { min: 0, max: 100, label: 'APR', allowZero: true });
    const yearsV = validateRange(els.termYears.value, { min: 1, max: 50, label: 'Term (years)' });
    const taxV = validateRange(els.tax.value, { min: 0, max: 100000, label: 'Property tax', allowZero: true });
    const insV = validateRange(els.ins.value, { min: 0, max: 100000, label: 'Insurance', allowZero: true });
    const hoaV = validateRange(els.hoa.value, { min: 0, max: 100000, label: 'HOA', allowZero: true });

    setInvalid(els.price, els.priceErr, priceV.ok ? '' : priceV.message);
    setInvalid(els.apr, els.aprErr, aprV.ok ? '' : aprV.message);
    setInvalid(els.termYears, els.termErr, yearsV.ok ? '' : yearsV.message);
    setInvalid(els.tax, els.taxErr, taxV.ok ? '' : taxV.message);
    setInvalid(els.ins, els.insErr, insV.ok ? '' : insV.message);
    setInvalid(els.hoa, els.hoaErr, hoaV.ok ? '' : hoaV.message);

    let dpMsg = '';
    const mode = dpMode();
    const dpRaw = parseNumber(els.down.value);
    if (!isFinite(dpRaw) || dpRaw < 0) {
      dpMsg = 'Down payment cannot be negative and must be a number.';
    } else if (mode === 'percent' && dpRaw > 100) {
      dpMsg = 'Down payment percent cannot exceed 100%.';
    } else if (priceV.ok && mode === 'dollars' && dpRaw > priceV.value) {
      dpMsg = 'Down payment cannot exceed home price.';
    }
    setInvalid(els.down, els.dpErr, dpMsg);

    const derived = priceV.ok ? derivedDownAndLoan(priceV.value) : { downDollars: NaN, loanAmount: NaN };
    const loanV = validateRange(els.loan.value, { min: 1, max: 100000000, label: 'Loan amount' });
    if (priceV.ok && isFinite(derived.loanAmount) && derived.loanAmount <= 0 && !loanManuallyEdited) {
      setInvalid(els.loan, els.loanErr, 'Loan amount must be greater than zero.');
      clearResults('Down payment covers the full price — no loan to amortize.');
      return;
    }
    setInvalid(els.loan, els.loanErr, loanV.ok ? '' : loanV.message);

    if (!priceV.ok || !aprV.ok || !yearsV.ok || !taxV.ok || !insV.ok || !hoaV.ok || dpMsg || !loanV.ok) {
      clearResults('Fix the highlighted fields to see an estimate.');
      return;
    }

    const months = Math.round(yearsV.value * 12);
    const result = amortize(loanV.value, aprV.value, months);
    if (!result) {
      clearResults('Unable to calculate with these inputs.');
      return;
    }

    const downDollars = priceV.value - loanV.value;
    const piti = result.payment + taxV.value + insV.value + hoaV.value;

    els.outPi.textContent = formatCurrency(result.payment);
    els.outPiti.textContent = formatCurrency(piti);
    els.outLoan.textContent = formatCurrency(loanV.value);
    els.outInterest.textContent = formatCurrency(result.totalInterest);
    els.outDown.textContent = formatCurrency(Math.max(0, downDollars));
    els.bdPi.textContent = formatCurrency(result.payment);
    els.bdTax.textContent = formatCurrency(taxV.value);
    els.bdIns.textContent = formatCurrency(insV.value);
    els.bdHoa.textContent = formatCurrency(hoaV.value);
    els.resultsMsg.textContent =
      yearsV.value +
      '-year term · ' +
      months +
      ' payments · estimated PITI includes your tax/insurance/HOA entries';
  }

  const form = document.querySelector('.ach-form');
  form.addEventListener('input', (e) => {
    if (e.target.id === 'loan-amount') {
      loanManuallyEdited = true;
    }
    if (e.target.id === 'home-price' || e.target.id === 'down-payment' || e.target.name === 'dp-mode') {
      loanManuallyEdited = false;
      syncLoanFromPriceDown();
    }
    if (e.target.name === 'term-preset') {
      if (e.target.value !== 'custom') {
        els.termYears.value = e.target.value;
      }
    }
    if (e.target.id === 'term-years') {
      const y = parseNumber(els.termYears.value);
      document.querySelectorAll('input[name="term-preset"]').forEach((el) => {
        if (el.value === 'custom') {
          el.checked = ![15, 20, 30].includes(y);
        } else {
          el.checked = Number(el.value) === y;
        }
      });
    }
    calculate();
  });

  form.addEventListener('change', (e) => {
    if (e.target.name === 'dp-mode') {
      loanManuallyEdited = false;
      // Convert displayed value between % and $ when toggling
      const price = parseNumber(els.price.value);
      const raw = parseNumber(els.down.value);
      if (isFinite(price) && price > 0 && isFinite(raw)) {
        if (e.target.value === 'dollars') {
          // was percent
          els.down.value = String(Math.round(price * (raw / 100) * 100) / 100);
        } else {
          // was dollars
          els.down.value = String(Math.round((raw / price) * 10000) / 100);
        }
      }
      syncLoanFromPriceDown();
    }
    calculate();
  });

  els.cta.addEventListener('click', (e) => e.preventDefault());

  syncLoanFromPriceDown();
  calculate();
})();
