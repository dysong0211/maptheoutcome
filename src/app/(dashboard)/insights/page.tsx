import { Suspense } from "react";
import { InsightsWorkspace } from "@/components/program/insights-workspace";
export default function Page() {
  return (
    <Suspense fallback={<p>Loading insights…</p>}>
      <InsightsWorkspace />
    </Suspense>
  );
}
