/** Brand / project key passed by consumer apps. */
export type ProjectName = "achieve" | "fdr" | "bills";

export const PROJECT_NAMES: ProjectName[] = ["achieve", "fdr", "bills"];

export function isProjectName(value: unknown): value is ProjectName {
  return value === "achieve" || value === "fdr" || value === "bills";
}

export function resolveProjectName(value?: string | null): ProjectName {
  if (isProjectName(value)) return value;
  return "achieve";
}
