"use client";

import { useEffect, useState, type ReactNode } from "react";

/**
 * "More options" disclosure: collapsed on mobile (≤640px), always open on desktop.
 * Same behavior as the HELOC advanced panel.
 */
export function MoreOptions({ label = "More options", children }: { label?: string; children: ReactNode }) {
  const [open, setOpen] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 641px)");
    const sync = () => setOpen(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return (
    <details
      className="lc-advanced"
      open={open}
      onToggle={(e) => {
        if (window.matchMedia("(min-width: 641px)").matches) {
          e.currentTarget.open = true;
          setOpen(true);
          return;
        }
        setOpen(e.currentTarget.open);
      }}
    >
      <summary>{label}</summary>
      <div className="lc-advanced-body">{children}</div>
    </details>
  );
}
