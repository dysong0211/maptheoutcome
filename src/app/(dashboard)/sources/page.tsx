import { Suspense } from "react";
import { RepositoryWorkspace } from "@/components/program/repository-workspace";

export default function Page() {
  return (
    <Suspense
      fallback={
        <p className="p-8 text-sm text-slate-500">Loading workspace…</p>
      }
    >
      <RepositoryWorkspace />
    </Suspense>
  );
}
