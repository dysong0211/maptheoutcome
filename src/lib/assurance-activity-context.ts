import type { AssuranceState } from "./assurance";
import { validDate, type ProgramActivity } from "./program-assurance";

/** Resolve only explicit links within the selected program, never names or dates guessed from text. */
export function assuranceActivityContext(
  workspace: AssuranceState,
  id: string,
  requestDue?: string,
) {
  const program = workspace.program;
  const finding = workspace.findings.find((f) => f.id === id);
  const rule = program?.rules.find(
    (r) => r.id === finding?.controlId || r.id === id,
  );
  const due = [requestDue, finding?.due, rule?.due].find(
    (value): value is string => !!value && validDate(value),
  );
  const activities = program?.activities || [];
  let activity: ProgramActivity | undefined = activities.find(
    (a) => a.id === finding?.activityId || a.id === id,
  );
  let candidates: ProgramActivity[] = [];
  if (!activity) {
    const directIds = new Set([id, finding?.controlId].filter(Boolean));
    candidates = activities.filter((a) =>
      a.required.some((key) => directIds.has(key)),
    );
    if (!candidates.length) {
      const inputIds = new Set(rule?.inputIds || []);
      const sourceIds = new Set([
        ...(rule?.sourceIds || []),
        ...(finding?.sourceIds || []),
        ...(program?.data || [])
          .filter((datum) => inputIds.has(datum.id))
          .flatMap((datum) => (datum.anchor ? [datum.anchor.sourceId] : [])),
      ]);
      candidates = activities.filter((a) =>
        a.required.some((key) => inputIds.has(key) || sourceIds.has(key)),
      );
    }
    // A request due date can disambiguate recurring activities only when it
    // exactly matches their configured due date. Never invent an activity.
    const exactDue = due ? candidates.filter((a) => a.due === due) : [];
    activity =
      candidates.length === 1
        ? candidates[0]
        : exactDue.length === 1
          ? exactDue[0]
          : undefined;
  }
  const validWindow =
    activity &&
    validDate(activity.start) &&
    validDate(activity.due) &&
    activity.start <= activity.due;
  const start = validWindow ? activity?.start : undefined;
  const end = validWindow ? activity?.due : undefined;
  const decisionAt =
    finding && ["closed", "dismissed"].includes(finding.status)
      ? finding.decisions.at(-1)?.time
      : undefined;
  const decisionDate = decisionAt?.slice(0, 10);
  return {
    activity,
    start,
    end,
    due,
    ambiguous: !activity && candidates.length > 1,
    decisionDate:
      decisionDate && validDate(decisionDate) ? decisionDate : undefined,
    href: activity
      ? `/timeline?activity=${encodeURIComponent(activity.id)}#program-timeline`
      : "/timeline#program-timeline",
  };
}
