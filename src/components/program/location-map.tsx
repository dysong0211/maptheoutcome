"use client";
import { useState } from "react";
import Link from "next/link";
import { MapPin } from "lucide-react";
import type { ProgramRecord, SourceVersion } from "@/lib/program-memory";

const NONE = /^(|see source document|location not specified.*|not specified|unknown|n\/a)$/i;
type Hit = { lat: number; lon: number; name: string; count: number };

/** Geography only. Places come from each finding's location label (set by a reviewer). Nothing here shows how findings relate. */
export function LocationMap({ records, sources }: { records: ProgramRecord[]; sources: SourceVersion[] }) {
  const groups = new Map<string, ProgramRecord[]>();
  for (const r of records) {
    const loc = (r.location ?? "").trim();
    if (NONE.test(loc)) continue;
    groups.set(loc, [...(groups.get(loc) ?? []), r]);
  }
  const [hits, setHits] = useState<Record<string, Hit | "none" | "error">>({});
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState("");
  const places = [...groups.keys()].sort();
  async function locate() {
    setBusy(true);
    const next: Record<string, Hit | "none" | "error"> = { ...hits };
    for (const place of places.slice(0, 12)) {
      if (next[place]) continue;
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=3&q=${encodeURIComponent(place)}`);
        const data = (await res.json()) as { lat: string; lon: string; display_name: string }[];
        next[place] = data.length ? { lat: +data[0].lat, lon: +data[0].lon, name: data[0].display_name, count: data.length } : "none";
      } catch {
        next[place] = "error";
      }
      await new Promise((r) => setTimeout(r, 1100)); // public search service: one request per second
    }
    setHits(next);
    setBusy(false);
    const first = places.find((p) => typeof next[p] === "object");
    if (first && !selected) setSelected(first);
  }
  const sel = selected && typeof hits[selected] === "object" ? (hits[selected] as Hit) : null;
  const d = 0.25;
  return (
    <section className="memory-card" aria-label="Where findings happened" data-testid="location-map" style={{ padding: 14, margin: "12px 0", border: "1px solid #bae6fd", borderRadius: 12 }}>
      <h3 className="text-base font-semibold"><MapPin size={16} style={{ display: "inline" }} /> Where it happened (geography only)</h3>
      <p className="text-xs text-slate-600">
        This map shows places named on approved findings. It does not show how findings relate. A place is looked up from its name, so the pin is approximate and a name can match several places; check it against the source.
      </p>
      {!places.length ? (
        <p className="text-sm">No approved finding has a location yet. Add a location when you review a finding, or it stays off the map. Nothing is guessed from document text.</p>
      ) : (
        <>
          <button className="memory-action" disabled={busy} onClick={locate}>
            {busy ? "Looking up places…" : `Show ${Math.min(places.length, 12)} place${places.length === 1 ? "" : "s"} on the map`}
          </button>
          <small style={{ marginLeft: 8 }}>Sends only the place names to OpenStreetMap search. Your location is not used.</small>
          <ul className="mt-2 space-y-1 text-sm">
            {places.map((p) => {
              const h = hits[p];
              return (
                <li key={p}>
                  <button type="button" onClick={() => setSelected(p)} style={{ textDecoration: selected === p ? "underline" : undefined, fontWeight: 600 }}>{p}</button>{" "}
                  ({groups.get(p)!.length} finding{groups.get(p)!.length === 1 ? "" : "s"}){" "}
                  {typeof h === "object" && <small>matched “{h.name}”{h.count > 1 ? `, first of ${h.count} possible matches` : ""}</small>}
                  {h === "none" && <small>no match found, not shown</small>}
                  {h === "error" && <small>lookup failed</small>}
                  {selected === p && (
                    <ul style={{ marginLeft: 16 }}>
                      {groups.get(p)!.map((r) => (
                        <li key={r.id}>
                          {r.title} · <Link href={`/sources/view?id=${encodeURIComponent(r.citation.versionId)}`}>{sources.find((s) => s.id === r.citation.versionId)?.title ?? "source"}</Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
          {sel && (
            <iframe
              title={`Map of ${selected}`}
              style={{ width: "100%", height: 300, border: 0, marginTop: 8 }}
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${sel.lon - d}%2C${sel.lat - d}%2C${sel.lon + d}%2C${sel.lat + d}&layer=mapnik&marker=${sel.lat}%2C${sel.lon}`}
            />
          )}
        </>
      )}
    </section>
  );
}
