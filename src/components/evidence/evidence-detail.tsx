"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, FileText, History, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { useDemoStore } from "@/stores/demo-store";

export default function EvidenceDetail({ id }: { id: string }) {
  const item = useDemoStore((state) =>
    state.evidence.find((entry) => entry.id === id),
  );
  const role = useDemoStore((state) => state.role);
  const nodes = useDemoStore((state) => state.nodes);
  const revise = useDemoStore((state) => state.reviseEvidence);
  const map = useDemoStore((state) => state.mapEvidence);
  const [ready, setReady] = useState(false);
  const [name, setName] = useState("");
  const [reason, setReason] = useState("");
  const [nodeId, setNodeId] = useState("");
  const [notice, setNotice] = useState("");
  useEffect(() => setReady(true), []);
  if (!ready) return <p role="status">Loading evidence…</p>;
  if (!item)
    return (
      <div className="rounded-2xl bg-white p-8">
        <h1 className="text-xl font-semibold">Evidence not found</h1>
        <p className="my-3 text-slate-500">
          This local demo record may have been reset.
        </p>
        <Link href="/evidence">Return to Evidence Vault</Link>
      </div>
    );

  return (
    <div className="space-y-6">
      <Link
        href="/evidence"
        className="inline-flex items-center gap-2 text-sm text-slate-500"
      >
        <ArrowLeft className="size-4" /> Evidence Vault
      </Link>
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            Clean Energy Initiative · Q2 2026
          </p>
          <h1 className="mt-2 break-all text-2xl font-semibold tracking-tight">
            {item.name}
          </h1>
        </div>
        <StatusBadge tone="blue">Current version {item.version}</StatusBadge>
      </header>
      <p className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
        Demo records preserve version metadata locally. Original file contents
        and cryptographic checksums are not stored.
      </p>
      {notice && (
        <p
          role="status"
          className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800"
        >
          {notice}
        </p>
      )}
      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="flex items-center gap-2 font-semibold">
            <FileText className="size-4" /> Source details
          </h2>
          <dl className="grid grid-cols-2 gap-5 text-sm">
            {[
              ["Version", `v${item.version}`],
              ["Size", item.size],
              ["Uploaded by", item.uploadedBy],
              ["Uploaded at", item.uploadedAt],
              ["Processing state", item.status.replaceAll("-", " ")],
              [
                "Storage",
                item.source === "seeded"
                  ? "Synthetic example"
                  : "Local demo metadata",
              ],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs text-slate-500">{label}</dt>
                <dd className="mt-1 font-medium">{value}</dd>
              </div>
            ))}
          </dl>
          <div className="border-t border-slate-100 pt-5">
            <h2 className="flex items-center gap-2 font-semibold">
              <Link2 className="size-4" /> Evidence mapping
            </h2>
            <p className="mt-3 text-sm text-slate-600">
              {item.linkedNodeLabel ?? "Not yet mapped"}
            </p>
            {item.linkedNodeId && (
              <Link
                className="mt-2 block text-sm font-medium text-blue-700"
                href="/legacy/outcomes"
              >
                View program outcome map →
              </Link>
            )}
          </div>
          {role === "program" && (
            <form
              className="space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                map(item.id, nodeId);
                setNotice(
                  "Mapping updated and recorded in the transparency log.",
                );
              }}
            >
              <label className="block text-xs font-semibold">
                Choose a milestone or outcome
                <select
                  className="mt-2 w-full rounded-lg border p-3 text-sm"
                  value={nodeId}
                  onChange={(event) => setNodeId(event.target.value)}
                  required
                >
                  <option value="">Select a mapping</option>
                  {nodes
                    .filter((node) =>
                      ["milestone", "outcome"].includes(node.kind),
                    )
                    .map((node) => (
                      <option value={node.id} key={node.id}>
                        {node.label}
                      </option>
                    ))}
                </select>
              </label>
              <Button
                disabled={!nodeId || nodeId === item.linkedNodeId}
                type="submit"
              >
                Save mapping
              </Button>
            </form>
          )}
          <Link
            href="/legacy/transparency"
            className="block border-t pt-4 text-sm font-medium text-blue-700"
          >
            Inspect transparency history →
          </Link>
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="flex items-center gap-2 font-semibold">
            <History className="size-4" /> Version history
          </h2>
          <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm font-semibold">v{item.version} · Current</p>
            <p className="mt-1 break-all text-sm">{item.name}</p>
            <p className="mt-2 text-xs text-slate-500">
              {item.uploadedBy} · {item.uploadedAt}
            </p>
          </div>
          {[...(item.history ?? [])].reverse().map((version) => (
            <article
              key={version.version}
              className="mt-3 rounded-xl border border-slate-200 p-4"
            >
              <p className="text-sm font-semibold">
                v{version.version} · Previous
              </p>
              <p className="mt-1 break-all text-sm">{version.name}</p>
              <p className="mt-2 text-xs text-slate-500">
                {version.uploadedBy} · {version.uploadedAt} · {version.size}
              </p>
              <p className="mt-3 text-sm text-slate-600">
                Replacement reason: {version.reason}
              </p>
            </article>
          ))}
          {!item.history?.length && (
            <p className="mt-4 text-sm text-slate-500">
              {item.version > 1
                ? "Earlier file metadata was not included in this sample dataset. New replacements will retain complete metadata history."
                : "No earlier versions."}
            </p>
          )}
        </section>
      </div>
      {role === "program" && (
        <form
          className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6"
          onSubmit={(event) => {
            event.preventDefault();
            revise(item.id, name, reason);
            setName("");
            setReason("");
            setNotice(
              `Version ${item.version + 1} created. Previous metadata retained and replacement logged.`,
            );
          }}
        >
          <div>
            <h2 className="font-semibold">Create a replacement version</h2>
            <p className="mt-1 text-sm text-slate-500">
              Simulate a replacement using a filename and explanation. No file
              is uploaded.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-semibold">
              Replacement filename
              <input
                required
                maxLength={180}
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Q2_Deployment_Report_Revised.pdf"
                className="mt-2 block w-full rounded-lg border p-3 text-sm"
              />
            </label>
            <label className="text-xs font-semibold">
              Reason for replacement
              <input
                required
                maxLength={500}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Clarified operational status of six sites"
                className="mt-2 block w-full rounded-lg border p-3 text-sm"
              />
            </label>
          </div>
          <Button disabled={!name.trim() || !reason.trim()}>
            Create version {item.version + 1}
          </Button>
        </form>
      )}
    </div>
  );
}
