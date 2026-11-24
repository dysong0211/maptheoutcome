import { AppShell } from "@/components/layout/app-shell";
import { redirect } from "next/navigation";
import { getPilotAccount, pilotAuthEnabled } from "@/lib/supabase/pilot-auth";
import { hasPilotAccessSession, pilotAccessCodeEnabled } from "@/lib/pilot-access-code";

// Never prerender the gated workspace: the auth check must run per request,
// independent of which env vars happened to exist at build time.
export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  if (pilotAccessCodeEnabled()) {
    if (!(await hasPilotAccessSession())) {
      redirect(process.env.MAPTOC_BASE_PATH === "/pilot" ? "/" : "/pilot");
    }
    return <AppShell>{children}</AppShell>;
  }
  if (pilotAuthEnabled()) {
    if (!(await getPilotAccount())) {
      redirect("/login?error=access");
    }
    return <AppShell>{children}</AppShell>;
  }
  // Fail closed in production when no auth mechanism is configured; local
  // development (next dev) stays open by design.
  if (process.env.NODE_ENV === "production") {
    redirect("/login?error=access");
  }
  return <AppShell>{children}</AppShell>;
}
