"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function PilotAccessCodeForm({ configured }: { configured: boolean }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const basePath = process.env.NEXT_PUBLIC_MAPTOC_BASE_PATH || "";
      const response = await fetch(`${basePath}/api/pilot/access`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not verify the access code.");
      router.replace("/dashboard");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not verify the access code.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-4">
      <label className="block text-sm font-medium text-slate-800">
        Pilot access code
        <input
          type="password"
          autoComplete="current-password"
          required
          value={code}
          onChange={(event) => setCode(event.target.value)}
          className="memory-input mt-1 w-full"
          placeholder="Enter access code"
          disabled={!configured || busy}
        />
      </label>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <button className="memory-action w-full justify-center" disabled={busy || !configured}>
        {busy ? "Checking code…" : "Continue to pilot"}
      </button>
    </form>
  );
}
