"use client";
import Link from "next/link";
import { CalendarDays, ArrowUpRight } from "lucide-react";
import type { AssuranceState } from "@/lib/assurance";
import { assuranceActivityContext } from "@/lib/assurance-activity-context";
import { validDate } from "@/lib/program-assurance";

/** Shows the actual scheduled activity when linked, otherwise only the request's due month. */
export function AssuranceRequestContext({
  workspace,
  id,
  due,
  compact = false,
}: {
  workspace: AssuranceState;
  id: string;
  due?: string;
  compact?: boolean;
}) {
  const program = workspace.program;
  if (!program) return null;
  const context = assuranceActivityContext(workspace, id, due);
  const { activity, start, end } = context;
  const highlightStart = start || context.due;
  const highlightEnd = end || context.due;
  const months: { key: string; label: string }[] = [];
  const month = new Date(`${program.start}T12:00:00Z`);
  const programEnd = new Date(`${program.end}T12:00:00Z`);
  month.setUTCDate(1);
  while (
    Number.isFinite(month.getTime()) &&
    month <= programEnd &&
    months.length < 24
  ) {
    months.push({
      key: month.toISOString().slice(0, 7),
      label: month.toLocaleDateString("en-GB", {
        month: "short",
        timeZone: "UTC",
      }),
    });
    month.setUTCMonth(month.getUTCMonth() + 1);
  }
  const dateLabel = (date: string) =>
    new Date(`${date}T12:00:00Z`).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
  return (
    <div className={`request-context ${compact ? "compact" : ""}`}>
      <div className="request-purpose">
        <CalendarDays size={14} />
        <strong>{activity?.title || "Activity not linked"}</strong>
        <Link href={context.href}>
          {activity ? "View activity" : "View schedule"}
          <ArrowUpRight size={13} />
        </Link>
      </div>
      <div className="request-dates">
        {activity && (
          <span>
            {start && end
              ? `${dateLabel(start)}–${dateLabel(end)}`
              : "Activity dates not set"}
          </span>
        )}
        <span>
          {context.due
            ? `Request due ${dateLabel(context.due)}`
            : "Due date not set"}
        </span>
        {context.decisionDate && (
          <span>Decision recorded {dateLabel(context.decisionDate)}</span>
        )}
      </div>
      {!!months.length &&
        !!highlightStart &&
        !!highlightEnd &&
        validDate(highlightStart) &&
        validDate(highlightEnd) && (
          <div
            className="request-months"
            aria-label={
              activity
                ? `Activity runs ${activity.start} to ${activity.due}`
                : `Request due ${context.due}`
            }
          >
            {months.map((m) => (
              <span
                key={m.key}
                className={
                  m.key >= highlightStart.slice(0, 7) &&
                  m.key <= highlightEnd.slice(0, 7)
                    ? "in-period"
                    : ""
                }
              >
                <i />
                {m.label}
              </span>
            ))}
          </div>
        )}
      {context.ambiguous && (
        <small className="request-context-note">
          This evidence is used by several activities; choose one in the
          schedule.
        </small>
      )}
    </div>
  );
}
