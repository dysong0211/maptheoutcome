# MapToc — website-aligned development plan

Updated: 18 September 2026. This is the active plan and project memory.

## Latest revision — light Overview

Overview is now a compact starting point: upload, a link directly into the question workspace, one evidence-summary sentence, reported reach and transport-spend visuals, risk/report reminders and the high-level timeline. Detailed source metadata, quotations, contribution paths, gap lists and finance explanations remain in Evidence Insight, Documents and Finances. Nothing was deleted from browser storage.

- [x] ~~Remove duplicate explanatory blocks and inline evidence drawers from Overview.~~
- [x] ~~Preserve meaningful actual-versus-plan visuals, readable type, red attention boxes and direct detail links.~~
- [x] ~~Keep upload AI opt-in accessible under Upload options and open Ask directly in Evidence Insight.~~

Current preview: `.next-light-overview`, port 3003; supersedes the checkpoint builds below. Public/static deployment remains unchanged.

## Latest revision — connected outcome trail

The website's outcome-trail concept is now the default Evidence Insight experience: select a finding, inspect related decisions/risks/questions, and read the pinned quotation and review context beside it. Overview's reach metric opens this trail. Next inputs use the existing sample requirement links and scheduled due dates; no owner, cause or confidence rating is invented.

- [x] ~~Consolidate related evidence and source inspection into one workspace without adding a primary tab.~~
- [x] ~~Preserve the full repository, extensive analysis, program synthesis, general evidence questions and officer observations.~~
- [x] ~~Provide shareable local finding URLs, red risk/gap states, source-limited AI synthesis and missing-data handling.~~
- [x] ~~Run all six regression entry points and a production build; visually inspect the trail and test risk/source selection and financial-finding selection.~~
- [ ] Complete responsive and screen-reader checks, full route walkthrough, and static website package refresh during Stage 8.

Current local preview: `.next-outcome-trail-final`, port 3003. No public publishing, server storage or live provider request was part of this revision. Cross-program intelligence and geographic maps remain deferred. Relationships come from stored records, not automatic causal inference; new findings without links remain unconnected.
 
## 18 September 2026 — Transparency and attention design

- [x] ~~Red outlined risk/error/gap treatment; neutral and mint routine information.~~
- [x] ~~Shared, filterable Transparency Log and repository history with source/review/report backlinks.~~
- [x] ~~Clear event labels, preserved review rationale, link/unlink distinction and relevant before/after context.~~
- [x] ~~Automated filter, workflow and provider-mock regression tests; browser filter and layout checks.~~
- [ ] Stage 8: complete accessibility, responsive and download verification; refresh the static website package.

Transparency checkpoint build: `.next-transparency-final` (superseded by the latest outcome-trail preview above). No public deployment made. Browser-local history is resettable, not tamper-proof. The live AI adapter is implemented but real-provider testing still requires an API key; no live provider request was made for that revision.

## Latest design checkpoint — research before further development

Final palette locked to the user-selected screenshot (eed065b6): near-black blue-green sidebar `#0B161B`, teal charts and links `#007F78`, white panels, neutral canvas `#F5F6F7`, small bright-green navigation accents, outlined Upload button. This supersedes all prior mint/lime/forest color trials. Do not continue color exploration unless the user requests it.

Feature update implemented and tested: **MapToc Outcome Intelligence** heading, evidence-status badges with explanation drawers, two priority gap actions, a compact information banner, shared metric sizing, and contributing-factor pathways inside Evidence Insight. Gap detail retains every unresolved input, including undated requirements. Existing task deadlines are shown separately from the donor-report date; no owner or AI deadline is invented. Reviewer decisions require rationale and are pinned to the source snapshot and link revision; new links invalidate prior acceptance. Input acceptance does not establish outcome impact. See [feature value review](FEATURE_VALUE_REVIEW.md) for the decision boundaries.

