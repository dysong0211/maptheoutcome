import { Suspense } from "react";
import { QueryEvidenceDetail } from "@/components/program/query-detail";

export default function Page() {
  return (
    <Suspense fallback={<p className="p-8">Loading evidence…</p>}>
      <QueryEvidenceDetail />
    </Suspense>
  );
}
