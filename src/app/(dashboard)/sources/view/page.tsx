import { Suspense } from "react";
import { QuerySourceDetail } from "@/components/program/query-detail";

export default function Page() {
  return (
    <Suspense fallback={<p className="p-8">Loading source…</p>}>
      <QuerySourceDetail />
    </Suspense>
  );
}