- [x] ~~Implement the accepted evidence-utility additions while preserving the final palette and repository.~~
- [x] ~~Verify regression suites, evidence-support tests, production build and desktop/390px Overview behavior.~~
- [ ] Validate an evidence-strength rubric and owner assignment with pilot users.
- [ ] Complete all-section accessibility testing and rebuild the website export before publication.

Latest source-clarity update: replaced the ask-area wording with “Ask what changed. Explore why. Check the evidence.” Both headline metrics now expose their own validated source title/date/version and direct source link, with short limitations. Overview shows a bounded possible-contribution explanation; missing inputs explain the assessment they enable. No fabricated confidence, causal attribution, owners or deadlines were added. Pipeline checklist and QA reflect completion.

Live-AI checkpoint build: `.next-live-ai-ready` (superseded by the latest preview above). The live AI server connection and UI are implemented for local use; activation and real-provider testing await `OPENAI_API_KEY`. The static website package remains a sample demo. See [Live AI setup](LIVE_AI_SETUP.md) and the pipeline's activation gate. No public publishing or production authentication was added.

Earlier design pass: the user authorized applying the researched concepts. The MapToc-specific design pass added a shared shell (now using the final palette above), prominent evidence ask/upload entry, delivery → observed change → lasting impact pathway, source-derived transport variance with a budget marker, three concise attention signals, visible Gantt-style timeline, and a reusable Evidence lens with pinned quotations. Evidence Insight uses the same ask/evidence interaction; its extensive analysis and repository remain intact. Prepared lookup is explicitly not live AI. No stores were reset or evidence deleted. Website export has not been regenerated for this pass.

- [x] ~~Apply shared AI-first visual language without changing the five-section navigation.~~
- [x] ~~Build the MapToc outcome pathway and source-backed financial panel.~~
- [x] ~~Add contextual source inspection and bounded demo evidence lookup.~~
- [x] ~~Verify production compilation, regression tests, lookup tests, desktop/narrow-screen rendering, source links and read-only upload controls.~~
- [ ] Complete a full phone-width accessibility pass and refresh the static website package before publishing this redesign.

Design rationale: the user found the previous interface too wordy and record-system-like. See [AI-first interface research](AI_PRODUCT_DESIGN_RESEARCH.md) for official product references. The implementation adapts compact contextual suggestions, source-backed answers, briefings and analytical drilldowns to MapToc. Preserve all repository content and the five primary destinations. This checkpoint supersedes earlier visual-layout decisions below, not the evidence-integrity or demo-honesty requirements.

## Core product rule — user direction, 17 September 2026

Current correction: simplify access, not information. Restore the extensive material inside Documents & repository, with a browse selector for documents, reviewed findings, LogFrame/extraction, funding ledger, deliverables, outputs, program data, relationships, observations and history. The prior search-only/no-inventory decision is superseded. Keep five primary sections. Overview must contain only a few decision-oriented charts/tables, and every figure must link to a source, mapping, or explicit sample plan. Compare period targets with source-supported reported values; show funding decisions alongside delivery evidence without calling milestones verified. Use the same derived LogFrame observations in Overview and the repository. Arbitrary uploaded documents remain captured but unprocessed until live ingestion is built.

Implemented demo pipeline: known sample document → prepared extraction suggestions → human review → source-linked structured indicators / qualitative context → derived plan variance → refreshed explained outcomes. Live implementation next: versioned LogFrame definitions, tenant-scoped ingestion jobs/OCR, bounded extraction with citations and proposed mappings, human-approved normalized observations, event-driven variance recalculation, versioned outcome synthesis and replayable report snapshots. A source link is not truth verification; approval never releases funding automatically.

Latest navigation decision (supersedes the earlier separate-detail-tab plan): exactly **Overview, Evidence Insight, Program Progress, Documents, Finances**. No duplicate program tab bar. Overview combines a brief AI summary, upload, high-level Gantt-like timeline, risk outlook, finance visual and important reports. Evidence Insight is the analytical center; outcome analysis, risk explanations and report preparation are contextual views within it. Program Progress shows the overall program arc, not district delivery tables or granular activities. Documents is upload/capture/search-first, not a full inventory by default. Preserve uploaded sources and officer observations; removing detailed listings is a presentation change, not erasure of historical evidence. Older route URLs remain compatibility entries into these consolidated views.

