import { Suspense } from "react";
import { IntelligenceHome } from "@/components/program/intelligence-home";

export default function Page() {
  return (
    <Suspense
      fallback={
        <p className="p-8 text-sm text-slate-500">Loading workspace…</p>
      }
    >
      <IntelligenceHome />
    </Suspense>
  );
}
