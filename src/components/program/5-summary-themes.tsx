"use client";
import Link from "next/link";
import { eventDateText } from "@/lib/event-date";
import type { ProgramRecord } from "@/lib/program-memory";
import { useSavedFindings } from "./saved-findings";

export type ThemeLines = { progress?: string; finance?: string; challenges?: string };

/** The five Overview summary themes. Each shows one plain sentence from reviewed records or existing figures, never a guess. */
export function SummaryThemes({ records, lines = {} }: { records: ProgramRecord[]; lines?: ThemeLines }) {
  const awaiting = useSavedFindings().length;
  const sorted = records.slice().sort((a, b) => (b.reviewedAt ?? "").localeCompare(a.reviewedAt ?? "") || b.eventDate.localeCompare(a.eventDate));
  const latest = sorted[0];
  const results = records.filter((r) => r.kind === "Result");
  const challenges = records.filter((r) => r.kind === "Risk" || r.kind === "Question");
  const lessons = records.filter((r) => r.kind === "Lesson");
  const cards = [
    { k: "Updates", color: "blue", means: "What's new in the programme", href: "/insights?view=changes", text: latest ? `${latest.title} · ${eventDateText(latest)}` : "No reviewed updates yet." },
    { k: "Progress", color: "green", means: "Results against plans and targets", href: "/insights?view=results", text: lines.progress || (results[0] ? results[0].title : "No reviewed results yet.") },
    { k: "Finance", color: "purple", means: "Funding, budget, spending and balance, where verified figures exist", href: "/program?view=funding", text: lines.finance || "No verified figures yet." },
    { k: "Challenges", color: "amber", means: "Problems, delays, risks and actions taken", href: "/insights?view=gaps", text: lines.challenges || (challenges.length ? `${challenges.length} reviewed risks or open questions.` : "No challenges recorded.") },
    { k: "Lessons", color: "teal", means: "What worked, what didn't, what to repeat or change", href: "/insights?view=changes", text: lessons[0] ? lessons[0].title : "No reviewed lessons yet." },
  ];
  return (
    <>
    <ul className="summary-themes" aria-label="Program summary themes">
      {cards.map((c) => (
        <li key={c.k} className={c.color}>
          <Link href={c.href}>
            <strong>{c.k}</strong>
            <small>{c.means}</small>
            <span>{c.text}</span>
          </Link>
        </li>
      ))}
    </ul>
    {awaiting > 0 && (
      <p className="summary-awaiting text-sm">
        {awaiting} saved finding{awaiting === 1 ? "" : "s"} awaiting reviewer approval, not yet counted above. <Link href="/insights">See saved findings →</Link>
      </p>
    )}
    </>
  );
}
