import { Suspense } from "react";
import { ProgramTimelinePage } from "@/components/program/program-assurance-timeline";
export default function Page() {
  return <Suspense fallback={<p>Opening timeline…</p>}><ProgramTimelinePage /></Suspense>;
}
