import EvidenceDetail from "@/components/evidence/evidence-detail";
import { demoEvidence } from "@/lib/demo-data";

export function generateStaticParams() {
  return demoEvidence.map(({ id }) => ({ id }));
}

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EvidenceDetail id={id} />;
}
