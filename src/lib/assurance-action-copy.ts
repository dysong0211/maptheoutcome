import type { AttentionItem } from "./assurance-overview";

// Plain-language labels describe the question and the actual requested document.
const labels: Record<string,{title:string;document:string;scope:string}> = {
  attendance:{title:"Compare attendance before and after Saturday sessions",document:"Attendance registers for both periods",scope:"Women attending outreach · Districts 2 & 4"},
  referrals:{title:"Did referred women receive care?",document:"30-day referral follow-up",scope:"August outreach participants · Districts 2 & 4"},
  "donor-support":{title:"Prepare evidence for the October donor report",document:"Delivery reports, spending records and follow-up results",scope:"October donor update"},
  "cost-followup":{title:"Explain the extra $12,000 in transport costs",document:"Invoices, cost breakdown and revised approval",scope:"August transport · $30,000 plan → $42,000 spent"},
  "finding-transport-approval":{title:"Was the revised $42,000 transport amount approved?",document:"Written donor approval for the revised amount",scope:"August 2026 · outreach transport"},
};
export function actionCopy(item:AttentionItem) {
  const label=item.configured?undefined:labels[item.id];
  const stage=item.stage || (item.kind==="Missing evidence"?"collect":"review");
  return {stage,title:label?.title || item.title,scope:label?.scope || "Program evidence",
    instruction:stage==="recorded"?item.next:stage==="review"?item.id==="stale-checks"?"Documents changed since the last check.":"Check the documents and record your decision.":label?`Needed: ${label.document}`:item.next,
    button:stage==="recorded"?"View decision":stage==="review"?item.id==="stale-checks"?"Recheck":"Review evidence":"Add documents"};
}
