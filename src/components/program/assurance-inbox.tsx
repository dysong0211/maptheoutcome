"use client";
import { useState } from "react";
import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
import {
  ArrowRight,
  Flag,
  Upload,
  FileSearch,
  X,
  CheckCircle2,
} from "lucide-react";
import type { AttentionItem } from "@/lib/assurance-overview";
import { actionCopy } from "@/lib/assurance-action-copy";
import { followupContext } from "@/lib/followup-context";
import { useClarifications } from "./use-clarifications";
import { AssuranceRequestContext } from "./assurance-request-context";

const dateLabel = (date?: string) =>
  date
    ? new Date(date + "T12:00:00").toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "No due date";

export function AssuranceInbox({
  items,
  compact = false,
  limit = 4,
}: {
  items: AttentionItem[];
  compact?: boolean;
  limit?: number;
}) {
  const workspace = useClarifications();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [all, setAll] = useState(false);
  const active = items.find((i) => i.id === activeId) || null;
  const followup = workspace.program?.followups.find(
    (f) => f.id === active?.id,
  );
  const context = followup
    ? {
        collect: [followup.request],
        brief: followup.why,
        suggestedRole: followup.owner,
      }
    : active
      ? followupContext[active.id]
      : undefined;
  const copy = active ? actionCopy(active) : null;
  return (
    <section className="assurance-clear-inbox" aria-label="Evidence requests">
      {!compact && (
        <header>
          <h4>Evidence requests</h4>
          <Link href="/assurance?view=findings">All requests ↗</Link>
        </header>
      )}
      {(all ? items : items.slice(0, limit)).map((item) => {
        const text = actionCopy(item),
          late = item.overdue && text.stage === "collect";
        const Icon =
          text.stage === "recorded"
            ? CheckCircle2
            : text.stage === "review"
              ? FileSearch
              : late
                ? Flag
                : Upload;
        return (
          <article
            key={item.id}
            className={`clear-request ${text.stage} ${late ? "late" : ""}`}
          >
            <span className="clear-request-icon">
              <Icon size={21} />
            </span>
            <div className="clear-request-copy">
              <h4>{text.title}</h4>
              <p>{text.instruction}</p>
              {late && <span className="late-tag">Overdue</span>}
              <AssuranceRequestContext
                workspace={workspace}
                id={item.id}
                due={item.due}
                compact
              />
            </div>
            <button
              className="clear-request-cta"
              onClick={() => setActiveId(item.id)}
            >
              {text.button}
              <ArrowRight size={16} />
            </button>
          </article>
        );
      })}
      {items.length > limit && (
        <button className="show-requests" onClick={() => setAll(!all)}>
          {all ? "Show fewer" : `Show ${items.length - limit} more requests`}
        </button>
      )}
      {!items.length && (
        <p className="case-limit">No open requests in this view.</p>
      )}
      <Dialog.Root
        open={!!active}
        onOpenChange={(open) => {
          if (!open) setActiveId(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="assurance-drawer-overlay" />
          <Dialog.Content className="assurance-drawer clear-request-drawer">
            <Dialog.Close className="drawer-close" aria-label="Close request">
              <X />
            </Dialog.Close>
            <span className="assurance-eyebrow">
              {copy?.stage === "recorded"
                ? "REVIEWER DECISION"
                : copy?.stage === "review"
                  ? "REVIEW EVIDENCE"
                  : "DOCUMENT REQUEST"}
            </span>
            <Dialog.Title>{copy?.title}</Dialog.Title>
            <Dialog.Description>{copy?.scope}</Dialog.Description>
            {active && copy && (
              <>
                <div className="request-drawer-state">
                  <span>{active.status}</span>
                  <small>
                    {active.due
                      ? `Due ${dateLabel(active.due)}`
                      : "No due date"}
                  </small>
                </div>
                {copy.stage === "collect" && context ? (
                  <section className="request-checklist">
                    <h3>What to add</h3>
                    <ul>
                      {context.collect.map((line) => (
                        <li key={line}>
                          <Upload size={15} />
                          <span>{line}</span>
                        </li>
                      ))}
                    </ul>
                    <details>
                      <summary>Why this is needed</summary>
                      <p>{context.brief}</p>
                    </details>
                  </section>
                ) : (
                  <section>
                    <h3>
                      {copy.stage === "recorded"
                        ? "Decision & reason"
                        : "What needs review"}
                    </h3>
                    <p>{active.next}</p>
                  </section>
                )}
                <AssuranceRequestContext
                  workspace={workspace}
                  id={active.id}
                  due={active.due}
                />
                {active.sources.length > 0 && (
                  <section className="request-linked-sources">
                    <h3>Linked documents</h3>
                    {active.sources.map((source, i) => (
                      <details key={i}>
                        <summary>
                          {source.title} · v{source.version}
                        </summary>
                        <small>{source.sourceDate}</small>
                        {source.passages?.map((p) => (
                          <blockquote key={p.id}>
                            {p.text}
                            <small>{p.locator}</small>
                          </blockquote>
                        ))}
                      </details>
                    ))}
                  </section>
                )}
                {active.response && (
                  <section>
                    <h3>Latest response</h3>
                    <p>{active.response}</p>
                  </section>
                )}
                {copy.stage === "collect" && context ? (
                  <>
                    <Link
                      className="assurance-primary"
                      href={`/sources?request=${encodeURIComponent(active.id)}#upload-evidence`}
                    >
                      Upload documents <Upload size={17} />
                    </Link>
                    <Link
                      className="request-secondary"
                      href={`${active.href}&unavailable=1`}
                    >
                      Document missing or unavailable?
                    </Link>
                    <Link className="request-secondary" href={active.href}>
                      Respond or view request history →
                    </Link>
                  </>
                ) : (
                  <Link className="assurance-primary" href={active.href}>
                    {copy.stage === "recorded"
                      ? "View decision & history"
                      : "Open review"}
                    <ArrowRight size={17} />
                  </Link>
                )}
                <small className="request-disclaimer">
                  Adding a file does not approve it. A reviewer records the
                  decision.
                </small>
              </>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </section>
  );
}
