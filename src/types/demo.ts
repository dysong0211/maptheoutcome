export type DemoRole = "funder" | "program" | "reviewer";

export type DeliveryStatus = "planned" | "in-progress" | "reported-complete";
export type EvidenceStatus = "processing" | "available" | "needs-context";
export type ReviewStatus = "not-submitted" | "submitted" | "context-requested" | "accepted";
export type OutcomeStatus = "not-assessed" | "progress-reported" | "target-reported-met";

export interface Program {
  id: string;
  name: string;
  grantee: string;
  code: string;
  reportingPeriod: string;
  reportingDue: string;
  frameworkVersion: string;
  deliveryProgress: number;
  evidenceCoverage: number;
  reviewStatus: ReviewStatus;
  budget: number;
  spent: number;
}

export interface OutcomeNode {
  id: string;
  kind: "goal" | "program" | "activity" | "milestone" | "outcome";
  label: string;
  eyebrow: string;
  description: string;
  status?: DeliveryStatus | OutcomeStatus;
  metric?: string;
  parentId?: string;
}

export interface FrameworkRule {
  id: string;
  label: string;
  value: string;
  required: boolean;
  owner: "Funder" | "Program";
}

export interface EvidenceItem {
  history?: EvidenceVersion[];
  id: string;
  name: string;
  type: "PDF" | "CSV" | "Image" | "Document";
  version: number;
  size: string;
  uploadedBy: string;
  uploadedAt: string;
  linkedNodeId?: string;
  linkedNodeLabel?: string;
  status: EvidenceStatus;
  source: "seeded" | "session";
}

export interface EvidenceVersion {
  version: number;
  name: string;
  size: string;
  uploadedAt: string;
  uploadedBy: string;
  reason: string;
}

export interface AuditEvent {
  id: string;
  sequence: number;
  occurredAt: string;
  actor: string;
  action: "FRAMEWORK_ASSIGNED" | "EVIDENCE_UPLOADED" | "EVIDENCE_REPLACED" | "EVIDENCE_LINKED" | "STATUS_CHANGED" | "REVIEW_DECISION";
  summary: string;
  detail: string;
  resourceType: "Framework" | "Evidence" | "Milestone" | "Submission";
  resourceId: string;
}
