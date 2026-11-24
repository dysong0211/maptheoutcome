"use client";

import { useEffect, useRef, useState } from "react";
import { Camera } from "lucide-react";
import { validateCaptureFile } from "@/lib/browser-file-store";

export function CameraCapture({ disabled, onCapture }: { disabled: boolean; onCapture: (files: File[]) => Promise<void> }) {
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (!file) { setPreview(""); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  return <div className="my-2">
    <button type="button" disabled={disabled || saving} className="memory-action memory-secondary min-h-11" onClick={() => input.current?.click()}><Camera size={18} /> Take photo</button>
    <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" className="sr-only" aria-label="Take a document photo" disabled={disabled || saving} onChange={(event) => {
      const photo = event.target.files?.[0];
      event.target.value = "";
      if (!photo) return;
      const issue = validateCaptureFile(photo);
      if (issue) { setError(issue); return; }
      setError(""); setFile(photo);
    }} />
    {error && <p role="alert" className="maptoc-alert p-3">{error}</p>}
    {file && <section aria-label="Review document photo" className="mt-3 rounded-xl border bg-white p-4 text-slate-800">
      <h3 className="font-semibold">Check the page before saving</h3>
      <p className="my-2 text-sm">Include all corners. Check focus and avoid glare. The original photo is saved; text extraction requires a separate review.</p>
      {preview && <img src={preview} alt="Document photo awaiting your confirmation" className="max-h-80 w-full rounded-lg object-contain" onError={() => setError("This image cannot be previewed. Retake it or choose a JPG or PNG.")} />}
      <div className="mt-3 flex flex-wrap gap-3">
        <button type="button" disabled={disabled || saving || !!error} className="memory-action" onClick={async () => {
          setSaving(true);
          try { await onCapture([file]); setFile(null); }
          catch { setError("Could not save this photo. Please try again."); }
          finally { setSaving(false); }
        }}>{saving ? "Saving…" : "Save photo as evidence"}</button>
        <button type="button" disabled={saving} className="memory-action memory-secondary" onClick={() => input.current?.click()}>Retake</button>
        <button type="button" disabled={saving} className="memory-action memory-secondary" onClick={() => { setFile(null); setError(""); }}>Cancel</button>
      </div>
    </section>}
  </div>;
}
