import { z } from "zod";

export const connectRecordSchema = z.object({
  id: z.string().min(1).max(200),
  title: z.string().max(200),
  kind: z.string().max(40),
  theme: z.string().max(40),
  eventDate: z.string().max(20),
  statement: z.string().max(1500),
  sourceId: z.string().max(200),
  sourceTitle: z.string().max(300),
  quote: z.string().max(3000),
});
export const connectRequestSchema = z.object({
  mode: z.literal("connect"),
  programName: z.string().max(300),
  objective: z.string().max(1500),
  records: z.array(connectRecordSchema).min(2).max(30),
});
export type ConnectRequest = z.infer<typeof connectRequestSchema>;

const ids = (min: number, max: number) => z.array(z.string().min(1).max(200)).min(min).max(max);
export const connectOutputSchema = z.object({
  links: z
    .array(
      z.object({
        fromId: z.string().min(1).max(200),
        toId: z.string().min(1).max(200),
        type: z.enum(["explains", "contributed-to", "left-gap-for", "same-topic"]),
        explanation: z.string().min(1).max(400),
        basis: z.enum(["stated-in-sources", "ai-hypothesis"]),
        evidenceQuote: z.string().max(600),
      }),
    )
    .max(12),
  gaps: z
    .array(
      z.object({
        question: z.string().min(1).max(300),
        reason: z.string().min(1).max(500),
        relatedIds: ids(1, 4),
        missingEvidence: z.string().min(1).max(300),
      }),
    )
    .max(5),
  pathways: z
    .array(
      z.object({
        title: z.string().min(1).max(160),
        stepIds: ids(2, 6),
        explanation: z.string().min(1).max(500),
      }),
    )
    .max(3),
  lessons: z
    .array(
      z.object({
        statement: z.string().min(1).max(400),
        basedOnIds: ids(1, 4),
        caveat: z.string().min(1).max(300),
      }),
    )
    .max(4),
});
export type ConnectOutput = z.infer<typeof connectOutputSchema>;
export type ConnectResult = ConnectOutput & { runId: string; model: string; generatedAt: string };

export function validateConnectOutput(raw: unknown, request: ConnectRequest): ConnectOutput {
  const out = connectOutputSchema.parse(raw);
  const by = new Map(request.records.map((r) => [r.id, r]));
  const known = (list: string[]) => list.every((id) => by.has(id));
  const seen = new Set<string>();
  out.links = out.links.filter((l) => {
    if (l.fromId === l.toId || !by.has(l.fromId) || !by.has(l.toId)) return false;
    const key = [l.fromId, l.toId].sort().join("|");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  for (const l of out.links) {
    const q = l.evidenceQuote.trim();
    const from = by.get(l.fromId)!;
    const to = by.get(l.toId)!;
    // "Stated in sources" only survives when the quote is verbatim in a cited passage of one of the two findings.
    if (l.basis === "stated-in-sources" && !(q && (from.quote.includes(q) || to.quote.includes(q)))) {
      l.basis = "ai-hypothesis";
      l.evidenceQuote = "";
    }
  }
  out.gaps = out.gaps.filter((g) => known(g.relatedIds));
  out.pathways = out.pathways.filter((p) => known(p.stepIds) && new Set(p.stepIds).size === p.stepIds.length);
  out.lessons = out.lessons.filter((l) => known(l.basedOnIds));
  return out;
}