Donor strategy: minimize duplicate reporting, surface the program-wide picture, and make claims traceable. Evidence Insight leads with explained outcomes (what happened, what changed, constraints, unanswered questions, next decision), recalculated from reviewed source-backed records. Finances shows planned resources → recorded spending → delivery → unestablished impact, with no implication that a milestone is independently verified or that spending caused the result. Passive ingestion, plan-vs-actual detection and portfolio aggregation are production goals; do not market the current local demo as zero-burden reporting, continuous verification or live AI retrieval. Reuse routine documents and human review rather than require exhaustive activity logging.

MapToc is primarily outcome intelligence, not a generic task manager or document store. Overview is the concise master summary: upload, AI outcome summary, short-/long-term implications, financial variance, missing inputs and links to detail. No risk tables, analytical tables, long explanations or full timelines on Overview. Risk Intelligence owns risk reasons, horizons, bases and actions; Outcome Analysis owns charts and financial scenarios. A separate Program Management tab is the explicit exception to the intelligence-first rule: it shows reported numbers, target progress, expenditure and schedules without AI narration. File availability never implies activity completion. Document upload, suggested insights and officers' own observations remain central. For training and similar activities, preserve headcounts separately from qualitative sentiment, perceived changes and important observations. Capture these at the time they are noticed, with officer attribution, source context, observation date and capture timestamp. Keep human interpretations distinct from measured impact and AI suggestions.

Financial intelligence must prominently highlight **Variance requiring context**, explain recorded drivers, and offer conditional forward scenarios. Risk intelligence must distinguish short-/long-term horizons and recorded risks, AI hypotheses, and good-practice/reporting checks. Timelines organize evidence needs for M&E checks, donor calls, biannual reports and IRB submissions; they exist to reveal missing inputs and support outcomes, not generic task completion. Outputs organize evidence for analysis, presentations, reports and publications.

Demo constraints: summaries and suggestions remain explicitly labeled as prepared/rule-based demo synthesis until a live model service is connected. Do not pretend an uploaded document has undergone AI review. Officers can capture their own insights now; document-derived claims must retain a source and human review state.

## Product and design reference

Reference: https://maptheoutcome.org/ — hero program workspace, capture/extract/review/connect/use preview, funding-context pathway and claim/source inspector. Product interpretation also follows the reviewed white-paper chapters at `/white-paper/capture-and-review.html`, `/white-paper/evidence-model.html`, `/white-paper/permissions.html` and `/white-paper/pipeline.html`.

Current product direction (17 September): document upload and AI outcome intelligence are the core experience. Keep Overview summary-only, with details one click away in Program Management, Outcome Analysis, Risk Intelligence, Timeline and Outputs. Use direct labels and short instructions; reserve promotional copy for the website. Source passages and detailed evidence records belong in repository and detail views. Use the website's blue-green navigation, restrained mint accent and category colors.

Primary synthetic story: Cambodia maternal health; August outreach, Saturday scheduling, facility stock risk, a USD 12,000 transport variance and an unanswered care-access question. A September update provides three reviewable suggestions. Sources and all figures are fictional sample material adapted for the demo, not real clinical or program evidence.

## Revised delivery sequence

| Section                           | Deliverable                                                                         | Status / exit gate                          |
| --------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------- |
| A. Website-aligned foundation     | Shell, program tabs, source/proposal/record/decision model                          | Complete for core demo scope; QA below      |
| B. Reviewed-record vertical slice | Sample capture, review, record, source inspector, timeline, map, brief              | Complete for core demo scope; QA below      |
| C. Evidence lifecycle             | Real local file capture, preview, versions, correction history, ingestion states    | In progress; browser-local capture complete |
| D. Institutional configuration    | Versioned requirements, responsibilities, period rules, scoped sharing              | Planned                                     |
| E. Pilot backend                  | Auth, tenant isolation, private storage, jobs, server review actions, durable audit | Planned                                     |
| F. Live document intelligence     | Parsing/OCR, bounded extraction, citations, human review, evaluation                | Planned after secure ingestion              |
| G. Pilot readiness                | Access, retention, backup/restore, audit exports, accessibility, onboarding         | Planned                                     |

