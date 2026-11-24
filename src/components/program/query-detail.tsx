"use client";

import { useSearchParams } from "next/navigation";
import { SourceDetailView } from "@/components/program/program-workspace";
import EvidenceDetail from "@/components/evidence/evidence-detail";

// Query routes support browser-created IDs on static hosts, including a direct reload.
export function QuerySourceDetail() {
  return <SourceDetailView id={useSearchParams().get("id") ?? ""} />;
}

export function QueryEvidenceDetail() {
  return <EvidenceDetail id={useSearchParams().get("id") ?? ""} />;
}
