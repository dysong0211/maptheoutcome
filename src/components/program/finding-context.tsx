import type { ProgramRecord, SourceVersion } from "@/lib/program-memory";

export function FindingContext({record,source}:{record:ProgramRecord;source?:SourceVersion}) {
  const format=(value:string)=>new Date(value.slice(0,10)+"T12:00:00").toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"});
  const period=source && source.origin !== "browser-upload" && ["field-report-v1","finance-v1"].includes(source.id)
    ? "01 Aug–31 Aug 2026 · reporting period"
    : `${format(record.eventDate)} · event date; period not specified`;
  return <div className="finding-context"><strong>{source?.title ?? "Source unavailable"}</strong><span>{source ? `Document dated ${format(source.sourceDate)}` : "Document date unavailable"}</span><span>{period}</span></div>;
}
