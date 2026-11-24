import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useDemoStore } from "@/stores/demo-store";
import { useMemoryStore } from "@/stores/program-memory-store";
import { logWorkflowEvent } from "@/lib/demo-workflow-event";
import type { SourceVersion } from "@/lib/program-memory";
import { sourceSnapshot, type InputReview } from "@/lib/evidence-support";

export type OutputKind = "Analysis" | "Presentation" | "Report" | "Publication";
export type Requirement = {
  id: string;
  label: string;
  purpose: string;
  sourceId?: string;
  linkRevision?: number;
};
export type EvidenceTask = {
  plannedBudget?: number;
  currency?: string;
  activity?: string;
  fundingLabel?: string;
  designSourceId?: string;
  completedAt?: string;
  id: string;
  title: string;
  kind: string;
  start: string;
  due: string;
  requirementIds: string[];
};
export type OutputPlan = {
  id: string;
  title: string;
  kind: OutputKind;
  due: string;
  requirementIds: string[];
};
export const DEMO_REFERENCE_DATE = "2026-09-17";
export const outputTemplates: Record<OutputKind, string[]> = {
  Analysis: ["baseline", "attendance", "referrals", "methods"],
  Presentation: ["reach", "attendance", "finance"],
  Report: ["reach", "finance", "attendance", "referrals"],
  Publication: [
    "protocol",
    "consent",
    "irb",
    "baseline",
    "referrals",
    "methods",
  ],
};
const initialRequirements: Requirement[] = [
  {
    id: "cost-followup",
    label: "Delayed cost report",
    purpose: "Follow up on the delayed cost report.",
  },
  {
    id: "donor-support",
    label: "Donor report supporting documents",
    purpose: "Supply the supporting donor-report documents.",
  },
  {
    id: "procurement",
    label: "Purchase order & supplier invoice",
    purpose: "Document the purchase of 1,500 prenatal packages.",
  },
  {
    id: "stock-receipt",
    label: "Goods-received note & stock register",
    purpose:
      "Reconcile packages ordered, received and available for distribution.",
  },
  {
    id: "training-register",
    label: "Midwife training attendance register",
    purpose:
      "Record who attended the prenatal-package training; attendance alone does not show learning.",
  },
  {
    id: "training-reflection",
    label: "Trainer observations & participant feedback",
    purpose:
      "Capture confidence, unanswered questions and practical barriers while the session is fresh.",
  },
  {
    id: "distribution",
    label: "Package distribution register",
    purpose:
      "Reconcile the reported 1,240 recipients with packages issued, by district.",
  },
  {
    id: "reach",
    label: "Outreach delivery totals",
    purpose: "Describe delivery and participant reach.",
    sourceId: "field-report-v1",
  },
  {
    id: "finance",
    label: "Expenditure summary",
    purpose: "Explain costs and variances.",
    sourceId: "finance-v1",
  },
  {
    id: "attendance",
    label: "Before-and-after attendance",
    purpose: "Compare attendance after the outreach change.",
  },
  {
    id: "referrals",
    label: "Referral and care-access follow-up",
    purpose: "Assess whether people reached the intended care.",
  },
  {
    id: "baseline",
    label: "Baseline measurements",
    purpose: "Establish the comparison before interpreting change.",
  },
  {
    id: "methods",
    label: "Methods and data-quality notes",
    purpose: "Explain sampling, definitions and analytical limitations.",
  },
  {
    id: "protocol",
    label: "Research protocol",
    purpose: "Describe the proposed study for ethics review.",
  },
  {
    id: "consent",
    label: "Consent materials",
    purpose: "Support the planned IRB submission.",
  },
  {
    id: "irb",
    label: "IRB determination / approval",
    purpose: "Document the applicable ethics decision before publication.",
  },
];
const initialTasks: EvidenceTask[] = [
  {
    id: "package-procurement",
    title: "Procure 1,500 prenatal packages",
    kind: "Procurement",
    start: "2026-07-01",
    due: "2026-07-20",
    requirementIds: ["procurement", "stock-receipt"],
  },
  {
    id: "midwife-training",
    title: "Run midwife training session",
    kind: "Training",
    start: "2026-07-21",
    due: "2026-07-31",
    requirementIds: ["training-register", "training-reflection"],
  },
  {
    id: "package-distribution",
    title: "Distribute packages · 1,240 women reported",
    kind: "Delivery",
    start: "2026-08-01",
    due: "2026-08-31",
    requirementIds: ["reach", "distribution"],
  },
  {
    id: "recipient-followup",
    title: "Complete 30-day recipient follow-up",
    kind: "Follow-up",
    start: "2026-09-01",
    due: "2026-09-30",
    requirementIds: ["attendance", "referrals"],
  },
  {
    id: "delivery",
    title: "Outreach evidence closeout",
    kind: "M&E",
    start: "2026-08-01",
    due: "2026-08-31",
    requirementIds: ["reach"],
  },
  {
    id: "me-check",
    title: "M&E evidence check",
    kind: "M&E",
    start: "2026-09-10",
    due: "2026-09-22",
    requirementIds: ["baseline", "attendance"],
  },
  {
    id: "donor-call",
    title: "Donor call · every 2 months",
    kind: "Donor call",
    start: "2026-09-25",
    due: "2026-09-30",
    requirementIds: ["finance", "attendance"],
  },
  {
    id: "donor-report",
    title: "Donor progress report",
    kind: "Donor reporting",
    start: "2026-10-01",
    due: "2026-10-24",
    requirementIds: ["reach", "finance", "attendance", "referrals"],
  },
  {
    id: "irb-submission",
    title: "IRB submission",
    kind: "Ethics",
    start: "2026-07-01",
    due: "2026-07-10",
    requirementIds: ["protocol", "consent"],
  },
  {
    id: "biannual",
    title: "Biannual outcome report",
    kind: "Reporting",
    start: "2026-11-01",
    due: "2026-12-15",
    requirementIds: ["reach", "finance", "baseline", "referrals"],
  },
];
const initialOutputs: OutputPlan[] = [
  {
    id: "analysis",
    title: "Care-access outcome analysis",
    kind: "Analysis",
    due: "2027-01-31",
    requirementIds: outputTemplates.Analysis,
  },
  {
    id: "presentation",
    title: "Donor results presentation",
    kind: "Presentation",
    due: "2026-09-30",
    requirementIds: outputTemplates.Presentation,
  },
  {
    id: "report",
    title: "Donor progress report",
    kind: "Report",
    due: "2026-10-24",
    requirementIds: outputTemplates.Report,
  },
  {
    id: "publication",
    title: "Maternal care findings manuscript",
    kind: "Publication",
    due: "2027-03-31",
    requirementIds: outputTemplates.Publication,
  },
];

