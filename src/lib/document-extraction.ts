import type { SourcePassage } from "./program-memory";

const LIMIT = 50_000;
export interface DocumentExtraction { passages: SourcePassage[]; note: string; }

/** Keep originals separately. Only plain strings become evidence, never document HTML. */
export async function extractDocument(file: File, sourceId: string): Promise<DocumentExtraction> {
  const passages: SourcePassage[] = [];
  let remaining = LIMIT;
  let truncated = false;
  function append(text: string, locator: string) {
    if (!text.trim()) return;
    if (text.length > remaining) truncated = true;
    const excerpt = text.slice(0, remaining);
    remaining -= excerpt.length;
    if (excerpt) passages.push({ id: `${sourceId}-p${passages.length + 1}`, locator, text: excerpt });
  }
  const ext = file.name.split(".").pop()?.toLowerCase();
  try {
    if (["txt", "csv", "tsv", "md", "json"].includes(ext ?? "")) {
      append(await file.text(), "Original text · UTF-8");
    } else if (ext === "docx") {
      const mammoth = await import("mammoth/mammoth.browser");
      const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
      result.value.split(/\n\s*\n/).forEach((paragraph, index) => append(paragraph, `Word paragraph ${index + 1} (extraction order)`));
    } else if (ext === "xlsx") {
      const { Workbook } = await import("exceljs");
      const workbook = new Workbook();
      await workbook.xlsx.load(await file.arrayBuffer());
      workbook.eachSheet((sheet) => sheet.eachRow((row) => {
        const cells: string[] = [];
        row.eachCell((cell) => {
          // Preserve locations and stored values. Do not calculate formulas or follow hyperlinks.
          if (cell.text) cells.push(`${cell.address}: ${cell.text}`);
        });
        append(cells.join(" | "), `Sheet ${sheet.name} · row ${row.number}`);
      }));
    } else {
      return { passages, note: ext === "pdf" ? "PDF saved · choose Analyze to read text and scanned pages with AI" : ["doc", "xls"].includes(ext ?? "") ? "Original saved · export as DOCX or XLSX for text extraction" : "Image saved · choose Analyze for AI reading" };
    }
    return { passages, note: passages.length ? `Text ready for review${truncated ? " · limited to first 50,000 characters; original retained" : ""}` : "Original saved · no readable text found" };
  } catch {
    return { passages: [], note: "Original saved · extraction failed; check whether the file is damaged or password-protected" };
  }
}
