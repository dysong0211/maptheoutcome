import { redirect } from "next/navigation";

// The old prototype vault showed unrelated sample data. Documents live in Sources.
export default function EvidenceRedirect() {
  redirect("/sources");
}
