/**
 * Shared amortization and formatting helpers for Achieve loan calculators.
 * Pure functions — no DOM, no brand-specific claims.
 */
(function (global) {
  'use strict';

  /**
   * Standard amortizing monthly payment.
   * P = r(1+r)^n / ((1+r)^n - 1) * Principal
   * @param {number} principal - Loan principal (> 0)
   * @param {number} annualRatePct - APR as percent (e.g. 10 for 10%)
   * @param {number} termMonths - Number of monthly payments (>= 1)
   * @returns {number} Monthly payment, or 0 if inputs invalid / zero rate handled
   */
  function monthlyPayment(principal, annualRatePct, termMonths) {
    if (!isFinite(principal) || !isFinite(annualRatePct) || !isFinite(termMonths)) {
      return NaN;
    }
    if (principal <= 0 || termMonths < 1) return NaN;
    if (annualRatePct < 0) return NaN;

    const n = Math.floor(termMonths);
    if (annualRatePct === 0) {
      return principal / n;
    }

    const r = annualRatePct / 100 / 12;
    const factor = Math.pow(1 + r, n);
    return (r * factor) / (factor - 1) * principal;
  }

  /**
   * Build a simple amortization schedule (monthly).
   * @returns {{ payment: number, schedule: Array, totalInterest: number, totalPaid: number }|null}
   */
  function amortize(principal, annualRatePct, termMonths) {
    const payment = monthlyPayment(principal, annualRatePct, termMonths);
    if (!isFinite(payment) || payment <= 0) return null;

    const n = Math.floor(termMonths);
    const r = annualRatePct === 0 ? 0 : annualRatePct / 100 / 12;
    let balance = principal;
    const schedule = [];
    let totalInterest = 0;

    for (let i = 1; i <= n; i++) {
      const interest = r * balance;
      let principalPortion = payment - interest;
      // Final payment adjustment for rounding
      if (i === n || principalPortion > balance) {
        principalPortion = balance;
      }
      const actualPayment = principalPortion + interest;
      balance = Math.max(0, balance - principalPortion);
      totalInterest += interest;
      schedule.push({
        month: i,
        payment: actualPayment,
        principal: principalPortion,
        interest: interest,
        balance: balance,
      });
    }

    const totalPaid = schedule.reduce((s, row) => s + row.payment, 0);
    return {
      payment,
      schedule,
      totalInterest,
      totalPaid,
      firstPayment: schedule[0] || null,
      lastPayment: schedule[schedule.length - 1] || null,
    };
  }

  /**
   * Apply origination fee.
   * mode: 'financed' — fee added to principal (borrower receives principal, pays interest on principal+fee)
   *        'upfront'  — fee paid at closing; financed principal unchanged; cash received = principal - fee
   * @returns {{ financedPrincipal: number, feeAmount: number, cashReceived: number, mode: string }}
   */
  function applyOriginationFee(principal, feePct, mode) {
    const feeAmount = Math.max(0, principal * (feePct / 100));
    if (mode === 'upfront') {
      return {
        financedPrincipal: principal,
        feeAmount,
        cashReceived: principal - feeAmount,
        mode: 'upfront',
      };
    }
    // Default: financed into principal (common Achieve personal-loan pattern publicly disclosed)
    return {
      financedPrincipal: principal + feeAmount,
      feeAmount,
      cashReceived: principal,
      mode: 'financed',
    };
  }

  function parseNumber(value) {
    if (value === null || value === undefined) return NaN;
    if (typeof value === 'number') return value;
    const cleaned = String(value).replace(/[$,%\s,]/g, '');
    if (cleaned === '' || cleaned === '-' || cleaned === '.') return NaN;
    return Number(cleaned);
  }

  function formatCurrency(amount, opts) {
    const options = Object.assign({ maximumFractionDigits: 2, minimumFractionDigits: 2 }, opts || {});
    if (!isFinite(amount)) return '—';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      ...options,
    }).format(amount);
  }

  function formatPercent(pct, digits) {
    if (!isFinite(pct)) return '—';
    const d = digits == null ? 2 : digits;
    return pct.toFixed(d) + '%';
  }

  function formatNumber(n, digits) {
    if (!isFinite(n)) return '—';
    return new Intl.NumberFormat('en-US', {
      maximumFractionDigits: digits == null ? 0 : digits,
      minimumFractionDigits: digits == null ? 0 : digits,
    }).format(n);
  }

  /**
   * Validate a numeric input field.
   * @returns {{ ok: boolean, value: number, message: string }}
   */
  function validateRange(raw, { min, max, label, allowZero }) {
    const value = parseNumber(raw);
    if (!isFinite(value)) {
      return { ok: false, value: NaN, message: (label || 'Value') + ' is required.' };
    }
    if (!allowZero && value === 0) {
      return { ok: false, value, message: (label || 'Value') + ' must be greater than zero.' };
    }
    if (value < 0) {
      return { ok: false, value, message: (label || 'Value') + ' cannot be negative.' };
    }
    if (min != null && value < min) {
      return { ok: false, value, message: (label || 'Value') + ' must be at least ' + min + '.' };
    }
    if (max != null && value > max) {
      return { ok: false, value, message: (label || 'Value') + ' must be at most ' + max + '.' };
    }
    return { ok: true, value, message: '' };
  }

  /**
   * Life insurance coverage need (illustrative DIME-style heuristic).
   * Not a quote or recommendation.
   */
  function lifeCoverageEstimate({
    annualIncome,
    yearsIncomeReplace,
    totalDebts,
    finalExpenses,
    educationFund,
    existingCoverage,
    liquidAssets,
  }) {
    const incomeNeed = Math.max(0, annualIncome) * Math.max(0, yearsIncomeReplace);
    const debts = Math.max(0, totalDebts);
    const finals = Math.max(0, finalExpenses);
    const education = Math.max(0, educationFund);
    const existing = Math.max(0, existingCoverage);
    const assets = Math.max(0, liquidAssets);
    const grossNeed = incomeNeed + debts + finals + education;
    const netNeed = Math.max(0, grossNeed - existing - assets);
    return {
      incomeNeed,
      debts,
      finals,
      education,
      existing,
      assets,
      grossNeed,
      netNeed,
    };
  }

  global.CalcUtils = {
    monthlyPayment,
    amortize,
    applyOriginationFee,
    parseNumber,
    formatCurrency,
    formatPercent,
    formatNumber,
    validateRange,
    lifeCoverageEstimate,
  };
})(typeof window !== 'undefined' ? window : globalThis);
