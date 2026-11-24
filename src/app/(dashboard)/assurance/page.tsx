"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AssuranceWorkspace } from "@/components/program/assurance-workspace";
function AssurancePage() {
  const selected = useSearchParams().get("view");
  const view = selected === "history" ? "history" : "overview";
  return <AssuranceWorkspace view={view} />;
}
export default function Page() {
  return (
    <Suspense fallback={<p>Loading assurance…</p>}>
      <AssurancePage />
    </Suspense>
  );
}
