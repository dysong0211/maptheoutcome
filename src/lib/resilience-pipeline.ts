import { z } from "zod";

/** Provider-neutral contracts for messy field evidence. Adapters (OCR, translation,
 * exchange rates) can be wired in later without changing the review logic. */
export const extractedFindingSchema = z.object({
  type: z.enum(["Input", "Activity", "Output", "Outcome", "Risk", "Decision"]),
  statement: z.string().min(1),
  value: z.number().finite().optional(),
  unit: z.string().optional(),
  date: z.string().optional(),
  sourceLocator: z.string().optional(),
  confidence: z.number().min(0).max(1),
});
export type ExtractedFinding = z.infer<typeof extractedFindingSchema>;

export const extractionEnvelopeSchema = z.object({
  findings: z.array(extractedFindingSchema),
  warnings: z.array(z.string()),
  language: z.string().length(2).default("en"),
  translated: z.boolean().default(false),
});
export type ExtractionEnvelope = z.infer<typeof extractionEnvelopeSchema>;

export type IngestionFlag =
  | "OCR_REQUIRED"
  | "CSV_SCHEMA_UNCLEAR"
  | "TRANSLATION_REQUIRED"
  | "UNLINKED_MEDIA_EVIDENCE"
  | "NARRATIVE_DATA_MISMATCH"
  | "FINANCIAL_VARIANCE"
  | "DUPLICATE_RECEIPT"
  | "TIMELINE_ANOMALY"
  | "GEOGRAPHY_ANOMALY"
  | "PII_REVIEW_REQUIRED";

export interface IngestionInput {
  fileName: string;
  mimeType?: string;
  hasSelectableText?: boolean;
  language?: string;
  hasExif?: boolean;
  csvSample?: string;
}

export interface IngestionAssessment {
  normalizedName: string;
  format: "pdf" | "csv" | "image" | "media" | "document" | "unknown";
  flags: IngestionFlag[];
  nextAction: string;
}

const extension = (name: string) => name.toLowerCase().split(".").pop() ?? "";
export function assessIngestion(input: IngestionInput): IngestionAssessment {
  const ext = extension(input.fileName);
  const format = ext === "pdf" ? "pdf" : ext === "csv" ? "csv" : ["jpg", "jpeg", "png"].includes(ext) ? "image" : ["mp4", "mov", "wav"].includes(ext) ? "media" : ["doc", "docx", "txt"].includes(ext) ? "document" : "unknown";
  const flags: IngestionFlag[] = [];
  if (format === "pdf" && input.hasSelectableText === false) flags.push("OCR_REQUIRED");
  if (format === "csv" && (!input.csvSample || !/[;,\t]/.test(input.csvSample))) flags.push("CSV_SCHEMA_UNCLEAR");
  if (input.language && input.language.toLowerCase() !== "en") flags.push("TRANSLATION_REQUIRED");
  if ((format === "image" || format === "media") && input.hasExif === false) flags.push("UNLINKED_MEDIA_EVIDENCE");
  return {
    normalizedName: input.fileName.normalize("NFKC").trim(),
    format,
    flags,
    nextAction: flags[0] === "OCR_REQUIRED" ? "Run OCR with auto-rotation, then request review." : flags[0] === "CSV_SCHEMA_UNCLEAR" ? "Show a column-mapping step before extraction." : flags[0] === "TRANSLATION_REQUIRED" ? "Translate for analysis while retaining the original text." : flags[0] === "UNLINKED_MEDIA_EVIDENCE" ? "Ask the uploader to link date and location." : "Ready for structured extraction.",
  };
}

export function validateExtraction(value: unknown): { data?: ExtractionEnvelope; errors: string[] } {
  const result = extractionEnvelopeSchema.safeParse(value);
  return result.success ? { data: result.data, errors: [] } : { errors: result.error.issues.map((issue) => `${issue.path.join(".") || "payload"}: ${issue.message}`) };
}

export function narrativeDataMismatch(claimed: number, observed: number, tolerance = 0.05): boolean {
  if (!Number.isFinite(claimed) || claimed === 0 || !Number.isFinite(observed)) return true;
  return Math.abs(claimed - observed) / Math.abs(claimed) > tolerance;
}

export function financialFlags(input: { amount: number; budget: number; projectStart: string; projectEnd: string; transactionDate: string; receiptHash?: string; seenHashes?: string[] }): IngestionFlag[] {
  const flags: IngestionFlag[] = [];
  if (input.amount > input.budget * 1.1) flags.push("FINANCIAL_VARIANCE");
  if (input.seenHashes?.includes(input.receiptHash ?? "")) flags.push("DUPLICATE_RECEIPT");
  if (input.transactionDate < input.projectStart || input.transactionDate > input.projectEnd) flags.push("TIMELINE_ANOMALY");
  return flags;
}

export function coordinateFlags(input: { latitude: number; longitude: number; bounds: { minLat: number; maxLat: number; minLon: number; maxLon: number }; centralOffice?: { latitude: number; longitude: number } }): IngestionFlag[] {
  const { latitude, longitude, bounds, centralOffice } = input;
  const flags: IngestionFlag[] = [];
  if (![latitude, longitude].every(Number.isFinite) || latitude < bounds.minLat || latitude > bounds.maxLat || longitude < bounds.minLon || longitude > bounds.maxLon) flags.push("GEOGRAPHY_ANOMALY");
  if (centralOffice && Math.abs(latitude - centralOffice.latitude) < 0.0001 && Math.abs(longitude - centralOffice.longitude) < 0.0001) flags.push("GEOGRAPHY_ANOMALY");
  return flags;
}

export interface PlanVersion { id: string; effectiveFrom: string; target: number; budget: number; reason: string; }
export function activePlan(versions: PlanVersion[], asOf: string): PlanVersion | undefined {
  return [...versions].filter((version) => version.effectiveFrom <= asOf).sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom))[0];
}

export interface EvidenceGap { id: string; label: string; reason: string; dueDate: string; severity: "high" | "medium"; }
export function synthesizeGaps(required: string[], observed: string[], dueDate: string): EvidenceGap[] {
  const seen = new Set(observed.map((value) => value.toLowerCase()));
  return required.filter((item) => !seen.has(item.toLowerCase())).map((label, index) => ({ id: `gap-${index + 1}`, label, reason: `Required input is not yet linked to a source.`, dueDate, severity: "high" as const }));
}
