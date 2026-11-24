import { PilotAccessCodeForm } from "@/components/auth/pilot-access-code-form";
import { pilotAccessCodeConfigured } from "@/lib/pilot-access-code";

export function PilotAccessPage() {
  const configured = pilotAccessCodeConfigured();
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0b161b] p-5">
      <section className="w-full max-w-md rounded-2xl border border-[#d5e4df] bg-white p-7 shadow-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#007f78]">
          MapToc · Private pilot
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-[#15242b]">Enter the pilot</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Use the access code shared with your pilot team to open the program workspace.
        </p>
        <PilotAccessCodeForm configured={configured} />
        {!configured && (
          <p className="mt-3 text-xs leading-5 text-amber-800">
            Pilot access is not configured on this server yet. Contact the MapToc administrator.
          </p>
        )}
        <a
          className="mt-5 inline-block text-sm font-medium text-[#087d61] hover:underline"
          href={process.env.NEXT_PUBLIC_WEBSITE_HOME || "https://maptoc.org"}
        >
          ← MapToc website
        </a>
      </section>
    </main>
  );
}
