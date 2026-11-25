import { connectRequestSchema } from "@/lib/ai-connect-contract";
import { generateConnections } from "@/lib/ai-connect-server";
import { aiRequestSchema } from "@/lib/ai-contract";
import {
  AIError,
  aiConfiguration,
  generateAI,
  requireLocalRequest,
  reserveAIRequest,
} from "@/lib/ai-server";
import { getPilotAccount, pilotAuthEnabled } from "@/lib/supabase/pilot-auth";
import { validateCaptureFile } from "@/lib/browser-file-store";
import {
  hasPilotAccessSession,
  pilotAccessCodeEnabled,
  verifyPilotRequestOrigin,
} from "@/lib/pilot-access-code";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const MAX_BYTES = 16 * 1024 * 1024;

async function authorizeAI(request: Request) {
  if (pilotAccessCodeEnabled()) {
    if (request.method === "POST" && !verifyPilotRequestOrigin(request)) {
      throw new AIError(403, "AI requests must come from the configured MapToc pilot origin.");
    }
    if (!(await hasPilotAccessSession())) {
      throw new AIError(401, "Enter the MapToc pilot access code to use AI.");
    }
    return;
  }
  if (!pilotAuthEnabled()) {
    requireLocalRequest(request);
    if (process.env.NODE_ENV === "production") {
      throw new AIError(503, "AI is not configured for this deployment.");
    }
    return;
  }
  if (
    request.method === "POST" &&
    (!process.env.MAPTOC_APP_ORIGIN ||
      request.headers.get("origin") !== process.env.MAPTOC_APP_ORIGIN)
  ) {
    throw new AIError(403, "AI requests must come from the configured MapToc pilot origin.");
  }
  const account = await getPilotAccount();
  if (!account) throw new AIError(401, "Sign in with an authorized MapToc pilot account to use AI.");
}

function failure(error: unknown) {
  return Response.json(
    {
      error:
        error instanceof AIError
          ? error.message
          : "Invalid AI request. Check your documents and try again.",
    },
    {
      status: error instanceof AIError ? error.status : 400,
      headers: { "Cache-Control": "no-store" },
    },
  );
}

export async function GET(request: Request) {
  try {
    await authorizeAI(request);
    return Response.json(aiConfiguration(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: Request) {
  let release: (() => void) | undefined;
  try {
    await authorizeAI(request);
    const config = aiConfiguration();
    if (!config.ready) throw new AIError(503, config.message);
    release = reserveAIRequest();
    // Enforce the limit while streaming, including requests without Content-Length.
    const reader = request.body?.getReader();
    if (!reader) throw new AIError(400, "An evidence request is required.");
    let total = 0;
    const chunks: Uint8Array[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_BYTES) {
        await reader.cancel();
        throw new AIError(413, "Request exceeds the 16 MB limit.");
      }
      chunks.push(value);
    }
    const body = new Response(Buffer.concat(chunks), {
      headers: { "Content-Type": request.headers.get("content-type") || "" },
    });
    let raw: unknown;
    let file: File | undefined;
    if (
      request.headers.get("content-type")?.startsWith("multipart/form-data")
    ) {
      const form = await body.formData();
      raw = JSON.parse(String(form.get("request")));
      const entry = form.get("file");
      if (entry instanceof File) {
        file = entry;
        const error = validateCaptureFile(file);
        if (error) throw new AIError(400, error);
      }
    } else raw = await body.json();
    if ((raw as { mode?: string } | null)?.mode === "connect") {
      const connect = connectRequestSchema.safeParse(raw);
      if (!connect.success || file)
        throw new AIError(400, "Select 2 to 30 approved findings to connect.");
      return Response.json(await generateConnections(connect.data, request.signal), {
        headers: { "Cache-Control": "no-store" },
      });
    }
    const parsed = aiRequestSchema.safeParse(raw);
    if (!parsed.success)
      throw new AIError(
        400,
        "Select 1–40 documents and a question, within the 160,000 character limit.",
      );
    if (
      file &&
      (parsed.data.mode !== "analyze" || parsed.data.sources[0].passages.length)
    )
      throw new AIError(
        400,
        "File analysis must target one document without extracted passages.",
      );
    if (
      !file &&
      !parsed.data.sources.some((s) => s.passages.some((p) => p.text.trim()))
    )
      throw new AIError(400, "No readable evidence. Analyze a document first.");
    return Response.json(await generateAI(parsed.data, file, request.signal), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return failure(error);
  } finally {
    release?.();
  }
}
