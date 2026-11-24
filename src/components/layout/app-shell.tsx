"use client";
import { InstallApp } from "./install-app";
import { MapTocLogo } from "@/components/maptoc-logo";

import {
  ChartNoAxesCombined,
  ShieldAlert,
  ChevronRight,
  FileStack,
  FileText,
  History,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  Network,
  RefreshCcw,
  Sparkles,
  X,
} from "lucide-react";
import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useDemoStore } from "@/stores/demo-store";
import { useMemoryStore } from "@/stores/program-memory-store";
import { clearCapturedFiles } from "@/lib/browser-file-store";
import { useOutputStore } from "@/stores/output-intelligence-store";
import { useReflectionStore } from "@/stores/reflection-store";
import { useAssurance } from "@/stores/assurance-store";
import { usePersonnel } from "@/stores/personnel-store";
import { useTodo } from "@/stores/followup-store";
import { createClient as createSupabaseClient } from "@/lib/supabase/client";

const navigation = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Program", href: "/program", icon: ChartNoAxesCombined },
  { label: "Insights", href: "/insights", icon: Sparkles },
  { label: "Evidence", href: "/sources", icon: FileStack },
  { label: "Assurance", href: "/assurance", icon: ListChecks },
  { label: "Reports", href: "/reports", icon: FileText },
];
const supportingNavigation = [
  { label: "Risk Analysis", href: "/risks", icon: ShieldAlert },
];
const pilotMode = process.env.NEXT_PUBLIC_MAPTOC_PILOT_MODE === "true";
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname().replace(/\/$/, "") || "/";
  const isOverview = pathname === "/" || pathname === "/dashboard";
  const activeProgram = useAssurance((state) => state.workspace.program);
  const savedPrograms = useAssurance((state) => state.savedPrograms);
  const selectProgram = useAssurance(s=>s.selectProgram);
  const programContext = true;
  const contextName =
    programContext && activeProgram
      ? activeProgram.name
      : "2026 MOH Maternal Delivery";
  const contextCountry =
    programContext && activeProgram ? activeProgram.country : "Cambodia";
  const [mobileOpen, setMobileOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [resetRevision, setResetRevision] = useState(0);
  const [resetOpen, setResetOpen] = useState(false);
  const role = useDemoStore((state) => state.role);
  const setRole = useDemoStore((state) => state.setRole);
  const pending = useMemoryStore(
    (state) =>
      state.proposals.filter(
        (item) => item.status === "pending" || item.status === "flagged",
      ).length,
  );
  const legacy =
    pathname.startsWith("/legacy") || pathname.startsWith("/evidence");
  useEffect(() => {setReady(true);useAssurance.getState().sync();}, []);
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);
  const sidebar = (
    <div className="maptoc-sidebar flex h-full flex-col bg-[#0b161b] text-[#a5adbd]">
      <Link
        href="/dashboard"
        className="maptoc-brand flex h-[76px] items-center gap-3 border-b border-white/10 px-6"
      >
        <span className="maptoc-mark">
          <MapTocLogo className="size-8" />
        </span>
        <span>
          <strong className="block text-xl tracking-tight text-white">
            MapToc
          </strong>
        </span>
      </Link>
      <div className="px-5 pb-2 pt-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#829da6]">
        Program intelligence
      </div>
      <nav aria-label="Primary navigation" className="space-y-1 px-3">
        {navigation.map(({ label, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            aria-current={pathname === href || (href === "/dashboard" && pathname === "/") ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] transition-colors",
              pathname === href ||
                (href === "/dashboard" && pathname === "/") ||
                (href === "/sources" && pathname.startsWith("/sources/")) ||
                (href === "/insights" &&
                  [
                    "/analysis",
                    "/record",
                    "/outputs",
                    "/outcomes",
                    "/review",
                  ].includes(pathname))
                || (href === "/reports" && pathname === "/outputs")
                ? "bg-[#173237] text-white shadow-[inset_2px_0_0_#43edb0]"
                : "hover:bg-white/5 hover:text-white",
            )}
          >
            <Icon className="size-4" />
            {label}
            {label === "Review inbox" && ready && pending > 0 && (
              <span className="ml-auto rounded bg-[#a5ddca] px-1.5 text-xs font-semibold text-[#173b34]">
                {pending}
              </span>
            )}
          </Link>
        ))}
      </nav>
      <details
        className="mx-5 mt-4 border-t border-white/10 pt-3"
        open={supportingNavigation.some((item) => item.href === pathname)}
      >
        <summary className="cursor-pointer text-xs text-[#9eb8bf]">
          Program tools
        </summary>
        <nav aria-label="Program tools" className="mt-2 space-y-1">
          {supportingNavigation.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              aria-current={pathname === href ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-2 py-2 text-xs",
                pathname === href
                  ? "bg-[#173237] text-white"
                  : "hover:bg-white/5 hover:text-white",
              )}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          ))}
        </nav>
      </details>
      <div className="mx-5 mt-4 border-t border-white/10 pt-3">
        <p className="text-[10px] uppercase tracking-[0.16em] text-[#829da6]">
          Programs · {Object.keys(savedPrograms).length + 1}
        </p>
        <label className="program-switcher">Switch program
          <select value={activeProgram?.id||"cambodia-demo"} onChange={e=>selectProgram(e.target.value)}>
            <option value={activeProgram?.id||"cambodia-demo"}>{activeProgram?.name||"2026 MOH Maternal Delivery"}</option>
            {Object.entries(savedPrograms).map(([id,state])=><option key={id} value={id}>{state.program?.name||id}</option>)}
          </select>
        </label>
        <Link className="program-add-link" href="/assurance#program-setup">+ Set up a program</Link>
      </div>
      <div className="mt-auto space-y-4 p-5">
        {(process.env.NEXT_PUBLIC_MAPTOC_REQUIRE_AUTH === "true" ||
          process.env.NEXT_PUBLIC_MAPTOC_ACCESS_CODE_ENABLED === "true") && (
          <button
            type="button"
            className="flex items-center gap-2 text-xs hover:text-white"
            onClick={async () => {
              if (process.env.NEXT_PUBLIC_MAPTOC_ACCESS_CODE_ENABLED === "true") {
                const basePath = process.env.NEXT_PUBLIC_MAPTOC_BASE_PATH || "";
                await fetch(`${basePath}/api/pilot/access`, { method: "DELETE" });
                window.location.assign(`${basePath}${basePath ? "/" : "/pilot"}`);
              } else {
                await createSupabaseClient().auth.signOut();
                window.location.assign("/login");
              }
            }}
          >
            <LogOut className="size-4" /> Leave pilot
          </button>
        )}
        {!pilotMode && <details className="mobile-demo-options">
          <summary>Demo options</summary>
          <label htmlFor="mobile-demo-role">Try a role</label>
          <select id="mobile-demo-role" value={role} onChange={e=>setRole(e.target.value as typeof role)}>
            <option value="program">Program Manager</option><option value="reviewer">Assurance reviewer</option><option value="funder">Funder / Viewer</option>
          </select>
          <button onClick={()=>{setMobileOpen(false);setResetOpen(true);}}>Reset demo data…</button>
        </details>}
        <InstallApp />
        <Link
          href="/transparency"
          className="flex items-center gap-2 text-xs hover:text-white"
        >
          <History className="size-4" />
          Activity history
        </Link>
        <div className="border-t border-white/10 pt-4 text-xs leading-6 text-[#a5adbd]">
          <span className="mr-2 inline-block size-1.5 rounded-full bg-[#43edb0]" />
          {pilotMode ? "Pilot workspace" : "Demo workspace"}
          <span className="block text-[10px] text-slate-400">
            {pilotMode ? "Browser-local records" : "Local data · Prepared intelligence"}
          </span>
        </div>
      </div>
    </div>
  );
  return (
    <div className="maptoc-app min-h-screen bg-[#f5f6f7] text-[#15242b]">
      <a
        href="#workspace-main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-2 focus:z-[60] focus:rounded focus:bg-white focus:p-3"
      >
        Skip to content
      </a>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-56 lg:block">
        {sidebar}
      </aside>
      <Dialog.Root open={mobileOpen} onOpenChange={setMobileOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-950/50" />
          <Dialog.Content
            aria-describedby={undefined}
            className="fixed inset-y-0 left-0 z-50 w-64 outline-none"
          >
            <Dialog.Title className="sr-only">
              Workspace navigation
            </Dialog.Title>
            {sidebar}
            <Dialog.Close asChild>
              <button
                aria-label="Close navigation"
                className="absolute right-2 top-5 p-2 text-white"
              >
                <X className="size-5" />
              </button>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      {!pilotMode && <Dialog.Root open={resetOpen} onOpenChange={setResetOpen}>
        <Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-50 bg-slate-950/50"/><Dialog.Content className="reset-demo-dialog fixed left-1/2 top-1/2 z-50 w-[calc(100%-32px)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-xl">
          <Dialog.Title className="text-xl font-semibold">Reset this browser’s demo?</Dialog.Title>
          <Dialog.Description className="mt-3 text-sm leading-6 text-slate-600">This permanently removes your uploaded files, created programs, reviews and assignments from this browser. It restores the sample programs. This cannot be undone.</Dialog.Description>
          <div className="mt-5 flex flex-wrap gap-3"><Dialog.Close asChild><button autoFocus className="rounded-lg border px-4 py-3">Keep my work</button></Dialog.Close><button className="rounded-lg bg-red-700 px-4 py-3 text-white" onClick={()=>{
            useDemoStore.getState().resetDemo();useMemoryStore.getState().reset();useOutputStore.getState().reset();useReflectionStore.getState().reset();useAssurance.getState().reset();usePersonnel.getState().reset();useTodo.getState().reset();void clearCapturedFiles();setResetRevision(r=>r+1);setResetOpen(false);
          }}>Delete local data & reset</button></div>
        </Dialog.Content></Dialog.Portal>
      </Dialog.Root>}
      <div className="lg:pl-56">
        <header
          className={cn(
            "maptoc-topbar sticky top-0 z-30 flex flex-wrap items-center justify-between gap-2 border-b border-[#25463c] bg-[#09191b] text-white px-4",
            "min-h-[56px] py-2 sm:px-7",
          )}
        >
          <div className="flex items-center gap-3">
            {process.env.NEXT_PUBLIC_WEBSITE_HOME && (
              <a
                href={process.env.NEXT_PUBLIC_WEBSITE_HOME}
                className="text-xs font-medium text-[#356756] hover:underline"
              >
                ← Website
              </a>
            )}
            <button
              aria-label="Open navigation"
              onClick={() => setMobileOpen(true)}
              className="p-2 lg:hidden"
            >
              <Menu className="size-5" />
            </button>
            <span className="hidden text-xs text-slate-500 sm:block">
              {contextName} <span className="mx-2 text-slate-300">/</span>{" "}
              {[...navigation, ...supportingNavigation].find(
                (item) => item.href === pathname,
              )?.label ?? "Workspace"}
            </span>
            <span className="rounded-full border border-[#c9ded5] bg-[#f5f7f8] px-2 py-1 text-[10px] font-medium text-[#356756]">
              {pilotMode ? "Pilot workspace" : "Synthetic data"}
            </span>
          </div>
          {!pilotMode && <div className="demo-topbar-options flex items-center gap-2">
            <label className="sr-only" htmlFor="demo-role">
              Demo role
            </label>
            <select
              id="demo-role"
              value={role}
              onChange={(event) => setRole(event.target.value as typeof role)}
              className="max-w-[165px] rounded-lg border border-[#d9e3e3] bg-white p-2 text-xs"
            >
              <option value="funder">Funder / Viewer</option>
              <option value="program">Program Manager</option>
              <option value="reviewer">Assurance reviewer</option>
            </select>
            <button
              title="Restore all synthetic demo data"
              aria-label="Reset demo"
              className="rounded-lg p-2 hover:bg-slate-100"
              onClick={() => setResetOpen(true)}
            >
              <RefreshCcw className="size-4" />
            </button>
            <span className="hidden size-8 place-items-center rounded-full bg-[#e4eeed] text-[10px] font-semibold sm:grid">
              {role === "funder" ? "AO" : role === "reviewer" ? "SR" : "MC"}
            </span>
          </div>}
        </header>
        <main
          key={resetRevision}
          id="workspace-main"
          className="mx-auto max-w-[1500px] p-4 sm:p-7"
        >
          {legacy && (
            <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-6 text-amber-900">
              Earlier EV prototype · Metadata-only workflows; not the current
              maternal-health record.
              <div className="flex flex-wrap gap-4">
                <Link href="/legacy">Overview</Link>
                <Link href="/legacy/outcomes">EV canvas</Link>
                <Link href="/evidence">EV evidence</Link>
                <Link href="/legacy/transparency">EV history</Link>
                <Link href="/dashboard" className="inline-flex items-center">
                  {pilotMode ? "Pilot workspace" : "Current demo"} <ChevronRight className="size-3" />
                </Link>
              </div>
            </div>
          )}
          {ready ? (
            children
          ) : (
            <p role="status" className="p-12 text-sm text-slate-500">
              Loading program workspace…
            </p>
          )}
        </main>
      </div>
    </div>
  );
}
