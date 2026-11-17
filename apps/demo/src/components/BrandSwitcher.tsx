"use client";

import { BRAND_OPTIONS } from "@/lib/brand";
import { useBrand } from "./BrandProvider";

/**
 * Slim top-bar brand control: Achieve · FDR · bills.com
 * No visible label; the radiogroup is named "Brand" via aria-label.
 */
export function BrandSwitcher() {
  const { brand, setBrand } = useBrand();

  return (
    <div className="lc-brand-bar">
      <div className="lc-brand-bar-inner">
        <div
          className="lc-brand-switcher"
          role="radiogroup"
          aria-label="Brand"
        >
          {BRAND_OPTIONS.map((opt) => {
            const selected = brand === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={selected}
                className={
                  selected ? "lc-brand-option lc-brand-option-active" : "lc-brand-option"
                }
                onClick={() => setBrand(opt.value)}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
