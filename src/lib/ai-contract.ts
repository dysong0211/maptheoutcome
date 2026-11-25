import { z } from "zod";
import type { SourceVersion } from "./program-memory";

export const aiSourceSchema = z.object({
  id: z.string().min(1).max(200),
  title: z.string().min(1).max(300),
  sourceDate: z.string().max(80),
  version: z.number().int().positive(),
  passages: z
    .array(
      z.object({
        id: z.string().min(1).max(200),
        locator: z.string().max(300),
        text: z.string().max(50_000),
        origin: z.enum(["ai-transcription"]).optional(),
      }),
    )
    .max(100),
});
export const aiRequestSchema = z
  .object({
    mode: z.enum(["ask", "analyze", "requirements"]),
    question: z.string().trim().min(1).max(2000),
    sources: z.array(aiSourceSchema).min(1).max(40),
  })
  .superRefine((value, ctx) => {
    if ((value.mode === "analyze" || value.mode === "requirements") && value.sources.length !== 1)
      ctx.addIssue({
        code: "custom",
        message: "Analyze one document at a time.",
      });
    if (new Set(value.sources.map((s) => s.id)).size !== value.sources.length)
      ctx.addIssue({ code: "custom", message: "Duplicate source IDs." });
    if (JSON.stringify(value).length > 160_000)
      ctx.addIssue({
        code: "custom",
        message: "Select fewer documents (160,000 character limit).",
      });
  });
export type AIRequest = z.infer<typeof aiRequestSchema>;

export const documentSummarySchema = z.object({
  readable: z.boolean(),
  type: z.string().min(1).max(120),
  summary: z.string().min(1).max(900),
  suggestedConnection: z.string().max(300).nullable(),
});
export const aiRequirementSchema = z.object({
  statement: z.string().min(1).max(200),
  comparator: z.enum(["min", "max"]),
  threshold: z.number().finite(),
  unit: z.string().max(12),
  sourceId: z.string().min(1).max(200),
  passageId: z.string().max(200),
  quote: z.string().trim().min(1).max(1500),
  locator: z.string().min(1).max(300),
});
export const aiOutputSchema = z.object({
  requirements: z.array(aiRequirementSchema).max(8).optional(),
  document: documentSummarySchema.nullable().optional(),
  findings: z
    .array(
      z.object({
        title: z.string().min(1).max(160),
        kind: z.enum([
          "Result",
          "Decision",
          "Risk",
          "Change",
          "Lesson",
          "Question",
        ]),
        statement: z.string().min(1).max(1500),
        limitation: z.string().min(1).max(1000),
        sourceId: z.string().min(1).max(200),
        passageId: z.string().max(200),
        quote: z.string().trim().min(1).max(3000),
        eventDate: z.string().max(20).nullable().optional(),
        placeInQuote: z.string().max(80).nullable().optional(),
        locator: z.string().min(1).max(300),
      }),
    )
    .max(6),
  nextSteps: z.array(z.string().min(1).max(500)).max(4),
});
// New provider responses must include the document field; old saved responses remain readable.
export const aiProviderOutputSchema = aiOutputSchema.extend({
  document: documentSummarySchema.nullable(),
  requirements: z.array(aiRequirementSchema).max(8),
});
export type AIOutput = z.infer<typeof aiOutputSchema>;
export type AIResult = AIOutput & {
  runId: string;
  model: string;
  generatedAt: string;
  transcription: boolean;
};

// Return only source fields intended for the provider; never send the full store.
export function aiSource(
  source: SourceVersion,
): z.infer<typeof aiSourceSchema> {
  return {
    id: source.id,
    title: source.title,
    version: source.version,
    sourceDate: source.sourceDate,
    passages: source.passages,
  };
}

export function validateAIOutput(
  raw: unknown,
  request: AIRequest,
  transcription: boolean,
): AIOutput {
  const output = aiOutputSchema.parse(raw);
  if (output.document?.readable === false && output.findings.length)
    throw new Error("Unreadable documents cannot produce findings.");
  for (const finding of output.findings) {
    // A place is kept only when those exact words appear in the quoted passage. Otherwise it is dropped, never guessed.
    const place = (finding.placeInQuote ?? "").trim();
    finding.placeInQuote = place && finding.quote.includes(place) ? place : null;
    const source = request.sources.find((s) => s.id === finding.sourceId);
    if (!source)
      throw new Error("The AI response referenced an unknown source.");
    if (!transcription) {
      const passage = source.passages.find((p) => p.id === finding.passageId);
      if (!passage || !passage.text.includes(finding.quote))
        throw new Error(
          "A quotation could not be matched to its source. Please try again.",
        );
      finding.locator = passage.locator;
    }
  }
  if (request.mode !== "requirements" && output.requirements?.length)
    throw new Error("Requirements are only returned in requirements mode.");
  if (request.mode === "requirements" && output.findings.length)
    throw new Error("Requirements mode returns requirements, not findings.");
  // Drop any suggestion whose quote or number cannot be checked against the source text.
  if (output.requirements) {
    output.requirements = output.requirements.filter((req) => {
      const source = request.sources.find((s) => s.id === req.sourceId);
      const passage = source?.passages.find((p) => p.id === req.passageId);
      if (!source || !passage || !passage.text.includes(req.quote)) return false;
      if (!req.quote.replace(/,/g, "").includes(String(req.threshold))) return false;
      req.locator = passage.locator;
      return true;
    });
  }
  return output;
}
