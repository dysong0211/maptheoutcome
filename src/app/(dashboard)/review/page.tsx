import { Suspense } from "react";
import { ReviewView } from "@/components/program/program-workspace";

export default function Page() {
  return <Suspense fallback={<p className="p-8 text-sm text-slate-500">Loading workspace…</p>}><ReviewView /></Suspense>;
}