## A–B implementation checklist

Completion marks are added only after code and scoped tests pass.

- [x] ~~Verify restored repository sections, source-linked LogFrame observations, decision dashboard drilldowns and prepared extraction/review mapping flow.~~

- [x] ~~Verify the five-section navigation, summary-first Overview, search-led documents and consolidated insight/finance/progress views; retire duplicate activity lists from the active experience.~~

- [x] ~~Separate concise Overview summaries from Program Management numbers, Outcome Analysis charts and Risk Intelligence details.~~
- [x] ~~Replace generic evidence windows with Deliverables & required uploads: prenatal-package procurement, midwife training, distribution, 30-day follow-up, M&E and donor/ethics reporting.~~
- [x] ~~Provide exact required documents per deliverable and preserve existing browser plans when adding new sample tasks.~~
- [x] ~~Add district-level prenatal analysis with denominators, missing-follow-up bounds and conditional financial scenarios.~~
- [x] ~~Add output checklists and source-linked, timestamped officer observations; retain explicit no-live-AI and unreviewed labels.~~

- [x] ~~Align shell and compact program workspace with website references.~~
- [x] ~~Separate preserved source versions/passages, original proposals, reviewed records and review decisions.~~
- [x] ~~Make maternal-health the main example and retain EV work in a labeled secondary route.~~
- [x] ~~Derive overview counts from actual demo records; distinguish output from outcome signal.~~
- [x] ~~Capture the sample once; keep prepared extraction explicitly labeled.~~
- [x] ~~Enforce demo action guards for Program Manager, M&E Reviewer and Funder/Viewer.~~
- [x] ~~Approve edited wording, reject or flag with rationale; preserve the original proposal and exact quotation.~~
- [x] ~~Keep event timeline separate from system-action history.~~
- [x] ~~Render typed contextual relationships and clickable source/record inspectors.~~
- [x] ~~Connect financial variance, incident, approval, delivery and the outcome evidence gap.~~
- [x] ~~Redesign the program homepage as an investor-ready intelligence dashboard with top-of-page file capture, evidence trend and record-mix visuals, synthetic financial analysis, and explicit outcome-evidence limitations.~~
- [x] ~~Assemble a cited draft from approved records only, with a readable plain-text export fallback.~~
- [ ] Confirm downloaded text artifact delivery in a supported browser; embedded-browser download event was not observed.
- [x] ~~Test persistence, duplicate actions, unknown sources, role restrictions and responsive layouts.~~
- [x] ~~Compact the homepage, remove the source inspector and promotional hero, add outcome summaries, missing-data upload prompts, evidence timeline and risk table.~~
- [x] ~~Remove the four standalone metric cards so document upload leads directly into the AI summary.~~
- [x] ~~Integrate the supplied refined website with the exported demo at `/demo/`, homepage/nav links, return-to-website navigation and reload-safe detail routes.~~
- [ ] Publish the combined package to the user's existing GitHub website. Local preparation does not update the live domain.

## Next section C — evidence lifecycle

1. ~~Accept user-selected synthetic files locally; clearly state where bytes are stored and offer size/type/error states. Do not describe a filename-only modal as an upload.~~ Completed for the demo: drag/drop and multi-file selection, 15 MB validation, PDF/Office/spreadsheet/text/JSON/image formats, browser-local IndexedDB bytes, persisted metadata, explicit results and reset cleanup.
2. Preview retained source bytes/text. Add document identity and immutable version identifiers; replacements append versions without retargeting existing citations.
3. Add reviewed-record corrections/supersession with a reason. A corrected record, original review and original source remain independently inspectable.
4. Add source unavailable/access revoked states and report warnings. Do not silently omit unsupported claims or substitute a newer source passage.
5. Separate captured, parsing, extraction ready, review pending and failed states. Retries must be idempotent.
6. Test version-pinned citations, rejected file types, quota errors, interruption, reset, unknown IDs and correction lineage before crossing off this section.

