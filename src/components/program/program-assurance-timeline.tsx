"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAssurance } from "@/stores/assurance-store";
import { useMemoryStore } from "@/stores/program-memory-store";
import {
  useOutputStore,
  assessInputs,
} from "@/stores/output-intelligence-store";
import { TimelineChain } from "./timeline-chain";
import { allEvidence } from "@/lib/assurance";
import type { ProgramActivity } from "@/lib/program-assurance";
import { caseHref, linkedCaseId } from "@/lib/clarifications";

export function ProgramAssuranceTimeline({ today }: { today: string }) {
  const workspace = useAssurance((s) => s.workspace),
    sources = useMemoryStore((s) => s.sources),
    legacy = useOutputStore((s) => s.tasks),
    requirements = useOutputStore((s) => s.requirements),
    [selected, setSelected] = useState("");
  const params = useSearchParams(),
    activity = params.get("activity");
  useEffect(() => {
    setSelected(activity || "");
  }, [activity, workspace.program?.id]);
  const p = workspace.program,
    activities: ProgramActivity[] =
      p?.activities ||
      legacy.map((t) => ({ ...t, required: t.requirementIds }));
  const start = p?.start || activities[0]?.start,
    end = p?.end || activities.at(-1)?.due;
  if (!start || !end) return null;
  const total = Date.parse(end) - Date.parse(start) + 86400000,
    now = Date.parse(today),
    months: { label: string; left: number }[] = [];
  let cursor = new Date(start + "T00:00:00Z");
  cursor.setUTCDate(1);
  while (cursor.getTime() <= Date.parse(end) && months.length < 60) {
    months.push({
      label: cursor.toLocaleDateString("en-GB", {
        month: "short",
        year: "2-digit",
        timeZone: "UTC",
      }),
      left: Math.max(0, ((cursor.getTime() - Date.parse(start)) / total) * 100),
    });
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  const nowMonth = new Date(today),
    first = new Date(start),
    elapsed = Number.isFinite(now)
      ? Math.max(
          0,
          Math.min(
            months.length,
            (nowMonth.getUTCFullYear() - first.getUTCFullYear()) * 12 +
              nowMonth.getUTCMonth() -
              first.getUTCMonth() +
              1,
          ),
        )
      : 0;
  const evidence = allEvidence(workspace, sources).filter(
    (s) => !s.id.startsWith("configured-inputs:"),
  );
  const needs = (a: (typeof activities)[number]) =>
    p?.id && p.id !== "cambodia-demo"
      ? a.required.map((id) => ({
          id,
          label:
            p.followups.find((f) => f.id === id)?.title ||
            evidence.find((s) => s.id === id)?.title ||
            "Required program document",
          source: evidence.find((s) => s.id === id),
          missing: !evidence.some((s) => s.id === id),
        }))
      : assessInputs(a.required, requirements, sources);
  const task = activities.find((a) => a.id === selected);
  return (
    <section id="program-timeline" className="birdseye standalone-timeline">
      <header className="workspace-section-header">
        <div>
          <span>PROGRAM BIRD’S-EYE VIEW</span>
          <h2>Program Timeline</h2>
          <p>
            {p?.name} · {start}–{end}
          </p>
        </div>
        <Link href="/assurance">Review checks ↗</Link>
      </header>
      <div className="timeline-body">
        <div className="birdseye-stats">
          <span>
            <b>
              {elapsed}/{months.length}
            </b>{" "}
            months elapsed
          </span>
          <span>
            <b>
              {activities.filter((a) => a.completedAt).length}/
              {activities.length}
            </b>{" "}
            activities complete
          </span>
        </div>
        {!activities.length ? (
          <p>Add activities and required documents in Program setup.</p>
        ) : (
          <div
            className="birdseye-scroll"
            tabIndex={0}
            aria-label="Scrollable program timeline"
          >
            <div className="birdseye-grid">
              <div className="birdseye-months">
                <span>Activity</span>
                <div>
                  {months.map((m) => (
                    <small key={m.label} style={{ left: `${m.left}%` }}>
                      {m.label}
                    </small>
                  ))}
                </div>
                <span>Documents</span>
              </div>
              {activities.map((a) => {
                const missing = needs(a).filter((d) => d.missing).length,
                  status = a.completedAt
                    ? "complete"
                    : today && a.due < today
                      ? "overdue"
                      : today && a.start > today
                        ? "upcoming"
                        : "active",
                  segments = [];
                let date = new Date(a.start + "T00:00:00Z"),
                  duration = Date.parse(a.due) - Date.parse(a.start) + 86400000;
                do {
                  const segmentStatus = a.recurrenceMonths
                    ? date.getTime() > now
                      ? "upcoming"
                      : date.getTime() + duration < now
                        ? "overdue"
                        : "active"
                    : status;
                  segments.push({
                    left: Math.max(
                      0,
                      ((date.getTime() - Date.parse(start)) / total) * 100,
                    ),
                    width: Math.max(
                      1,
                      (Math.min(
                        duration,
                        Date.parse(end) - date.getTime() + 86400000,
                      ) /
                        total) *
                        100,
                    ),
                    status: segmentStatus,
                  });
                  if (!a.recurrenceMonths) break;
                  date.setUTCMonth(date.getUTCMonth() + a.recurrenceMonths);
                } while (
                  date.getTime() <= Date.parse(end) &&
                  segments.length < 60
                );
                return (
                  <button
                    key={a.id}
                    className={`birdseye-row ${status}`}
                    aria-pressed={selected === a.id}
                    onClick={() => setSelected(selected === a.id ? "" : a.id)}
                    aria-label={`${a.title}, ${status}, ${missing} documents missing`}
                  >
                    <span>
                      {a.title}
                      {segments.length > 1 && (
                        <small>{segments.length} scheduled calls</small>
                      )}
                    </span>
                    <span className="birdseye-track">
                      {segments.map((bar, i) => (
                        <i
                          key={i}
                          className={`birdseye-bar ${bar.status}`}
                          style={{
                            left: `${bar.left}%`,
                            width: `${bar.width}%`,
                          }}
                        />
                      ))}
                      {now >= Date.parse(start) && now <= Date.parse(end) && (
                        <i
                          className="birdseye-now"
                          style={{
                            left: `${((now - Date.parse(start)) / total) * 100}%`,
                          }}
                        />
                      )}
                    </span>
                    <span
                      className={missing ? "missing-count" : "received-count"}
                    >
                      {missing
                        ? `⚑ ${missing} missing`
                        : `✓ ${needs(a).length} linked`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
        <div className="birdseye-legend">
          <span className="active">Active</span>
          <span className="upcoming">Upcoming</span>
          <span className="complete">Completed</span>
          <span className="overdue">Overdue</span>
        </div>
        {task && (
          <div className="birdseye-upload-detail">
            <header>
              <h5>{task.title}</h5>
              <button onClick={() => setSelected("")}>Close</button>
            </header>
            <p>
              {task.start}–{task.due}
              {task.dependsOn
                ? " · starts after the prerequisite activity"
                : ""}
            </p>
            <TimelineChain taskId={task.id} title={task.title} start={task.start} due={task.due} />
            <ul>
              {needs(task).map((d) => {
                const caseId = linkedCaseId(workspace, d.id),
                  generic = p?.id && p.id !== "cambodia-demo";
                return (
                  <li key={d.id}>
                    <div>
                      <strong>{d.label}</strong>
                      {generic && !d.source && !caseId && (
                        <small>
                          No request linked yet. Find the matching evidence
                          request in Assurance.
                        </small>
                      )}
                    </div>
                    <Link
                      href={
                        d.source
                          ? `/sources/view?id=${encodeURIComponent(d.source.id)}`
                          : generic
                            ? caseId
                              ? caseHref(caseId)
                              : "/assurance#assurance-next-actions"
                            : `/sources?request=${encodeURIComponent(d.id)}#upload-evidence`
                      }
                    >
                      {d.source
                        ? "Open document"
                        : generic
                          ? caseId
                            ? "Open evidence request"
                            : "Find evidence request"
                          : "Upload"}{" "}
                      ↗
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
        <small>Completion and document review are tracked separately.</small>
      </div>
    </section>
  );
}

export function ProgramTimelinePage() {
  const [today, setToday] = useState("");
  useEffect(() => setToday(new Date().toISOString().slice(0, 10)), []);
  return <ProgramAssuranceTimeline today={today} />;
}
