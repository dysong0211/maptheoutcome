"use client";

import { useEffect, useState } from "react";
import { aiSource, type AIRequest, type AIResult } from "./ai-contract";
import { getCapturedFile } from "./browser-file-store";
import { useMemoryStore } from "@/stores/program-memory-store";
import type { SourceVersion } from "./program-memory";
import type { ConnectRequest, ConnectResult } from "./ai-connect-contract";

export function aiProviderName(provider?: string) {
  return provider === "gemini" ? "Google Gemini" : "OpenAI";
}

export function useAIStatus() {
  const [status, setStatus] = useState({
    ready: false,
    model: "",
    provider: "openai",
    message: "Checking AI connection…",
  });
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_WEBSITE_HOME === "/") {
      setStatus({
        ready: false,
        model: "",
        provider: "openai",
        message: "Live AI requires the server app; this is the static demo.",
      });
      return;
    }
    const controller = new AbortController();
    fetch("/api/ai", { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "AI unavailable");
        setStatus(data);
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setStatus({
            ready: false,
            model: "",
            provider: "openai",
            message: error instanceof Error ? error.message : "AI unavailable",
          });
      });
    return () => controller.abort();
  }, []);
  return status;
}

export async function requestAI(
  request: AIRequest,
  file?: File,
): Promise<AIResult> {
  let body: BodyInit = JSON.stringify(request);
  if (file) {
    const form = new FormData();
    form.set("request", body);
    form.set("file", file);
    body = form;
  }
  const response = await fetch("/api/ai", {
    method: "POST",
    body,
    headers: file ? undefined : { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(160_000),
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error || "AI request failed. Please retry.");
  return data as AIResult;
}

export async function analyzeSource(source: SourceVersion) {
  let file: File | undefined;
  if (!source.passages.length) {
    const blob = await getCapturedFile(source.id);
    if (!blob)
      throw new Error(
        "Original file unavailable in this browser. Upload it again to analyze.",
      );
    file = new File([blob], source.originalFileName || source.title, {
      type: source.mimeType,
    });
  }
  const result = await requestAI(
    {
      mode: "analyze",
      sources: [aiSource(source)],
      question:
        ["program-design","protocol","irb","sop","questionnaire"].includes(source.category??"")
          ? "Read this program design or protocol. Summarize its objectives, planned outcomes and evidence requirements. Cite the source for each finding. In nextSteps propose the key deliverables and specific documents to collect for tracking, mentioning deadlines only when explicitly stated. Treat plans as plans, not achieved outcomes. Do not invent dates, commitments or requirements; identify missing information for human review."
          : "Extract the significant outcome evidence, financial context, risks, qualitative insights and missing information from this document.",
    },
    file,
  );
  if (!useMemoryStore.getState().addAIAnalysis(source, result))
    throw new Error(
      "The source or your role changed during analysis. Return to Program Manager and retry.",
    );
  return result;
}

/** Ask the AI for explicit numeric agreement requirements. Suggestions only; a reviewer must confirm each one. */
export async function suggestRequirements(source: SourceVersion) {
  if (!source.passages.some((p) => p.text.trim()))
    throw new Error("This document has no readable text in the browser yet. Analyze it first, then suggest requirements.");
  return requestAI({
    mode: "requirements",
    sources: [aiSource(source)],
    question:
      "List the explicit, measurable requirements or conditions in this agreement as requirements, each with an exact quotation. Do not list anything without a stated number.",
  });
}

/** One AI call over approved findings. Returns proposals only; nothing is saved until a reviewer accepts. */
export async function requestConnections(request: ConnectRequest): Promise<ConnectResult> {
  const response = await fetch("/api/ai", {
    method: "POST",
    body: JSON.stringify(request),
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(160_000),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "AI request failed. Please retry.");
  return data as ConnectResult;
}
