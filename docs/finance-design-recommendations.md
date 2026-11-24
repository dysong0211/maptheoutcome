# MapToc financial overview recommendations

Review date: 25 September 2026

## Recommendation

Keep MapToc as a source-linked programme intelligence layer, not an accounting system. Connect funding to planned activities, deliverables, results and evidence. Use approved reports or accounting exports as the financial record; do not make AI-generated figures authoritative.

The homepage now uses the requested illustrative allocation of USD 60,000: USD 42,000 expenditure is 70% used, leaving USD 18,000 unspent. This is a user-approved demo assumption, not a figure extracted from the supplied references. It does not replace the historical USD 30,000 transport plan in the existing sample evidence. Commitments are unknown, so USD 18,000 must not be called freely available cash. The Finances page's underlying model remains unchanged pending approval of this recommendation.

## What the references imply

1. **Separate the budget from the funding arrangement.** The supplied Direct Implementation Modality guidance distinguishes the project financial plan from the award/donor agreement. It also distinguishes expenses from prepayments and outstanding commitments. MapToc should display approved budget, funding received, expenditure and open commitments separately.
2. **Follow the results structure.** The PBF workbook's `1) Budget Table`, row 4 and rows 5–15, organizes budgets by outcome, output, activity and recipient organization; its second sheet reconciles output totals to cost categories. Use a deliverable/activity register as the primary structure, with cost categories secondary.
3. **Keep reporting periods explicit.** The supplied Combined Delivery Report guidance describes cumulative quarterly reporting (Q2 is January–June, not April–June only). Do not add successive cumulative reports together. Store period start/end, as-of date, cumulative/in-period basis, currency and report version.
4. **Track restrictions and mappings.** The supplied MPTF operating guidelines emphasize the link between fund/project identifiers and outputs. Distinguish donor earmarks from the team's intended use of unrestricted money. Do not label all planned uses as earmarks.
5. **Preserve revisions.** The GEF amendments guidance calls for justified, controlled changes to budgets and results. Preserve original and current approved plans, effective dates, approving evidence and reasons; do not overwrite history. GEF-specific thresholds must not become universal product rules.
6. **Keep operational and financial closure separate.** The 2025 closure SOP requires settlement/clearance of outstanding items. A completed deliverable or an uploaded invoice does not establish that the financial account is closed.
7. **Use monitoring and board decisions as context.** CPD, monitoring, oversight and quality-assurance references connect resources with indicators, baselines, targets, risks and management actions. MapToc should show these links without duplicating UN approval systems.

## Proposed Finances screen

At the top, show only actionable issues: missing expenditure report, unconfirmed budget revision, commitments not reported, unmapped activity, or funding received below approved commitments. Each issue needs a period, source and next action.

Then show four comparable figures for the selected period/currency: approved budget, funds received, reported expenditure and open commitments. Use `Not reported`, not zero, for missing inputs.

Below them, provide one activity table:

| Activity / deliverable | Donor or funding source | Earmark / planned use | Current approved budget | Expenditure | Open commitments | Uncommitted budget | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Source-defined activity | Source-defined fund | Restricted or unrestricted planned use | Approved revision | Same period / scope | Outstanding only | Budget minus expenditure minus non-overlapping commitments | Plan, report, approval |

Use two simple visuals: utilization by activity and funding received versus approved funding. Do not create a pie chart until there is a reliable category breakdown. A spending bar should answer how much of the approved allocation is used; outcome progress needs its own evidence and must not be inferred from expenditure.

## Rules that avoid misleading conclusions

- `Expenditure / approved allocation` is budget utilization, not necessarily cash usage. Label the denominator.
- `Budget − expenditure` is unspent budget. Subtract open, non-overlapping commitments only when known to calculate uncommitted budget.
- Cash availability requires receipts, payments, restrictions and other relevant balances. Do not infer it from an expenditure report alone.
- A budget is a control, not a guarantee that every imported record will reconcile. If expenditure exceeds an activity plan, show `Plan/report mismatch — review revision`, not an automatic conclusion that the organization spent money it did not have. Reallocations, scope mismatches, reporting periods or data errors may explain the difference.
- Never cap or rewrite imported expenditure to force it under the budget. Preserve source values and expose discrepancies.
- Avoid double counting commitments once they become expenditure, and avoid adding cumulative reports together.
- Blank templates and policy guidance are not actual programme budgets. Upload them to the repository; only confirmed programme-specific rows enter the tracking plan.
- Keep accounting execution, banking, payroll, procurement authorization and donor certification outside MapToc.

## Delivery sequence proposed for approval

1. Confirm the source schema and finance definitions above.
2. Add a reviewable import of budget, activity and funding rows with citations and period fields.
3. Add activity-level expenditure/commitment matching and reconciliation alerts.
4. Connect the confirmed plan to timeline deliverables and reporting gaps; retain revision history.

The current implementation adds only planning metadata (activity, planned amount, currency and funding/purpose) to the shared deliverable register. These are not treated as funds received or expenditure. Uploaded planning documents appear immediately, but new deliverables require user confirmation before entering the Gantt chart.

## Reference review and limits

The supplied DOCX/PDF materials were reviewed for relevant planning and finance content; this is a product-design review, not a legal/compliance certification or an audit of document formatting. The PBF XLSX was inspected read-only, including its outcome/activity and cost-category structure; it was not edited or recalculated.

Primary references: Direct Implementation Modality; Combined Delivery Report; MPTF Operating Guidelines; Financial Closure Operational Guidelines (11 November 2025); GEF Project Preparation Grant Total Budget Work Plan; PBF Project Budget Annex D (2024); Health Implementation Manual financial management section; CPD template/guidance; Programme QA Assessment (2026); Implement Monitor; Provide Oversight; GEF amendments guidance; and the Lessons Learned Log.

Supporting references reviewed: Pipeline Management; sector budget support/pooled funding; escalated vertical-fund management actions; One Programme tools (2014); programme cycle, annual planning and oversight visual guides; Program Budgets for Activity; and UN Project Budget Template. Generic examples are useful for layout but do not establish this programme's amounts or universal UN rules. In particular, do not apply a blanket 7% indirect-cost rule to every fund from the generic template.

Two duplicate files were identified (Combined Delivery Report and the 2018 oversight PDF). The `.pdf.crdownload` evaluation file is incomplete and was excluded. The public [UNDP financial resources management index](https://popp.undp.org/financial-resources-management) was inspected, but the automated page reader exposed navigation rather than the substantive policy text; detailed conclusions above rely on the supplied policy documents. Validate the applicable current donor rules before production use. The older Atlas references must not be treated as the current integration specification for Quantum.