export function assessInputs(
  ids: string[],
  requirements: Requirement[],
  sources: SourceVersion[],
) {
  return ids.map((id) => {
    const requirement = requirements.find((item) => item.id === id) ?? {
      id,
      label: "Unspecified input",
      purpose: "Define this evidence requirement.",
    };
    const source = sources.find((item) => item.id === requirement.sourceId);
    return {
      ...requirement,
      source,
      missing: !source,
      unavailable: !!requirement.sourceId && !source,
    };
  });
}

type State = {
  setTaskPlanning: (id:string, plan:{plannedBudget?:number;currency:string;activity:string;fundingLabel:string})=>boolean;
  updateTask: (
    id: string,
    title: string,
    start: string,
    due: string,
    needs?: string[],
  ) => boolean;
  inputReviews: InputReview[];
  reviewInput: (
    requirementId: string,
    decision: InputReview["decision"],
    reason: string,
  ) => boolean;
  requirements: Requirement[];
  tasks: EvidenceTask[];
  setTaskDone: (id: string, done: boolean) => void;
  outputs: OutputPlan[];
  linkSource: (requirementId: string, sourceId: string) => void;
  addTask: (input: {
    title: string;
    kind: string;
    start: string;
    due: string;
    needs: string[];
    designSourceId?: string;
  }) => boolean;
  addOutput: (title: string, kind: OutputKind, due: string) => string | null;
  reset: () => void;
};
const seed = () => ({
  inputReviews: [] as InputReview[],
  requirements: initialRequirements.map((item) => ({ ...item })),
  tasks: initialTasks.map((item) => ({
    ...item,
    requirementIds: [...item.requirementIds],
  })),
  outputs: initialOutputs.map((item) => ({
    ...item,
    requirementIds: [...item.requirementIds],
  })),
});
const validDate = (value: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  !Number.isNaN(Date.parse(value)) &&
  new Date(value).toISOString().slice(0, 10) === value;
export const useOutputStore = create<State>()(
  persist(
    (set) => ({
      ...seed(),
      setTaskPlanning: (id,plan) => {
        if(useDemoStore.getState().role!=="program" || !useOutputStore.getState().tasks.some(t=>t.id===id) || (plan.plannedBudget!==undefined && (!Number.isFinite(plan.plannedBudget) || plan.plannedBudget<0)) || !/^[A-Z]{3}$/.test(plan.currency)) return false;
        set(s=>({tasks:s.tasks.map(t=>t.id===id?{...t,...plan}:t)}));
        logWorkflowEvent("TASK_PLAN_UPDATED",`Planning allocation updated for ${id}; not expenditure or funds received.`,"/program?view=design");
        return true;
      },
      updateTask: (id, title, start, due, needs) => {
        if (
          useDemoStore.getState().role !== "program" ||
          !title.trim() ||
          !validDate(start) ||
          !validDate(due) ||
          due < start ||
          start < "2026-01-01" ||
          due > "2028-12-31" ||
          !useOutputStore.getState().tasks.some((t) => t.id === id)
        )
          return false;
        const labels = needs
          ? [...new Set(needs.map((n) => n.trim()).filter(Boolean))]
          : undefined;
        if (labels && !labels.length) return false;
        set((s) => {
          const task = s.tasks.find((t) => t.id === id)!;
          const requirements = labels?.map(
            (label) =>
              s.requirements.find(
                (r) => task.requirementIds.includes(r.id) && r.label === label,
              ) ?? {
                id: crypto.randomUUID(),
                label,
                purpose: `Needed for ${title.trim()}.`,
              },
          );
          return {
            requirements: requirements
              ? [
                  ...s.requirements,
                  ...requirements.filter(
                    (r) => !s.requirements.some((old) => old.id === r.id),
                  ),
                ]
              : s.requirements,
            tasks: s.tasks.map((t) =>
              t.id === id
                ? {
                    ...t,
                    title: title.trim(),
                    start,
                    due,
                    requirementIds:
                      requirements?.map((r) => r.id) ?? t.requirementIds,
                  }
                : t,
            ),
          };
        });
        logWorkflowEvent(
          "PROGRAM_PLAN_REVISED",
          `${title.trim()}: ${start}–${due}.`,
          "/sources#program-design",
        );
        return true;
      },
      reviewInput: (requirementId, decision, reason) => {
        if (
          useDemoStore.getState().role !== "reviewer" ||
          !reason.trim() ||
          !["accepted", "needs-more"].includes(decision)
        )
          return false;
        const requirement = useOutputStore
          .getState()
          .requirements.find((r) => r.id === requirementId);
        const source = useMemoryStore
          .getState()
          .sources.find((s) => s.id === requirement?.sourceId);
        if (!requirement || !source) return false;
        const review: InputReview = {
          id: crypto.randomUUID(),
          requirementId,
          sourceId: source.id,
          sourceSnapshot: sourceSnapshot(source),
          linkRevision: requirement.linkRevision ?? 0,
          decision,
          reason: reason.trim(),
          actor: "M&E Reviewer · demo",
          occurredAt: new Date().toISOString(),
        };
        const previous = useOutputStore
          .getState()
          .inputReviews.find((r) => r.requirementId === requirementId);
        if (
          previous &&
          previous.sourceSnapshot === review.sourceSnapshot &&
          previous.linkRevision === review.linkRevision &&
          previous.decision === decision &&
          previous.reason === review.reason
        )
          return false;
        set((state) => ({ inputReviews: [review, ...state.inputReviews] }));
        logWorkflowEvent(
          "EVIDENCE_INPUT_REVIEWED",
          `${requirement.label}: ${decision}. ${review.reason} Source: ${source.id}.`,
          "/sources?request=" + encodeURIComponent(requirementId),
        );
        return true;
      },
      linkSource: (requirementId, sourceId) => {
        if (
          useDemoStore.getState().role === "funder" ||
          (sourceId &&
            !useMemoryStore
              .getState()
              .sources.some((source) => source.id === sourceId))
        )
          return;
        const current = useOutputStore
          .getState()
          .requirements.find((item) => item.id === requirementId);
        if (!current || (current.sourceId ?? "") === sourceId) return;
        set((state) => ({
          requirements: state.requirements.map((item) =>
            item.id === requirementId
              ? {
                  ...item,
                  sourceId: sourceId || undefined,
                  linkRevision: (item.linkRevision ?? 0) + 1,
                }
              : item,
          ),
        }));
        logWorkflowEvent(
          sourceId ? "OUTPUT_INPUT_LINKED" : "OUTPUT_INPUT_UNLINKED",
          `${current.label}: ${current.sourceId || "no source"} → ${sourceId || "no source"}. Any previous suitability review must be checked again.`,
          "/sources?request=" + encodeURIComponent(requirementId),
        );
      },
      setTaskDone: (id, done) => {
        if (useDemoStore.getState().role !== "program") return;
        const task = useOutputStore
          .getState()
          .tasks.find((item) => item.id === id);
        if (!task || !!task.completedAt === done) return;
        set((state) => ({
          tasks: state.tasks.map((item) =>
            item.id === id
              ? {
                  ...item,
                  completedAt: done ? new Date().toISOString() : undefined,
                }
              : item,
          ),
        }));
        logWorkflowEvent(
          "TASK_STATUS_CHANGED",
          `${task.title}: ${done ? "marked done" : "reopened"}. Completion is reported by the program team.`,
          "/program",
        );
      },
      addTask: (input) => {
        if (useDemoStore.getState().role === "funder") return false;
        const needs = [
          ...new Set(input.needs.map((value) => value.trim()).filter(Boolean)),
        ];
        if (
          !input.title.trim() ||
          !validDate(input.start) ||
          !validDate(input.due) ||
          input.due < input.start ||
          input.start < "2026-01-01" ||
          input.due > "2028-12-31" ||
          !needs.length
        )
          return false;
        const id = crypto.randomUUID();
        const requirements = needs.map((label, index) => ({
          id: `${id}-${index}`,
          label,
          purpose: `Needed for ${input.title.trim()}.`,
        }));
        set((state) => ({
          requirements: [...state.requirements, ...requirements],
          tasks: [
            ...state.tasks,
            {
              id,
              title: input.title.trim(),
              kind: input.kind,
              designSourceId: input.designSourceId,
              start: input.start,
              due: input.due,
              requirementIds: requirements.map((item) => item.id),
            },
          ],
        }));
        logWorkflowEvent(
          "EVIDENCE_ACTIVITY_ADDED",
          `${input.title.trim()} added with ${requirements.length} required evidence inputs.`,
          "/timeline",
        );
        return true;
      },
      addOutput: (title, kind, due) => {
        if (useDemoStore.getState().role === "funder") return null;
        if (!title.trim() || !outputTemplates[kind] || !validDate(due))
          return null;
        const id = crypto.randomUUID();
        set((state) => ({
          outputs: [
            ...state.outputs,
            {
              id,
              title: title.trim(),
              kind,
              due,
              requirementIds: [...outputTemplates[kind]],
            },
          ],
        }));
        logWorkflowEvent(
          "OUTPUT_PLANNED",
          `${kind} planned: ${title.trim()}.`,
          "/outputs",
        );
        return id;
      },
      reset: () => set(seed()),
    }),
    {
      name: "maptoc-output-intelligence-v1",
      version: 3,
      migrate: (persisted) => {
        const previous = persisted as Partial<State>;
        const defaults = seed();
        return {
          ...previous,
          inputReviews: previous.inputReviews ?? [],
          tasks: [
            ...(previous.tasks ?? []).map((task) =>
              task.id === "irb-submission" &&
              task.start === "2026-10-15" &&
              task.due === "2026-11-10"
                ? { ...task, start: "2026-07-01", due: "2026-07-10" }
                : task,
            ),
            ...defaults.tasks.filter(
              (item) =>
                !previous.tasks?.some((existing) => existing.id === item.id),
            ),
          ],
          requirements: [
            ...(previous.requirements ?? []),
            ...defaults.requirements.filter(
              (item) =>
                !previous.requirements?.some(
                  (existing) => existing.id === item.id,
                ),
            ),
          ],
          outputs: previous.outputs ?? defaults.outputs,
        };
      },
    },
  ),
);
