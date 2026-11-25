"use client";
import { localDay } from "@/lib/local-date";
import { useState } from "react";
import Link from "next/link";
import { MessageSquare, Sparkles } from "lucide-react";
import { useProgramEvidence } from "./use-program-evidence";
import { useDemoStore } from "@/stores/demo-store";
import { useReflectionStore, insightStatus } from "@/stores/reflection-store";

export function OfficerInsights({
  sourceId,
  readOnly = false,
}: {
  sourceId?: string;
  readOnly?: boolean;
}) {
  const { sources: scopedSources, memorySourceIds } = useProgramEvidence();
  const sources = scopedSources.filter((source) =>
    memorySourceIds.has(source.id),
  );
  const reflections = useReflectionStore((state) => state.reflections);
  const role = useDemoStore((state) => state.role);
  const [selectedSource, setSource] = useState(sourceId ?? "");
  const [prompt, setPrompt] = useState(
    "What went well or exceeded expectations, and what made it possible?",
  );
  const [notice, setNotice] = useState("");
  const actualSource = sourceId ?? selectedSource;
  const visible = reflections.filter(
    (item) =>
      sources.some((source) => source.id === item.sourceId) &&
      (!sourceId || item.sourceId === sourceId),
  );
  const prompts = [
    "What went well or exceeded expectations, and what made it possible?",
    "What was harder than expected, and what conditions shaped it?",
    "What changed for the community, including effects the figures may not show?",
    "What continued after the programme ended, and what helped it last?",
    "What should a future programme keep, change or avoid?",
  ];
  return (
    <section className="memory-card my-4 overflow-hidden">
      <div className="border-b p-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <MessageSquare className="size-4 text-[#477c69]" /> Team insights:
          wins, limits and lessons
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Capture what worked and why, what limited delivery, what changed
          for communities and what future programmes should learn. Keep
          interpretation separate from measured impact. A reviewer approves
          each insight before it can appear in a report.
        </p>
      </div>
      {!readOnly && (
        <div className="p-4">
          <p className="flex items-center gap-2 text-[11px] font-medium text-[#477c69]">
            <Sparkles className="size-3" /> Suggested reflection prompts · demo
            guidance
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {prompts.map((text) => (
              <button
                key={text}
                onClick={() => setPrompt(text)}
                className={
                  "rounded-lg border px-3 py-2 text-left text-[11px] " +
                  (prompt === text
                    ? "border-[#92bca6] bg-[#edf6f0]"
                    : "bg-white")
                }
              >
                {text}
              </button>
            ))}
          </div>
          <p className="mt-3 rounded-lg bg-[#f0f6f2] p-3 text-xs">{prompt}</p>
          <form
            className="mt-3 space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              if (role === "funder") return;
              if (!sources.some((source) => source.id === actualSource)) {
                setNotice("Choose a document from this program first.");
                return;
              }
              const saved = useReflectionStore.getState().capture({
                sourceId: actualSource,
                officer: String(data.get("officer")),
                observedOn: String(data.get("observedOn")),
                theme: String(data.get("theme")),
                observation: String(data.get("observation")),
                implication: String(data.get("implication")),
                prompt,
              });
              if (saved) {
                event.currentTarget.reset();
                setNotice(
                  "Insight captured with its source, observation date and timestamp. It is waiting in the Review inbox. It reaches reports only after a reviewer approves it.",
                );
              } else
                setNotice(
                  "Choose a source and add your name, observation date and insight.",
                );
            }}
          >
            {!sourceId && (
              <label className="block text-xs">
                Source / context
                <select
                  aria-label="Insight source"
                  value={selectedSource}
                  onChange={(event) => setSource(event.target.value)}
                  required
                  className="memory-input mt-1"
                >
                  <option value="">Choose a document…</option>
                  {sources.map((source) => (
                    <option key={source.id} value={source.id}>
                      {source.title}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="text-xs">
                Officer
                <input
                  name="officer"
                  required
                  maxLength={100}
                  placeholder="Your name or role"
                  className="memory-input mt-1"
                />
              </label>
              <label className="text-xs">
                Observed on
                <input
                  name="observedOn"
                  type="date"
                  required
                  defaultValue={localDay()}
                  className="memory-input mt-1"
                />
              </label>
              <label className="text-xs">
                Insight type
                <select name="theme" className="memory-input mt-1">
                  {[
                    "What worked (a win)",
                    "Limitation or challenge",
                    "Change for the community",
                    "Unexpected effect",
                    "What lasted",
                    "Lesson for future programmes",
                  ].map((theme) => (
                    <option key={theme}>{theme}</option>
                  ))}
                </select>
              </label>
            </div>
            <label className="block text-xs">
              Your insight
              <textarea
                name="observation"
                required
                rows={3}
                maxLength={3000}
                placeholder="Describe what happened, who said or saw it, and the context. Record exact words only when you have them."
                className="memory-input mt-1"
              />
            </label>
            <label className="block text-xs">
              What might this mean for future outcomes?{" "}
              <span className="text-slate-400">Optional hypothesis</span>
              <textarea
                name="implication"
                rows={2}
                maxLength={1500}
                className="memory-input mt-1"
                placeholder="What should be followed up or explored?"
              />
            </label>
            <button
              disabled={role === "funder"}
              className="memory-action !text-xs"
            >
              Capture insight
            </button>
            <p role="status" className="text-xs text-[#477c69]">
              {notice}
            </p>
          </form>
          <p className="mt-2 text-[10px] text-slate-500">
            Your observation is saved as an unreviewed team interpretation and
            sent to the Review inbox. <Link className="underline" href="/review">Open Review inbox</Link>
          </p>
        </div>
      )}
      <div className="border-t p-4">
        <h3 className="text-xs font-semibold">
          Captured insights ({visible.length})
        </h3>
        {visible.length ? (
          visible.map((item) => (
            <article key={item.id} className="mt-3 rounded-lg border p-3">
              <p className="text-[10px] font-semibold text-[#477c69]">
                {item.theme} · Team interpretation ·{" "}
                {insightStatus(item) === "approved"
                  ? "Approved by reviewer"
                  : insightStatus(item) === "rejected"
                    ? "Not approved"
                    : "Waiting for review"}
              </p>
              <p className="mt-2 whitespace-pre-wrap text-xs leading-5">
                {item.observation}
              </p>
              {item.implication && (
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Future hypothesis: {item.implication}
                </p>
              )}
              <p className="mt-2 text-[10px] text-slate-500">
                {item.officer} · Observed {item.observedOn} · Captured{" "}
                {new Date(item.capturedAt).toLocaleString()}
              </p>
              <Link
                href={"/sources/view?id=" + encodeURIComponent(item.sourceId)}
                className="mt-2 inline-block text-[11px] text-[#477c69]"
              >
                View source context →
              </Link>
            </article>
          ))
        ) : (
          <p className="mt-2 text-xs text-slate-500">
            No officer insights captured yet.
          </p>
        )}
      </div>
    </section>
  );
}
