# MapToc — feature value review

Date: 17 September 2026. Status: accepted demo features implemented; assessed evidence strength remains deferred.

Implemented: evidence-status badges, two prioritized Overview requests with configured deadlines, reviewer acceptance/request-more decisions with source/link revision tracking, contribution detail in Evidence Insight, the subtle information banner and responsive metric sizing. The heading is now **MapToc Outcome Intelligence**. The recommendation sections below preserve the rationale and future acceptance criteria; owner assignment, a calibrated strength rubric and production-grade review security remain future work. Tests and precise verification scope are recorded in QA_PROGRAM_MEMORY.md.

The user selected the supplied Overview screenshot as the final visual reference. Freeze that palette and layout direction; concentrate future work on evidence utility. This review is based on the current demo implementation and product goals, not a claim of user-research validation.

## Decisions

Follow-up evaluation implemented: replace vague ask wording with “Ask what changed. Explore why. Check the evidence.” Prioritize visible metric provenance over generic confidence numbers. The reach and spending figures now show source title/date/version, direct links and limits. Overview includes possible contributing factors and the consequence of missing attendance/care-access inputs. Keep the extensive contribution analysis in Evidence Insight. Do not turn document counts into quality scores, imply confirmed package delivery from outreach totals, invent causes or owners, or treat this visual change as audit-readiness certification. Strength rubrics and accountable assignment remain planned work.

| Proposal | Decision | Placement and boundary |
| --- | --- | --- |
| Evidence-strength badges | Include status now; assessed strength after a rubric is defined | One compact evidence-support badge per outcome stage; explanation in Evidence lens. No opaque percentage or automatically “verified” label. |
| Contribution pathways | Include next; high differentiating value | A short “Explore contributing factors” entry in Overview; full pathway under Evidence Insight. No new primary tab or large homepage graph. |
| Actionable evidence gaps | Include now; highest immediate workflow value | At most two prioritized gap actions near the overview briefing. Each names the needed input, linked output, owner if assigned, and an actual configured deadline. |
| Status callout banner | Include as a minor visual refinement | Replace the existing briefing line with a compact inline information banner. Not a modal, toast, repeated alert or extra summary. |
| Metric alignment | Include as responsive polish | Shared metric-group sizing, baseline alignment and label wrapping. Preserve readable labels instead of forcing everything onto a single line. |

## 1. Evidence support: informative, not an invented assurance score

The current demo validates source links and reviewed quotations. `deriveLogframe` extracts bounded metrics from known samples. Neither operation establishes truth, representativeness, independent corroboration or causal impact. Document counts must not be converted into evidence strength.

Proposed rubric dimensions: relevance to the claim, time period, coverage, independence of sources, agreement/contradiction, method limitations and review status. Show a compact label such as **Missing**, **Source-limited**, **Corroborated**, or **Mixed** only when its basis is recorded. Use **Not assessed** when there is no assessment. These are not milestone completion levels or universal grades.

For this example: delivery can be labeled “Source-limited · reported”; observed change can show “Early signal” when an appropriate reviewed qualitative observation exists, otherwise “Missing follow-up”; lasting impact remains “Not established.” Keep evidence support, review status and outcome status as distinct fields. Qualitative evidence can be highly relevant; it must not automatically rank below quantitative data.

Clicking a badge should reveal the supporting and contradicting passages, basis of assessment, assessor/reviewer, date and unresolved limitations. AI may propose an assessment; do not silently upgrade it after upload. If no rubric is yet available, ship evidence-status badges first, not simulated strength ratings.

## 2. Contribution: explain plausible links without claiming causation

MapToc already has typed relationships: flooding → transport approval → spending, schedule change → reach, and stock shortages → delivery constraints. These provide an implementation starting point, but some links are contextual, not causal.

Example pathway: community feedback → Saturday scheduling → attendance hypothesis → care-access question. Assumptions: intended recipients could attend, facilities had supplies, referrals were usable. External factors: flooding, stock availability and other services. The UI should distinguish documented decisions, officer interpretations, AI hypotheses and untested assumptions.

Do not draw a solid causal arrow from spending to improved maternal health. Each edge needs a relationship type, source(s), review state, assumption or alternative explanation, and relevant period. When outcome change has not been established, say “Possible contributing factors” rather than “Why impact improved.”

## 3. Evidence gaps: bridge insight to useful action

The existing `assessInputs` function still checks only source presence for legacy schedule/output counts. The new gap workflow separately tracks input acceptance, rationale and source/link revision. Tasks supply deadlines; requirements still have no assigned owner or independent deadline. Scope sufficiency is a recorded reviewer judgment, not an automated validation. A linked file is therefore not the same as a resolved gap.

Recommended flow: identify gap → explain what conclusion/output it blocks → request or upload the specific input → review relevance/coverage → resolve with retained history, or reopen with a reason.

Concrete existing demo dates: referral/care-access follow-up is needed for the recipient-follow-up task due **30 September 2026** and the donor report due **24 October 2026**. These are configured sample dates, not new AI-generated deadlines. Show “Owner unassigned” until someone is assigned; never invent an assignment. Separate input due date from report due date. Any AI-suggested date is a proposal requiring confirmation.

Example compact action: **Care-access follow-up needed · 30 Sep** → **Upload follow-up**; secondary detail explains that it supports the 24 Oct donor report. Other views retain all lower-priority gaps. Rank based on configured deadlines and explicit decision dependencies, not fabricated risk probabilities.

## 4–5. Visual refinements

Use an info icon and subtle neutral/teal border for the briefing: absence of measured long-term impact is an information limitation, not automatically a program failure. Reserve warning styling for an actual overdue requirement or significant risk. No interruption or dismissal needed.

The current reach and spending figures already share a 34px metric rule. Their groups differ in margins and flex behavior. Test 390px, 768px, 1280px and 1440px with large amounts, unavailable values and translated/long labels. Align metric baselines and keep each unit/denominator attached to its own value; avoid shrinking critical text to make the cards match.

## Recommended sequence

1. Evidence-status badges, two actionable gap rows, inline briefing banner and metric alignment.
2. Contribution-pathway detail with typed edges, assumptions and alternate explanations.
3. Evidence-strength rubric and calibrated reviewer/AI workflow after testing with pilot users.

Do not add new primary tabs, upload quotas masquerading as evidence quality, percentage confidence scores, automatic causal conclusions or a large task list on Overview. Preserve the full repository and the existing five-section navigation.
