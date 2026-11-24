export const programSections = [
  { id: "summary", label: "Summary" },
  { id: "design", label: "Protocols & design" },
  { id: "funding", label: "Funding" },
  { id: "reports", label: "Reports" },
] as const;

export type ProgramSection = (typeof programSections)[number]["id"];

export function resolveProgramSection(view: string | null): ProgramSection {
  return (
    programSections.find((section) => section.id === view)?.id ?? "summary"
  );
}

export function programSectionHref(section: ProgramSection) {
  return `/program?view=${section}`;
}

/** Keep bookmarked source/report anchors when moving older pages into Program. */
export function legacyProgramSectionHref(
  section: ProgramSection,
  search: string,
  hash: string,
) {
  const params = new URLSearchParams(search);
  params.set("view", section);
  return `/program?${params.toString()}${hash}`;
}
