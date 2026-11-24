import { Suspense } from "react";
import { ProgramSummaryPage } from "@/components/program/program-summary-page";

export default function Page() {
  return <Suspense fallback={<p>Opening program…</p>}><ProgramSummaryPage /></Suspense>;
}
