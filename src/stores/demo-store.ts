"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import { demoEvents, demoEvidence, demoNodes, demoProgram, frameworkRules } from "@/lib/demo-data";
import type { AuditEvent, DemoRole, EvidenceItem, ReviewStatus } from "@/types/demo";

// Pilot workspace runs as a single-operator demo: one participant performs both
// the submit (Program Manager) and review (M&E Reviewer) steps. This is a demo
// convenience, not real role-based access control.
export const pilotSingleOperator =
  process.env.NEXT_PUBLIC_MAPTOC_PILOT_MODE === "true";

interface UploadInput {
  name: string;
  type: EvidenceItem["type"];
  size: string;
  linkedNodeId?: string;
  linkedNodeLabel?: string;
}

interface DemoState {
  role: DemoRole;
  program: typeof demoProgram;
  nodes: typeof demoNodes;
  rules: typeof frameworkRules;
  evidence: EvidenceItem[];
  events: AuditEvent[];
  setRole: (role: DemoRole) => void;
  uploadEvidence: (input: UploadInput) => void;
  reviseEvidence: (id: string, name: string, reason: string) => void;
  mapEvidence: (id: string, nodeId: string) => void;
  setReviewStatus: (status: ReviewStatus, reason: string) => void;
  resetDemo: () => void;
}

function nowLabel() {
  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());
}

export const useDemoStore = create<DemoState>()(
  persist(
    (set) => ({
      role: "program",
      program: demoProgram,
      nodes: demoNodes,
      rules: frameworkRules,
      evidence: demoEvidence,
      events: demoEvents,
      setRole: (role) => set({ role }),
      reviseEvidence: (id, name, reason) => set((state) => {
        const item = state.evidence.find((entry) => entry.id === id);
        if (state.role !== "program" || !item || !name.trim() || !reason.trim()) return state;
        const occurredAt = nowLabel();
        return {
          evidence: state.evidence.map((entry) => entry.id !== id ? entry : {
            ...entry, name: name.trim(), version: entry.version + 1, uploadedAt: occurredAt,
            uploadedBy: "Maya Chen", source: "session", status: "needs-context",
            history: [...(entry.history ?? []), { version: entry.version, name: entry.name,
              size: entry.size, uploadedAt: entry.uploadedAt, uploadedBy: entry.uploadedBy, reason: reason.trim() }],
          }),
          events: [{ id: crypto.randomUUID(), sequence: Math.max(...state.events.map((event) => event.sequence)) + 1,
            occurredAt, actor: "Maya Chen · Program Manager", action: "EVIDENCE_REPLACED",
            summary: `Evidence replaced: v${item.version} → v${item.version + 1}`,
            detail: `${item.name} → ${name.trim()}. Reason: ${reason.trim()}. Previous metadata retained; file storage is simulated.`,
            resourceType: "Evidence", resourceId: id } as AuditEvent, ...state.events],
        };
      }),
      mapEvidence: (id, nodeId) => set((state) => {
        const node = state.nodes.find((entry) => entry.id === nodeId && ["milestone", "outcome"].includes(entry.kind));
        const item = state.evidence.find((entry) => entry.id === id);
        if (state.role !== "program" || !item || !node || item.linkedNodeId === nodeId) return state;
        return {
          evidence: state.evidence.map((entry) => entry.id !== id ? entry : { ...entry, linkedNodeId: node.id, linkedNodeLabel: node.label }),
          events: [{ id: crypto.randomUUID(), sequence: Math.max(...state.events.map((event) => event.sequence)) + 1,
            occurredAt: nowLabel(), actor: "Maya Chen · Program Manager", action: "EVIDENCE_LINKED",
            summary: "Evidence mapping updated", detail: `${item.name} v${item.version}: ${item.linkedNodeLabel ?? "Unmapped"} → ${node.label}.`,
            resourceType: "Evidence", resourceId: id } as AuditEvent, ...state.events],
        };
      }),
      uploadEvidence: (input) =>
        set((state) => {
          if (state.role !== "program") return state;
          const id = `evidence-session-${crypto.randomUUID()}`;
          const evidence: EvidenceItem = {
            id,
            name: input.name,
            type: input.type,
            version: 1,
            size: input.size,
            uploadedBy: "Maya Chen",
            uploadedAt: nowLabel(),
            linkedNodeId: input.linkedNodeId,
            linkedNodeLabel: input.linkedNodeLabel,
            status: "processing",
            source: "session",
          };
          const event: AuditEvent = {
            id: `event-${crypto.randomUUID()}`,
            sequence: Math.max(...state.events.map((item) => item.sequence)) + 1,
            occurredAt: nowLabel(),
            actor: "Maya Chen · Program Manager",
            action: "EVIDENCE_UPLOADED",
            summary: "Evidence added to reporting workspace",
            detail: input.linkedNodeLabel
              ? `${input.name} was uploaded and linked to ${input.linkedNodeLabel}.`
              : `${input.name} was uploaded for mapping later.`,
            resourceType: "Evidence",
            resourceId: id,
          };
          return { evidence: [evidence, ...state.evidence], events: [event, ...state.events] };
        }),
      setReviewStatus: (reviewStatus, reason) =>
        set((state) => ({
          program: { ...state.program, reviewStatus },
          events: [
            {
              id: `event-${crypto.randomUUID()}`,
              sequence: Math.max(...state.events.map((item) => item.sequence)) + 1,
              occurredAt: nowLabel(),
              actor: state.role === "funder" ? "Ari Okafor · Reviewer" : "Maya Chen · Program Manager",
              action: "REVIEW_DECISION",
              summary: reviewStatus === "accepted" ? "Q2 submission accepted for reporting" : "Q2 submission status changed",
              detail: reason,
              resourceType: "Submission",
              resourceId: "submission-q2",
            },
            ...state.events,
          ],
        })),
      resetDemo: () => set({
        role: "program",
        program: demoProgram,
        nodes: demoNodes,
        rules: frameworkRules,
        evidence: demoEvidence,
        events: demoEvents,
      }),
    }),
    { name: "maptoc-investor-demo" },
  ),
);
