# MapToc — AI-first interface research

Date: 17 September 2026
Original status: research and proposed direction. Implementation status is recorded below.

Follow-up implementation: the user subsequently authorized this direction. The shared shell, Overview, evidence composer, source inspector, and Evidence Insight integration have been built and tested. Original research observations below are preserved; see WEBSITE_ALIGNMENT_PLAN.md for current implementation status. No competitor assets were copied.

## Decision

Make MapToc an evidence-to-answer workspace, not a record-management dashboard with AI paragraphs added. Preserve the extensive repository and five primary sections. Simplify the default presentation through a clear visual hierarchy and contextual drilldowns, not data deletion.

Primary references: Linear for compact interaction design; Glean for source-backed answers. Secondary references: Asana for briefings, MindBridge for analytical drilldowns, Workiva for assistance beside the working artifact. These are selected patterns, not a proposal to copy branding or recreate all five products.

## Method and limitations

Reviewed official product pages and documentation, and visually inspected published UI screenshots from Linear, Asana, MindBridge and Glean. Compared these with the running MapToc dashboard. No authenticated competitor accounts were tested. Published screenshots can be older than the current product; MindBridge's overview image has a 2020 asset path, so it is an interaction reference, not proof of its latest styling. Current MindBridge documentation was also reviewed.

## Reference selection

