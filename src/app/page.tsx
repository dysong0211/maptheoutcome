import { redirect } from "next/navigation";
import { PilotAccessPage } from "@/components/auth/pilot-access-page";
import { pilotAccessCodeEnabled } from "@/lib/pilot-access-code";

export const dynamic = "force-dynamic";

export default function HomePage() {
  if (process.env.MAPTOC_BASE_PATH === "/pilot" && pilotAccessCodeEnabled()) {
    return <PilotAccessPage />;
  }
  redirect("/dashboard");
}