Prepared proposals should only be offered for known synthetic sample sources until a real extraction pipeline exists. Never fabricate model output for arbitrary uploads.

Uploaded text/CSV/JSON is read locally and capped to 50,000 characters for preview. PDF and images use browser-local object URLs; Office files retain the original for download. These previews are not model extraction, OCR, malware scanning or evidence approval. File bytes are not sent to a server.

## D — institution-specific expectations without compliance theater

- Configure intended change, population, place, reporting cadence, required record categories and named reviewers.
- Start light when a formal framework is absent. No automatic “requirement satisfied” states without supporting assessment.
- Version framework definitions and preserve rationale for amendments. Programs may add detail; exceptions to funder requirements need explicit recorded decisions.
- Separate finding approval, reporting-package acceptance and independent evaluation. None triggers funding automatically.
- Scope visibility independently for reviewed summaries, passages and original documents. Add contributor and auditor roles only with tested permissions.

## E–G — before real pilot data

- Revise Prisma to support source versions/passages, extraction jobs, proposals, records/revisions, relationships, decisions, report snapshots and framework versions. Existing Prisma schema is the old foundation, not the implementation of this slice.
- Supabase auth/private storage/RLS and a least-privilege server data layer; ensure Prisma connections cannot accidentally bypass tenant enforcement.
- Transactional server review actions + idempotent events/outbox. Client role switches are not authorization.
- Database append-only audit controls; characterize privileged administrator/backup threats separately. Hash chains alone do not establish independent tamper evidence. Only claim controls backed by tests.
- Validate files, scan malware, use bounded parsing, protect prompt boundaries and verify extracted quotations. Treat document instructions as untrusted data. No automatic approval or truth/confidence badges.
- Provider data-use/retention/region review before transmitting real sources. Source, passage and summary permission checks at retrieval and export.
- Accessible mobile capture and explicit offline/retry semantics. Defer CRDTs until actual collaborative conflicts warrant them.
- Restore exercises, region and retention choices, data export/exit plan, incident response and named pilot onboarding owners.
- Measure total capture+review+correction+retrieval+report effort, source-meaning fidelity and handover usefulness. Do not claim the demo proves product efficacy.

## Explicitly deferred

Live model integration; Drive/SharePoint connectors; production auth/RLS; real storage and malware processing; automatic risk scoring; map authoring; batch reviews; Word/PDF exports; public sharing; cross-program comparisons; jurisdictional certifications; cryptographic audit guarantees. No hard delivery dates until pilot scope and infrastructure are agreed.

## Demo walkthrough

1. Open `/dashboard`: drop a file, inspect the sample AI summary, short-/long-term outcome evidence, missing-data prompts, finances and risks. The initial demo role permits uploading.
2. Choose Program Manager → Source library → Load sample update.
3. Choose M&E Reviewer → Review inbox → edit a finding, supply rationale, approve.
4. Open the approved record and source version. Navigate its relationships and event timeline.
5. Reports → select approved records → Build cited draft → inspect/download text with quotations and limitations.
6. Transparency log → inspect linked capture/review/draft events.

The demo is browser-local and resettable. No external messages, uploads or funding actions occur.

## QA evidence

See [QA_PROGRAM_MEMORY.md](./QA_PROGRAM_MEMORY.md) for checks and limits. The core workflow passes; browser download delivery remains an explicit compatibility check. Automated assertions cover the real Zustand actions (including old EV regressions), not a duplicate mock implementation. Production build uses `MAPTOC_BUILD_DIR=.next-demo` to avoid colliding with any running development server.