| Reference | Observed pattern | MapToc adaptation | Avoid |
| --- | --- | --- | --- |
| [Linear: Triage Intelligence](https://linear.app/changelog/2025-08-14-product-intelligence-technology-preview) | Compact suggestion panel, suggested fields and related items; explanations and alternative suggestions on demand. | Show proposed outcome mappings as compact chips. Open rationale, quotation and accept/edit actions only when selected. Use restrained borders and strong typography. | Importing software-ticket terminology or relying on low-contrast text. |
| [Glean: citations](https://docs.glean.com/user-guide/assistant/glean-chat/glean-chat-citations/glean-citations) and [unified search/chat](https://www.glean.com/blog/assistant-updates-search-img-gen-jan-drop-2026) | Inline source references, highlighted context previews, and search alongside answers. | Ask a program question, receive a concise answer, inspect the exact supporting passage without leaving the answer. | Making users read chat transcripts to find their program status. |
| [Asana Dash](https://asana.com/product/ai/dash) | A morning brief with three priorities, contextual source icons, review actions and an ask/search composer. | Three important changes or decisions, each with a short explanation and one next action. Scope the briefing to the selected program and reporting period. | A wall of equally important task cards or repeated AI narration. |
| [MindBridge experience](https://www.mindbridge.ai/experience/) and [assertion-risk dashboard](https://support.mindbridge.ai/hc/en-us/articles/360061672733-Audit-assertion-risk-dashboard-Overview) | Risk summaries lead to underlying entries and contributing factors; charts carry defined measures and periods. | A financial variance opens its drivers, evidence and unresolved questions. A risk opens its basis, horizon and affected outcome. | Copying financial-audit risk scores into program evaluation or treating an anomaly as verified wrongdoing. |
| [Workiva AI for Wdata](https://support.workiva.com/hc/en-us/articles/39987167733652-Workiva-AI-for-Wdata-queries) | Contextual assistant beside a query, starter prompts, and explicit insertion of generated changes. Documentation reviewed. | Place AI beside a report or evidence item; show proposed changes before the reviewer applies them. | Technical query-building controls on the donor homepage. |

## Why the current screen feels like a recording system

The visible dashboard repeats rounded containers, nested metric boxes, explanatory paragraphs and a three-column attention table. Text carries nearly every distinction. Important findings compete with caveats, metadata and navigation links. The user must interpret the records before discovering the insight.

The fix is not simply dark mode, smaller text or more charts. Give an answer, its significance, its source and its next action a consistent interaction pattern.

## Proposed visual direction

- Graphite navigation; a light, neutral analytical canvas; one cobalt/indigo accent for primary interaction. Preserve MapToc branding with restrained teal where useful. Use amber/red only for meaningful warning states.
- Five labeled destinations: Overview, Evidence Insight, Program Progress, Documents, Finances. Do not replace recognizable labels with an icon-only rail by default.
- Compact 14–16 px body typography, 24–28 px page titles, tabular numbers, subtle dividers, 8–12 px corner radii. Avoid nested cards, excessive pills, all-capital subheadings and promotional copy.
- Keep text contrast and keyboard focus visible. Compact controls must still have usable touch targets. Use labels as well as color; no hover-only evidence access.
- AI identity comes from document understanding, answers, source inspection and reviewable suggestions—not decorative sparkles, simulated thinking animations or unsupported confidence scores.

## Proposed Overview composition

1. Context header: program, period, last analysis time and a compact, accurate demo/live status.
2. Primary input: **Ask MapToc or drop documents**. Visible Upload button; suggested questions such as “What changed?” and “What is missing for the donor report?”
3. Briefing: one outcome headline and no more than three short signals. Each opens an evidence inspector. Target 60–90 words of default narrative across the overview; metadata and chart labels are separate.
4. Two analytical panels: output-to-outcome evidence and financial variance. Each must answer a named question, label its period/unit/target, and offer source inspection.
5. One compact Gantt-style program strip: significant milestones, report deadlines and missing-input markers. Detailed tasks stay under Program Progress.

On smaller screens, panels stack; do not achieve compactness by shrinking text. Full source documents, findings, observations, mappings and historical records remain searchable and browsable in Documents.

## Concrete demonstration content

These are proposed presentations of synthetic program data, not verified health findings.

- Output panel: **1,240 / 1,500 women reported reached** with a target marker and **260 below plan**. Label the measure as reported prenatal-package reach, not improved health. A separate outcome state reads **Follow-up evidence missing** rather than plotting an invented impact curve.
- Finance panel: **Transport $42k / $30k planned · +$12k**. Selecting the variance opens the reported route disruption, approval record and receipts needing review. Do not imply that transport spend alone caused all reported reach.
- Risk signal: **Short term: disrupted routes may increase costs**. Label whether it is a recorded concern or an AI hypothesis. Long-term care-access impact remains unknown until appropriate follow-up exists.
- Report marker: **24 Oct · Donor report** opens the exact required inputs and sources already available. The demo date must be explicit and must not silently masquerade as today's deadline.

## Core evidence interaction

Drop document → capture status → extraction/mapping suggestions → review → updated answer, variance or report draft → open source passage.

Selecting any finding opens a side inspector containing: concise explanation, supporting/contradicting sources, assumptions or missing inputs, and one relevant action. Keep officer observations separate from measured outcomes and AI hypotheses. An uploaded file does not automatically establish completion, truth or impact.

Current demo only supports local capture and prepared/rule-based synthesis. Do not imply that arbitrary uploaded files have been parsed by live AI. Real ingestion, tenant permissions, retrieval and evaluated synthesis remain separate backend work.

## Revised design-development sequence

- [x] ~~Research official interfaces and select reusable patterns.~~
- [x] ~~Document the proposed direction and preserve it in project memory.~~
- [ ] Produce one high-fidelity Overview design with an open source inspector before broad implementation.
- [ ] Validate hierarchy: find the main outcome, explain a variance, locate a missing input, and upload a document without navigating multiple pages.
- [ ] Implement shared shell, composer, insight row and source inspector while preserving existing repository data and role guards.
- [ ] Apply the same interaction language to Evidence Insight, then Finances, Documents and Program Progress.
- [ ] Test keyboard/mobile interaction, source provenance, persistence, review permissions and honest demo states before updating the deployment artifact.

Acceptance: no decorative chart; no unsupported prediction; no evidence deletion to simplify screens; no new primary tabs; no claim that styling alone makes the demo a live AI product.
