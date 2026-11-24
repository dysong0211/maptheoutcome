// Prepared synthetic-program request briefs. Not new AI findings or actual assignments.
export const followupContext: Record<string, { title: string; brief: string; collect: string[]; suggestedRole: string }> = {
  attendance: {
    title: "Attendance before vs after Saturday outreach",
    brief: "Compare maternal-outreach attendance in Districts 2 and 4 before and after the 26 August 2026 schedule decision. Use comparable reporting windows; the post-change period still needs to be agreed.",
    collect: ["Dated session registers, split by district and outreach schedule", "Session counts and unique-attendee definitions for both periods", "Comparison note explaining missing records and other changes"],
    suggestedRole: "M&E lead",
  },
  referrals: {
    title: "30-day care follow-up for outreach participants",
    brief: "For women reached by August maternal-health outreach in Districts 2 and 4, check whether referrals led to care within the planned 30-day follow-up. Report the sample and denominator; do not assume all 1,240 women were referred.",
    collect: ["De-identified referral completion summary and follow-up dates", "Aggregate care-access barriers and participant feedback", "Sample size, consent approach and data-quality limitations"],
    suggestedRole: "Field coordinator",
  },
  "donor-support": {
    title: "Evidence pack for the October donor report",
    brief: "Compile the delivery, spending and follow-up evidence for the donor progress report due 24 October 2026. Assign an upload coordinator; this does not mean that person authored or verified every document.",
    collect: ["August delivery report and expenditure summary", "Attendance comparison and referral follow-up", "Evidence index with reporting periods, document owners and review status"],
    suggestedRole: "Reporting lead",
  },
  "cost-followup": {
    title: "Explain the $12,000 transport-plan difference",
    brief: "Reconcile August outreach transport spending of $42,000 with the original $30,000 plan. Preserve the route-change explanation and confirm whether the revised amount was approved.",
    collect: ["Transport ledger, invoices and payment references", "Amount-specific approval and revised allocation", "Reconciliation note linking the route change to costs"],
    suggestedRole: "Finance focal point",
  },
};
