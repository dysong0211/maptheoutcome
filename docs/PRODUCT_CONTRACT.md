# Maptoc Beta Product Contract

This contract fixes the meaning of the beta's central concepts. Interface copy, demo behavior, and later backend rules must follow it.

## Website-aligned contract — authoritative revision, 17 September 2026

MapToc gives a program a source-linked memory of results, decisions, risks, changes, lessons and unanswered questions. The main demo is the synthetic Maternal Health Program in Cambodia. The old EV example is a secondary prototype.

- A **source document** has preserved versions and located passages. It is not itself a reviewed finding.
- A **proposal** is a prepared AI suggestion. Its original statement remains unchanged when a reviewer edits an interpretation.
- A **reviewed record** retains its source-version reference, exact quotation, event date, location, limitations and reviewer. Approval means suitable for the record, not proven true.
- A **review decision** preserves original/proposed wording, reviewed wording, rationale, actor and timestamp. Approved and rejected proposals cannot be reviewed again in this slice; a correction workflow is a later append-only revision, not silent overwrite.
- A **relationship** has a label and direction. Context, chronology and association are not causal proof.
- A **brief** is a draft assembled from approved records. It preserves citations and limitations. Author commentary is explicitly separate from evidence. It is not an accepted reporting submission.
- Program-event dates, source-document dates, capture timestamps and review timestamps are distinct. The sample's inferred “yesterday” date is illustrative; production parsing must mark inference and uncertainty.
- Reach and session counts are outputs. An attendance narrative is a tentative signal. Neither establishes improved access to care or impact.

The role switcher now exposes Program Manager (sample capture and draft briefs), M&E Reviewer (approve/edit/reject/flag and draft briefs), and Funder/Viewer (read-only). These are client-side demo guards, not security boundaries. All synthetic sources have the same demo audience; source/passage/summary access separation remains a pilot requirement.

The main demo stores prepared source text, records, decisions and draft selections in `maptoc-program-memory-v1`. The earlier EV metadata remains in `maptoc-investor-demo`. Reset restores both seed scenarios. There is no live extraction, private upload storage, authentication, database audit control or integrity verification.

User-selected demo files are stored as browser-local blobs in IndexedDB (`maptoc-demo-files`) with source metadata in the program-memory store. Accepted formats are PDF, Word, Excel, CSV, text, JSON and common images, limited to 15 MB each. Text-like files receive a bounded local preview; other formats remain preview/download-only. Capturing a file creates no AI proposal and no reviewed finding. Reset removes captured metadata and clears the browser-local blob store. This is local demo storage, not private institutional storage.

The sections below retain the wider target-domain and pilot requirements. They do not imply all features are implemented.

## Domain language

| Term | Meaning in Maptoc |
| --- | --- |
| Program | A funded initiative operated by a grantee organization |
| Activity | Work performed by the program |
| Milestone | A dated delivery commitment or checkpoint |
| Outcome | An intended change associated with the program |
| Indicator | A defined measure used to observe an outcome or delivery result |
| Observation | A value or qualitative finding recorded for an indicator and period |
| Evidence | A versioned source linked to a claim, milestone, outcome, or observation |
| Submission | A period-specific package of reported results and evidence |
| Review decision | A human decision about whether a submission is suitable for its stated reporting purpose |

“Accepted for reporting” does not mean independently verified, causally established, compliant with every external rule, or approved for funding release.

## Beta permission matrix

| Capability | Funder Admin | Program Manager | Field Contributor | Reviewer | Auditor / Viewer |
| --- | --- | --- | --- | --- | --- |
| View assigned programs | Yes | Yes | Limited assignment | Yes | Yes |
| Publish framework version | Yes | No | No | No | No |
| Configure program additions | View | Yes | No | View | View |
| Add draft evidence | View | Yes | Yes, assigned scope | View | View |
| Replace evidence | View | Yes | Limited assignment | View | View |
| Draft observations | View | Yes | Yes, assigned scope | View | View |
| Submit reporting package | No | Yes | No | No | No |
| Request context | No | No | No | Yes | No |
| Accept for reporting | No | No | No | Yes | No |
| Change memberships | Yes, own organization | Limited invite scope | No | No | No |
| Modify transparency history | No | No | No | No | No |

The demo perspective switcher exposes Funder/Viewer, Program Manager and M&E Reviewer. It simulates perspective, not authentication.

## Independent states

### Delivery

`Planned → In progress → Reported complete`

Reported completion may be revised with an explanation. It does not imply that evidence has been reviewed.

### Evidence

`Pending upload → Processing → Available`

`Processing → Failed` and `Available → Needs context` are permitted. Replacing evidence creates a new version; it does not rewrite the previous version.

### Submission

`Draft → Submitted → Context requested → Resubmitted → Accepted for reporting`

An authorized reviewer may return an accepted submission to context requested through a new recorded decision. The earlier decision remains in history.

### Outcome assessment

`Not yet assessed → Progress reported → Target reported met`

Outcome assessment is a reported state with sources and limitations. It remains separate from delivery and review states.

## Material events recorded in the beta

- Framework version assigned or adopted.
- Evidence uploaded, replaced, linked, or intentionally left unmapped.
- AI suggestion accepted, edited, or dismissed.
- Indicator observation revised.
- Milestone or outcome status changed.
- Submission submitted, returned, resubmitted, or accepted for reporting.
- Membership or program assignment changed.

Draft typing, temporary canvas selection, filters, page visits, and autosave heartbeats are not transparency events.

## Demo claims

- All visible data is synthetic.
- Session uploads store metadata in the browser for demonstration.
- Demo ledger entries simulate the future server-generated audit path.
- AI suggestions use prepared sample results until real processing is implemented.
- Reset returns the workspace to its seeded scenario.

## Pilot claims requiring implementation evidence

The product must not claim tenant isolation, private durable evidence storage, append-only database history, independent tamper evidence, or production AI processing until the relevant pilot exit gates and tests pass.
