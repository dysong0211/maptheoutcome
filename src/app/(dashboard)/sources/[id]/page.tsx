import { SourceDetailView } from "@/components/program/program-workspace";
import { initialSources, incomingSource } from "@/lib/program-memory";

export function generateStaticParams() {
  return [...initialSources, incomingSource].map(({ id }) => ({ id }));
}

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <SourceDetailView id={id} />;
}
