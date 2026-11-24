export function programIdLine(p?: {
  programRef?: string;
  grantRef?: string;
} | null): string {
  const parts: string[] = [];
  if (p?.programRef?.trim()) parts.push(`Program ID ${p.programRef.trim()}`);
  if (p?.grantRef?.trim()) parts.push(`Grant ID ${p.grantRef.trim()}`);
  return parts.join(" · ");
}
