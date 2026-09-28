import { resolveProjectName, type ProjectName } from "./types";

const PATTERN_PHRASE: Record<ProjectName, string> = {
  achieve: "public Achieve.com visual patterns",
  fdr: "Freedom Debt Relief (FDR)–style visual patterns (illustrative only)",
  bills: "bills.com–style visual patterns (illustrative only)",
};

const STYLED_PHRASE: Record<ProjectName, string> = {
  achieve: "Achieve-styled",
  fdr: "FDR-styled",
  bills: "bills.com-styled",
};

/**
 * Adapt calculator footer/meta copy that hardcodes Achieve wording
 * when another brand is active. Leaves unrelated demo disclaimers intact.
 */
export function adaptBrandChromeNote(
  note: string,
  projectName?: ProjectName | string,
): string {
  const brand = resolveProjectName(projectName);
  let out = note;
  out = out.replace(
    /public Achieve\.com visual patterns/gi,
    PATTERN_PHRASE[brand],
  );
  out = out.replace(/Achieve-styled/gi, STYLED_PHRASE[brand]);
  out = out.replace(/Achieve-style demo/gi, `${brand === "bills" ? "bills.com" : brand === "fdr" ? "FDR" : "Achieve"}-style demo`);
  return out;
}
