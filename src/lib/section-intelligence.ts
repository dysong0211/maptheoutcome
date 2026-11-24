import { resolveCitation } from "./program-memory";
import type {
  EvidenceProposal,
  MemoryEvent,
  ProgramRecord,
  RecordRelation,
  SourceVersion,
} from "./program-memory";

export type IntelligenceSection =
  | "evidence"
  | "timeline"
  | "map"
  | "reports"
  | "sources"
  | "source"
  | "review"
  | "transparency";
type Insight = {
  question: string;
  summary: string;
  points: { label: string; text: string }[];
  action: { label: string; href: string };
  references: { label: string; href: string }[];
};
type Input = {
  section: IntelligenceSection;
  records: ProgramRecord[];
  sources: SourceVersion[];
  proposals?: EvidenceProposal[];
  relations?: RecordRelation[];
  events?: MemoryEvent[];
  recordIds?: string[];
  selectedId?: string;
  sourceId?: string;
};

// Deterministic demo synthesis. It does not call an AI provider or interpret raw uploads.
// Only reviewed records with resolvable citations can support conclusions.
export function buildSectionIntelligence(input: Input): Insight {
  const all = input.records.filter(
    (record) => resolveCitation(record.citation, input.sources).valid,
  );
  const scoped = input.recordIds
    ? all.filter((record) => input.recordIds!.includes(record.id))
    : all;
  const selected =
    scoped.find((record) => record.id === input.selectedId) ?? scoped[0];
  const risks = scoped.filter((record) => record.kind === "Risk");
  const questions = scoped.filter((record) => record.kind === "Question");
  const outputs = scoped.filter((record) => record.level === "Output");
  const signals = scoped.filter((record) => record.level === "Outcome signal");
  const references = (items: ProgramRecord[]) =>
    [...new Map(items.map((record) => [record.id, record])).values()]
      .slice(0, 3)
      .map((record) => ({
        label: record.title,
        href: `/record?item=${encodeURIComponent(record.id)}`,
      }));
  const outcomeGap =
    "The available demo evidence does not establish measured improvement in maternal care access.";
  const upload = {
    label: "Add outcome follow-up",
    href: "/sources?request=care-access#upload-evidence",
  };
  const base: Insight = {
    question: "What can be concluded?",
    summary: "No reviewed evidence is available in this selection.",
    points: [
      {
        label: "Next evidence",
        text: "Add a source and review its findings before drawing an outcome conclusion.",
      },
    ],
    action: { label: "Add documents", href: "/sources#upload-evidence" },
    references: [],
  };

  switch (input.section) {
    case "evidence":
      if (!scoped.length) return base;
      return {
        question: "What does this evidence support?",
        summary: `${scoped.length} reviewed findings are in this view. ${outputs.length} describe delivery outputs and ${signals.length} describe tentative outcome signals. ${outcomeGap}`,
        points: [
          { label: "Selected finding", text: selected.statement },
          { label: "Interpretation limit", text: selected.limitation },
          {
            label: "What to investigate",
            text:
              questions[0]?.statement ??
              risks[0]?.statement ??
              "Compare baseline and follow-up measurements before reporting outcome change.",
          },
        ],
        action: upload,
        references: references([
          selected,
          ...questions.filter((record) => record.id !== selected.id),
        ]),
      };
    case "timeline": {
      if (!scoped.length)
        return { ...base, question: "How has the evidence changed over time?" };
      const ordered = [...scoped].sort((a, b) =>
        a.eventDate.localeCompare(b.eventDate),
      );
      const changes = ordered.filter(
        (record) => record.kind === "Change" || record.kind === "Decision",
      );
      const latest = ordered[ordered.length - 1];
      return {
        question: "How has the evidence changed over time?",
        summary: `${ordered.length} reviewed events span ${ordered[0].eventDate.slice(0, 10)} to ${latest.eventDate.slice(0, 10)}. ${changes.length} document decisions or changes in delivery; ${risks.length} record risks that still need follow-up.`,
        points: [
          {
            label: "Sequence",
            text: changes.length
              ? changes
                  .slice(0, 3)
                  .map((record) => record.title)
                  .join(" → ")
              : "No reviewed delivery changes in this period.",
          },
          { label: "Latest evidence", text: latest.statement },
          {
            label: "Outcome interpretation",
            text: "Events occurring in sequence do not establish that a decision caused an outcome. Compare observations before and after the change.",
          },
        ],
        action: {
          label: "Add comparison data",
          href: "/sources?request=attendance#upload-evidence",
        },
        references: references([latest, ...changes]),
      };
    }
    case "map": {
      if (!selected)
        return {
          ...base,
          question: "How does the selected evidence connect to outcomes?",
        };
      const relatedIds = (input.relations ?? [])
        .filter((edge) => edge.from === selected.id || edge.to === selected.id)
        .map((edge) => (edge.from === selected.id ? edge.to : edge.from));
      const related = all.filter((record) => relatedIds.includes(record.id));
      const constraint = related.find(
        (record) => record.kind === "Risk" || record.kind === "Question",
      );
      return {
        question: "How does this finding connect to outcomes?",
        summary: `“${selected.title}” has ${related.length} linked reviewed findings. The links connect reported results with decisions, constraints and unanswered questions.`,
        points: [
          { label: "Selected evidence", text: selected.statement },
          {
            label: "Linked constraint / gap",
            text:
              constraint?.statement ??
              "No risk or question is linked to this finding. Check whether contextual evidence is missing.",
          },
          {
            label: "Outcome interpretation",
            text: `${selected.limitation} Links show recorded context, not a tested causal relationship.`,
          },
        ],
        action: upload,
        references: references([selected, ...related]),
      };
    }
    case "reports": {
      if (!scoped.length)
        return {
          ...base,
          question: "What can the selected report conclude?",
          action: {
            label: "Choose report evidence",
            href: "#report-selection",
          },
        };
      const missingRisk =
        all.some((record) => record.kind === "Risk") && !risks.length;
      const missingQuestion =
        all.some((record) => record.kind === "Question") && !questions.length;
      const omitted = [
        missingRisk && "risk findings",
        missingQuestion && "open questions",
      ]
        .filter(Boolean)
        .join(" and ");
      return {
        question: "What can the selected report conclude?",
        summary: `The current selection supports a brief using ${scoped.length} reviewed findings from ${new Set(scoped.map((record) => record.citation.versionId)).size} source versions. ${outputs.length ? "It can describe reported delivery." : "It contains no delivery-output record."} ${signals.length ? "Any outcome signals should retain their stated uncertainty." : "It contains no reviewed outcome signal."}`,
        points: [
          { label: "Lead finding", text: (outputs[0] ?? scoped[0]).statement },
          {
            label: "Coverage check",
            text: omitted
              ? `The selection omits ${omitted} present elsewhere in the evidence. Consider including them for a balanced account.`
              : "The selection includes the available risk and question categories. Retain their limitations in the report.",
          },
          { label: "Conclusion boundary", text: outcomeGap },
        ],
        action: { label: "Review report selection", href: "#report-selection" },
        references: references(scoped),
      };
    }
    case "sources": {
      const uploaded = input.sources.filter(
        (source) => source.origin === "browser-upload",
      );
      const pending = (input.proposals ?? []).filter(
        (proposal) =>
          proposal.status === "pending" || proposal.status === "flagged",
      );
      return {
        question: "What can these documents tell us?",
        summary: `${input.sources.length} source versions support ${all.length} reviewed findings. ${uploaded.length} files were added in this browser; this beta has not run AI extraction on those uploads.`,
        points: [
          {
            label: "Outcome coverage",
            text: all.length
              ? "Sample findings cover outreach, schedule changes, facility constraints and spending context. Measured care-access change is still missing."
              : "No source-linked, reviewed findings are available yet.",
          },
          {
            label: "Ready for review",
            text: `${pending.length} prepared suggestions await a review decision.`,
          },
          {
            label: "Next useful upload",
            text: "Attendance comparisons, referral completion data and itemized transport receipts can address the current gaps.",
          },
        ],
        action: pending.length
          ? { label: "Review suggested findings", href: "/review" }
          : { label: "Add missing evidence", href: "#upload-evidence" },
        references: references(
          all.filter(
            (record) => record.kind === "Question" || record.kind === "Risk",
          ),
        ),
      };
    }
    case "source": {
      const source = input.sources.find((item) => item.id === input.sourceId);
      if (!source)
        return { ...base, question: "What does this source establish?" };
      const findings = all.filter(
        (record) => record.citation.versionId === source.id,
      );
      const pending = (input.proposals ?? []).filter(
        (proposal) =>
          proposal.citation.versionId === source.id &&
          (proposal.status === "pending" || proposal.status === "flagged"),
      );
      return {
        question: "What does this source establish?",
        summary: findings.length
          ? `${findings.length} reviewed findings cite this exact source version. ${findings[0].statement}`
          : source.origin === "browser-upload"
            ? "This file is captured, but AI analysis has not been run. No reviewed outcome finding can yet be drawn from it in this demo."
            : "This sample source has no approved findings yet. Review its suggestions before using them in an outcome conclusion.",
        points: [
          {
            label: "Evidence status",
            text: `${findings.length} reviewed findings · ${pending.length} suggestions awaiting review`,
          },
          {
            label: "Interpretation limit",
            text:
              findings[0]?.limitation ??
              "File presence or readable text alone does not establish outcome evidence.",
          },
        ],
        action: pending.length
          ? {
              label: "Review this source",
              href: `/review?item=${encodeURIComponent(pending[0].id)}`,
            }
          : upload,
        references: references(findings),
      };
    }
    case "review": {
      const proposal = (input.proposals ?? []).find(
        (item) => item.id === input.selectedId,
      );
      if (!proposal)
        return {
          ...base,
          question: "Which claims need a review decision?",
          summary:
            "There are no prepared suggestions to assess. Load the sample update to review tentative results, risks and lessons.",
          action: { label: "Load a sample document", href: "/sources" },
        };
      return {
        question: "What should the reviewer check?",
        summary: `Selected suggestion: “${proposal.title}”. Review status: ${proposal.status}. Check its wording against the original passage before accepting it as a finding.`,
        points: [
          { label: "Proposed interpretation", text: proposal.statement },
          { label: "Keep this uncertainty", text: proposal.limitation },
          {
            label: "Decision guidance",
            text: "Approve only the wording the source supports. Request context for missing detail, or reject an unsupported interpretation.",
          },
        ],
        action: {
          label: "Inspect source document",
          href: `/sources/view?id=${encodeURIComponent(proposal.citation.versionId)}`,
        },
        references: [],
      };
    }
    case "transparency": {
      const events = [...(input.events ?? [])].sort((a, b) =>
        b.occurredAt.localeCompare(a.occurredAt),
      );
      const pending = (input.proposals ?? []).filter(
        (proposal) =>
          proposal.status === "pending" || proposal.status === "flagged",
      );
      return {
        question: "How has the evidence been handled?",
        summary: `${events.length} actions are recorded in this browser. ${pending.length} suggestions still need a review decision. This view explains capture, interpretation and reuse of evidence.`,
        points: [
          {
            label: "Latest action",
            text: events[0]?.detail ?? "No actions recorded.",
          },
          {
            label: "Interpretation",
            text: "Review and upload events explain who handled evidence. They do not independently establish its accuracy or prove outcomes.",
          },
        ],
        action: {
          label: pending.length
            ? "Resolve pending reviews"
            : "Inspect evidence findings",
          href: pending.length ? "/review" : "/record",
        },
        references: [],
      };
    }
  }
}
