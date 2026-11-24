"use client";

import Link from "next/link";
import {
  Sparkles,
  ArrowUpRight,
  AlertTriangle,
  Wallet,
  CalendarDays,
} from "lucide-react";
import { prenatalStats } from "@/lib/prenatal-analysis";
import { deriveLogframe } from "@/lib/logframe-intelligence";
import { DecisionDashboard } from "@/components/program/decision-dashboard";
import {
  ProgramJourney,
  ImportantReports,
} from "@/components/program/program-journey";
import {
  assessInputs,
  useOutputStore,
} from "@/stores/output-intelligence-store";
import { useMemoryStore } from "@/stores/program-memory-store";

export const evidenceRequests = [
  {
    id: "attendance",
    title: "Before-and-after attendance",
    detail: "Compare attendance before and after Saturday outreach.",
    needed: "Attendance registers covering both periods",
  },
  {
    id: "care-access",
    title: "Care access & referral follow-up",
    detail: "Measure whether women can access and complete care.",
    needed: "Referral completion data and community follow-up",
  },
  {
    id: "transport",
    title: "Transport spending support",
    detail: "Reconcile the reported transport variance.",
    needed: "Itemized receipts or a transaction ledger",
  },
];

export function OutcomeIntelligence() {
  const records = useMemoryStore((state) => state.records);
  const sources = useMemoryStore((state) => state.sources);
  const metrics = deriveLogframe(records, sources);
  const reach = metrics[0],
    transport = metrics[2];
  return (
    <section
      aria-label="Outcome intelligence"
      className="mt-3 rounded-xl bg-[#173641] p-4 text-white"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Sparkles className="size-4 text-[#9bd8c2]" /> AI outcome summary
        </h2>
        <span className="text-[10px] text-[#bcd9ce]">
          Reviewed sample evidence · rule-based, no live AI
        </span>
      </div>
      <p className="mt-3 text-sm leading-6">
        <strong>
          {reach.actual === null
            ? "Delivery evidence needs review."
            : reach.actual.toLocaleString() +
              " women reached against a " +
              reach.target?.toLocaleString() +
              " target."}
        </strong>{" "}
        {transport.delta === null
          ? "Transport evidence is missing."
          : "Transport spending differs from budget by $" +
            transport.delta.toLocaleString() +
            "."}{" "}
        Delivery is documented; lasting care access remains unmeasured.
      </p>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-3">
        <p className="text-xs text-[#d1e1df]">
          Next decision: investigate access barriers and whether the transport
          pressure will recur.
        </p>
        <Link href="/insights" className="text-xs font-medium text-[#a5ddca]">
          Explained outcomes & sources →
        </Link>
      </div>
    </section>
  );
}

export function OverviewSummaries() {
  return <DecisionDashboard />;
}
