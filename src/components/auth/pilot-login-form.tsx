"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function PilotLoginForm({ configured }: { configured: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!configured) {
      setError("Pilot sign-in is not configured. Contact the MapToc administrator.");
      return;
    }
    setBusy(true);
    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) throw signInError;
      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError("Sign-in failed or this account is not authorized for the pilot.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-4">
      <label className="block text-sm font-medium text-slate-800">
        Email address
        <input
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="memory-input mt-1 w-full"
        />
      </label>
      <label className="block text-sm font-medium text-slate-800">
        Password
        <input
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="memory-input mt-1 w-full"
        />
      </label>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <button className="memory-action w-full justify-center" disabled={busy || !configured}>
        {busy ? "Signing in…" : "Sign in to pilot"}
      </button>
      {!configured && <p className="text-xs text-amber-800">Administrator setup is required before sign-in can be enabled.</p>}
    </form>
  );
}
