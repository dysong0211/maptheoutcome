export function programIdLine(p?: {
  programRef?: string;
  grantRef?: string;
} | null): string {
  const parts: string[] = [];
  if (p?.programRef?.trim()) parts.push(`Program ID ${p.programRef.trim()}`);
  if (p?.grantRef?.trim()) parts.push(`Grant ID ${p.grantRef.trim()}`);
  return parts.join(" · ");
}

export function agreementLine(p?: {
  donor?: string;
  agreementStart?: string;
  agreementEnd?: string;
} | null): string {
  const parts: string[] = [];
  if (p?.donor?.trim()) parts.push(`Donor ${p.donor.trim()}`);
  if (p?.agreementStart || p?.agreementEnd)
    parts.push(`Agreement ${p?.agreementStart || "?"} to ${p?.agreementEnd || "?"}`);
  return parts.join(" · ");
}
