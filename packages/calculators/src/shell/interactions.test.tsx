import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { JSDOM, VirtualConsole } from "jsdom";
import { act, createElement, type ComponentType } from "react";
import type { Root } from "react-dom/client";
import type { CalculatorInteractionEvent } from "./options";
import { CALCS } from "./fixtures";

// Minimal DOM for React 19 client rendering in node:test.
// jsdom logs "Not implemented: navigation" for real CTA links; that is expected here.
const virtualConsole = new VirtualConsole();
virtualConsole.on("jsdomError", (e) => {
  if (!/Not implemented: navigation/.test(e.message)) console.error(e);
});
const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "http://localhost/", virtualConsole });
const g = globalThis as Record<string, unknown>;
const KEYS = ["window", "document", "navigator", "HTMLElement", "HTMLInputElement", "Node", "Event", "MouseEvent"] as const;
const saved: Record<string, unknown> = {};

let createRoot: (el: Element) => Root;

before(async () => {
  for (const k of KEYS) {
    saved[k] = g[k];
    Object.defineProperty(globalThis, k, { value: (dom.window as unknown as Record<string, unknown>)[k], configurable: true, writable: true });
  }
  (dom.window as unknown as { matchMedia: unknown }).matchMedia = () => ({
    matches: true,
    addEventListener() {},
    removeEventListener() {},
  });
  g.IS_REACT_ACT_ENVIRONMENT = true;
  ({ createRoot } = await import("react-dom/client"));
});

after(() => {
  for (const k of KEYS) Object.defineProperty(globalThis, k, { value: saved[k], configurable: true, writable: true });
});

async function mount(Component: ComponentType<Record<string, unknown>>, props: Record<string, unknown>) {
  const el = document.createElement("div");
  document.body.appendChild(el);
  const root = createRoot(el);
  await act(async () => root.render(createElement(Component, { projectName: "achieve", ...props })));
  return {
    el,
    rerender: (p: Record<string, unknown>) =>
      act(async () => root.render(createElement(Component, { projectName: "achieve", ...props, ...p }))),
    unmount: () => act(async () => root.unmount()),
  };
}

/** Type into a React-controlled input (native setter + bubbling input event). */
async function typeInto(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, "value")!.set!;
  await act(async () => {
    setter.call(input, value);
    input.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
  });
}

describe("onInteract / onCalculate / onCtaClick (all 19 calculators)", () => {
  for (const calc of CALCS) {
    it(`${calc.name}: fires onCalculate on mount and on input change, not on unrelated re-renders`, async () => {
      const results: unknown[] = [];
      const events: CalculatorInteractionEvent[] = [];
      const m = await mount(calc.Component, {
        onCalculate: (r: unknown) => results.push(r),
        onInteract: (e: CalculatorInteractionEvent) => events.push(e),
      });
      assert.equal(results.length, 1, "initial result");
      assert.ok(results[0] && typeof results[0] === "object");

      // Re-render with new inline callbacks and an unrelated prop: no extra onCalculate.
      await m.rerender({
        onCalculate: (r: unknown) => results.push(r),
        onInteract: (e: CalculatorInteractionEvent) => events.push(e),
        ctaLabel: "Changed",
      });
      assert.equal(results.length, 1, "no re-fire on unrelated render");

      const input = m.el.querySelector<HTMLInputElement>(`#${calc.prefill.inputId}`);
      assert.ok(input, `input #${calc.prefill.inputId}`);
      const next = String(Number(input.value) + 1);
      await typeInto(input, next);

      const ev = events.find((e) => e.type === "input");
      assert.ok(ev, "onInteract input event");
      assert.equal(ev.calculator, calc.id);
      assert.equal(ev.value, next);
      assert.ok(ev.field === calc.prefill.key || ev.field === calc.prefill.inputId, `field ${ev.field}`);
      assert.equal(results.length, 2, "result re-fired after the input changed");
      await m.unmount();
    });

    it(`${calc.name}: CTA click fires onInteract(cta_click) then onCtaClick`, async () => {
      const order: string[] = [];
      let cta: CalculatorInteractionEvent | undefined;
      const m = await mount(calc.Component, {
        ctaLabel: "Go",
        onInteract: (e: CalculatorInteractionEvent) => {
          if (e.type === "cta_click") {
            cta = e;
            order.push("interact");
          }
        },
        onCtaClick: () => order.push("cta"),
      });
      const btn = m.el.querySelector<HTMLAnchorElement>(".lc-cta .lc-btn");
      assert.ok(btn);
      await act(async () => btn.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true, cancelable: true })));
      assert.deepEqual(order, ["interact", "cta"]);
      assert.equal(cta?.calculator, calc.id);
      assert.equal(cta?.label, "Go");
      // A CTA click is not also reported as a generic control event.
      await m.unmount();
    });
  }

  it("invalid input does not fire onCalculate, valid input fires once", async () => {
    const loan = CALCS.find((c) => c.name === "LoanCalculator")!;
    const results: unknown[] = [];
    const m = await mount(loan.Component, { onCalculate: (r: unknown) => results.push(r) });
    const input = m.el.querySelector<HTMLInputElement>("#ln-loanAmount")!;
    await typeInto(input, "-5");
    assert.equal(results.length, 1);
    await typeInto(input, "20000");
    assert.equal(results.length, 2);
    await m.unmount();
  });

  it("segmented / radio controls report control events", async () => {
    const pl = CALCS.find((c) => c.name === "PersonalLoanCalculator")!;
    const events: CalculatorInteractionEvent[] = [];
    const m = await mount(pl.Component, { onInteract: (e: CalculatorInteractionEvent) => events.push(e) });
    const radio = m.el.querySelector<HTMLInputElement>('input[name="term-unit"][value="years"]')!;
    await act(async () => radio.click());
    const ev = events.find((e) => e.type === "control");
    assert.ok(ev);
    assert.equal(ev.field, "term-unit");
    assert.equal(ev.value, "years");
    await m.unmount();
  });

  it("host ctaHref navigates (no preventDefault); default placeholder CTA prevents navigation", async () => {
    const loan = CALCS.find((c) => c.name === "LoanCalculator")!;
    const m1 = await mount(loan.Component, { ctaHref: "/apply" });
    const e1 = new dom.window.MouseEvent("click", { bubbles: true, cancelable: true });
    await act(async () => m1.el.querySelector(".lc-btn")!.dispatchEvent(e1));
    assert.equal(e1.defaultPrevented, false);
    await m1.unmount();
    const m2 = await mount(loan.Component, {});
    const e2 = new dom.window.MouseEvent("click", { bubbles: true, cancelable: true });
    await act(async () => m2.el.querySelector(".lc-btn")!.dispatchEvent(e2));
    assert.equal(e2.defaultPrevented, true);
    await m2.unmount();
  });
});
