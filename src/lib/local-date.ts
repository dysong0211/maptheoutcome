/** Calendar day (YYYY-MM-DD) in the user's own time zone, not UTC. */
export function localDay(value?: string | number | Date): string {
  const n = value === undefined ? new Date() : new Date(value);
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
}
