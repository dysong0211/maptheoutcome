"use client";
import { useEffect, useState } from "react";

type InstallEvent = Event & { prompt(): Promise<void>; userChoice: Promise<{ outcome: string }> };

export function InstallApp() {
  const [prompt, setPrompt] = useState<InstallEvent | null>(null);
  const [open, setOpen] = useState(false);
  const [installed, setInstalled] = useState(false);
  useEffect(() => {
    setInstalled(window.matchMedia("(display-mode: standalone)").matches);
    const available = (event: Event) => { event.preventDefault(); setPrompt(event as InstallEvent); };
    const complete = () => { setInstalled(true); setPrompt(null); };
    window.addEventListener("beforeinstallprompt", available);
    window.addEventListener("appinstalled", complete);
    return () => { window.removeEventListener("beforeinstallprompt", available); window.removeEventListener("appinstalled", complete); };
  }, []);
  return <div className="my-3">
    <button className="min-h-11 rounded-lg border border-slate-400 px-3 py-2 text-sm" onClick={async () => {
      if (prompt) { await prompt.prompt(); await prompt.userChoice; setPrompt(null); }
      else setOpen(!open);
    }} aria-expanded={open}>{installed ? "App installed" : "Install MapToc"}</button>
    {open && <div className="mt-3 space-y-3 rounded-lg bg-white p-4 text-sm text-slate-800">
      <p><strong>Mac:</strong> Open MapToc in Safari, then choose File → Add to Dock (macOS Sonoma or later).</p>
      <p><strong>iPad:</strong> Open in Safari, tap Share → Add to Home Screen → Open as Web App.</p>
      <p>Launch MapToc from its icon. An internet connection is needed to load the app and use AI. Documents currently stay on this device; installation does not sync existing browser files.</p>
    </div>}
  </div>;
}
