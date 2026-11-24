"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowUpRight, Clock3 } from "lucide-react";
import { useMemoryStore } from "@/stores/program-memory-store";
import {
  emptyLedgerFilters,
  eventBacklink,
  eventGroup,
  eventGroups,
  eventLabel,
  eventNeedsAttention,
  filterEvents,
} from "@/lib/transparency";

export function TransparencyLedger() {
  const events = useMemoryStore((state) => state.events);
  const [filters, setFilters] = useState(emptyLedgerFilters);
  const [limit, setLimit] = useState(30);
  const update = (key: keyof typeof filters, value: string) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setLimit(30);
  };
  const invalidDates =
    !!filters.from && !!filters.to && filters.from > filters.to;
  const visible = filterEvents(events, filters);
  const actors = [...new Set(events.map((event) => event.actor))].sort();
  return (
    <section className="memory-card overflow-hidden" aria-label="Event ledger">
      <div className="ledger-filters border-b p-4">
        <label className="ledger-search">
          Search history
          <input
            className="memory-input"
            type="search"
            placeholder="Document, action, person or reason…"
            value={filters.query}
            onChange={(e) => update("query", e.target.value)}
          />
        </label>
        <label>
          Event type
          <select
            className="memory-input"
            value={filters.group}
            onChange={(e) => update("group", e.target.value)}
          >
            <option value="">All event types</option>
            {eventGroups.map((group) => (
              <option key={group}>{group}</option>
            ))}
          </select>
        </label>
        <label>
          Actor
          <select
            className="memory-input"
            value={filters.actor}
            onChange={(e) => update("actor", e.target.value)}
          >
            <option value="">All actors</option>
            {actors.map((actor) => (
              <option key={actor}>{actor}</option>
            ))}
          </select>
        </label>
        <label>
          From (UTC)
          <input
            className="memory-input"
            type="date"
            value={filters.from}
            onInput={(e) => update("from", e.currentTarget.value)}
            onChange={(e) => update("from", e.target.value)}
          />
        </label>
        <label>
          To (UTC)
          <input
            className="memory-input"
            type="date"
            value={filters.to}
            onInput={(e) => update("to", e.currentTarget.value)}
            onChange={(e) => update("to", e.target.value)}
          />
        </label>
        <button
          className="memory-action memory-secondary self-end"
          onClick={() => {
            setFilters(emptyLedgerFilters);
            setLimit(30);
          }}
        >
          Clear filters
        </button>
      </div>
      {invalidDates && (
        <p role="alert" className="maptoc-alert m-4">
          Choose an end date on or after the start date.
        </p>
      )}
      <p role="status" className="border-b px-4 py-3 text-sm text-slate-600">
        {visible.length} of {events.length} events · Newest first · UTC
      </p>
      <ol className="divide-y">
        {visible.slice(0, limit).map((event) => {
          const backlink = eventBacklink(event.href);
          const attention = eventNeedsAttention(event);
          const time = Date.parse(event.occurredAt);
          return (
            <li key={event.id} className="p-4">
              <article
                className={
                  attention ? "maptoc-alert ledger-entry" : "ledger-entry"
                }
              >
                <div className="flex items-start gap-2 text-sm text-slate-500">
                  <Clock3 className="mt-1 size-4 shrink-0" />
                  <div>
                    {Number.isFinite(time) ? (
                      <time dateTime={event.occurredAt}>
                        {new Date(time).toLocaleString("en-GB", {
                          timeZone: "UTC",
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </time>
                    ) : (
                      "Time unavailable"
                    )}
                    <p className="mt-1">{event.actor}</p>
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="mb-1 text-xs text-slate-500">
                    {eventGroup(event.action)}
                  </p>
                  <h3 className="flex items-center gap-2 text-base font-semibold">
                    {attention && <AlertTriangle className="size-4 shrink-0" />}
                    {eventLabel(event.action)}
                  </h3>
                  <p className="mt-2 break-words text-sm leading-6">
                    {event.detail}
                  </p>
                  {backlink ? (
                    <Link
                      className="mt-3 inline-flex items-center gap-1 text-sm font-semibold underline underline-offset-4"
                      href={backlink.href}
                    >
                      {backlink.label}
                      <ArrowUpRight className="size-4" />
                    </Link>
                  ) : (
                    <p className="mt-3 text-sm">Related resource unavailable</p>
                  )}
                  <details className="mt-3 text-xs text-slate-500">
                    <summary className="cursor-pointer">Event details</summary>
                    <dl className="mt-2 break-all">
                      <dt>Event ID</dt>
                      <dd>{event.id}</dd>
                      <dt className="mt-1">System action</dt>
                      <dd>{event.action}</dd>
                    </dl>
                  </details>
                </div>
              </article>
            </li>
          );
        })}
      </ol>
      {!visible.length && (
        <div className="p-8 text-center text-sm text-slate-600">
          {events.length
            ? "No events match these filters. Clear filters or widen the date range."
            : "No events yet. Upload a document or review a suggestion to begin."}
        </div>
      )}
      {visible.length > limit && (
        <div className="border-t p-4">
          <button
            className="memory-action memory-secondary"
            onClick={() => setLimit((current) => current + 30)}
          >
            Show more events
          </button>
        </div>
      )}
    </section>
  );
}
