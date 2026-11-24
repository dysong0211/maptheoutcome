import { PilotLoginForm } from "@/components/auth/pilot-login-form";
import { supabaseAuthConfigured } from "@/lib/supabase/pilot-auth";
import { pilotAccessCodeEnabled } from "@/lib/pilot-access-code";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Pilot sign in · MapToc",
};

export default function LoginPage() {
  if (pilotAccessCodeEnabled()) redirect(process.env.MAPTOC_BASE_PATH === "/pilot" ? "/" : "/pilot");
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0b161b] p-5">
      <section className="w-full max-w-md rounded-2xl border border-[#d5e4df] bg-white p-7 shadow-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#007f78]">MapToc · Private pilot</p>
        <h1 className="mt-2 text-2xl font-semibold text-[#15242b]">Pilot sign in</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">Use your approved MapToc pilot account to open the program workspace.</p>
        <PilotLoginForm configured={supabaseAuthConfigured()} />
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
