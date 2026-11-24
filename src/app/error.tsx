"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <section role="alert" className="mx-auto my-10 max-w-lg rounded-2xl border border-amber-200 bg-white p-6 text-slate-800">
    <h1 className="text-2xl font-semibold">This page could not open</h1>
    <p className="my-4">Try again. If the demo was just updated, reload to get the latest version.</p>
    <div className="flex flex-wrap gap-3">
      <button className="rounded-lg bg-teal-700 px-4 py-3 text-white" onClick={reset}>Try again</button>
      <button className="rounded-lg border px-4 py-3" onClick={()=>window.location.reload()}>Reload latest demo</button>
    </div>
    <p className="mt-4 text-sm text-slate-500">Reloading does not reset saved browser data, but unsaved text may be lost.</p>
  </section>;
}
