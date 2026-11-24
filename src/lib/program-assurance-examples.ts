import { allEvidence,fingerprint,type EvidenceSource,type AssuranceState } from "./assurance";
import {
  anchorFor,
  configuredControl,
  DEFAULT_PROGRAM_ID,
  type ProgramConfiguration,
  type ProgramRule,
} from "./program-assurance";

export const programExamples = [
  { id: "health", label: "Maternal health · USD" },
  { id: "education", label: "School meals · EUR" },
  { id: "wash", label: "Rural water · XOF" },
  { id: "climate", label: "Climate resilience · USD" },
  { id: "advocacy", label: "Community advocacy · no spending" },
];
export function createProgramExample(
  kind: string,
  id: string,
): { program: ProgramConfiguration; sources: EvidenceSource[] } {
  const entries: Record<
    string,
    [string, string, string, string, string, string, string, string]
  > = {
    health: [
      "MOH Maternal Delivery",
      "Cambodia",
      "Maternal health",
      "Illustrative health donor",
      "USD",
      "30000",
      "42000",
      "10",
    ],
    education: [
      "School Meals Partnership",
      "Lebanon",
      "School nutrition",
      "Illustrative education fund",
      "EUR",
      "180000",
      "195000",
      "15",
    ],
    wash: [
      "Community Water Access",
      "Senegal",
      "Water and sanitation",
      "Illustrative community water fund",
      "XOF",
      "100000000",
      "125000000",
      "20",
    ],
    climate: [
      "Coastal Resilience",
      "Maldives",
      "Climate adaptation",
      "Illustrative climate donor",
      "USD",
      "5000000",
      "5350000",
      "5",
    ],
    advocacy: [
      "Youth Civic Coalition",
      "Tunisia",
      "Community advocacy",
      "Illustrative civil-society fund",
      "EUR",
      "0",
      "0",
      "0",
    ],
  };
  const x = entries[kind] || entries.health,
    [name, country, theme, donor, currency, base, actual, threshold] = x,
    line =
      kind === "health"
        ? "Outreach transport"
        : kind === "education"
          ? "School meal delivery"
          : kind === "wash"
            ? "Water point rehabilitation"
            : kind === "climate"
              ? "Coastal restoration"
              : "Community participation";
  const periodStart = "2026-08-01",
    periodEnd = "2026-08-31",
    precision = currency === "XOF" ? 0 : 2;
  const source = (
    suffix: string,
    title: string,
    text: string,
  ): EvidenceSource => ({
    id: `${id}-${suffix}`,
    programId: id,
    title,
    version: 1,
    sourceDate: "2026-08-31",
    passages: [
      { id: `${suffix}-p1`, locator: "Illustrative original passage", text },
    ],
  });
  const governing = source(
    "requirements",
    "Illustrative donor requirements",
    `${name}: reporting period ${periodStart} to ${periodEnd}. ${line} spending ${kind === "advocacy" ? "is not planned." : `more than ${threshold}% above the original allocation requires written donor approval covering the revised amount.`} Link the delivery report and reconcile ledger entries in the same currency, period and activity line. A donor report is due on 2026-10-01.`,
  );
  const plan = source(
      "budget",
      "Approved activity allocation",
      `Approved ${line} allocation for ${periodStart} to ${periodEnd}: ${currency} ${base}.`,
    ),
    expense = source(
      "spending",
      "Activity expenditure summary",
      `Reported ${line} expenditure for ${periodStart} to ${periodEnd}: ${currency} ${actual}.`,
    );
  const resultValue =
      kind === "health"
        ? "1240"
        : kind === "education"
          ? "2400"
          : kind === "wash"
            ? "12"
            : kind === "climate"
              ? "85"
              : "16",
    unit =
      kind === "health"
        ? "women reached"
        : kind === "education"
          ? "pupils receiving meals"
          : kind === "wash"
            ? "water points completed"
            : kind === "climate"
              ? "hectares restored"
              : "community meetings held";
  const report = source(
    "delivery",
    "Activity delivery report",
    `For ${periodStart} to ${periodEnd}, ${name} reported ${resultValue} ${unit}. Follow-up is needed before concluding that outcomes improved.`,
  );
  const sources = [governing, plan, expense, report];
  const data = [
    {
      id: "allocation",
      label: "Approved allocation",
      value: base,
      anchor: anchorFor(plan),
    },
    {
      id: "spend",
      label: "Reported spending",
      value: actual,
      anchor: anchorFor(expense),
    },
    {
      id: "approval",
      label: "Revised amount approval",
      value: actual,
      approvalStatus: "pending" as const,
      authorizedBy: "",
    },
    {
      id: "delivery",
      label: "Reported delivery",
      value: resultValue,
      unit,
      anchor: anchorFor(report),
    },
  ].map((d) => ({
    ...d,
    currency,
    line,
    periodStart,
    periodEnd,
    reviewedBy: d.anchor ? "Prepared example" : undefined,
  }));
  const make = (
    ruleId: string,
    title: string,
    method: ProgramRule["method"],
    inputIds: string[],
    why: string,
  ): ProgramRule => ({
    id: ruleId,
    title,
    method,
    inputIds,
    why,
    requirement: governing.passages[0].text,
    clause: anchorFor(governing),
    owner: "Assurance reviewer",
    line,
    sourceIds: [],
  });
  const rules: ProgramRule[] = [
    ...(kind !== "advocacy"
      ? [
          {
            ...make(
              "approval-check",
              `Review ${line.toLowerCase()} approval`,
              "budget-approval",
              ["allocation", "spend", "approval"],
              "Apply this donor’s spending-approval requirement.",
            ),
            thresholdPercent: threshold,
            approvalMode: "ceiling" as const,
          },
          make(
            "ledger-check",
            "Review the ledger difference",
            "ledger-reconciliation",
            ["spend"],
            "Account for the spending total using reviewed transactions.",
          ),
        ]
      : []),
    {
      ...make(
        "delivery-check",
        "Review the reported delivery",
        "reported-result",
        ["delivery"],
        "Keep delivery figures linked to their original record.",
      ),
      target: undefined,
    },
    {
      ...make(
        "documents-check",
        "Upload the delivery report",
        "required-document",
        [],
        "Keep the donor update traceable to the original report.",
      ),
      sourceIds: [report.id],
    },
  ];
  const followups = [
    {
      id: "delivery-upload",
      title: `Upload ${theme.toLowerCase()} follow-up report`,
      request: `Add the follow-up report for ${unit}, including dates and the group covered. A typed update can be used if no report exists.`,
      why: "Record the follow-up beyond delivery totals.",
      owner: "Field coordinator",
      due: "2026-09-30",
    },
    {
      id: "donor-upload",
      title: "Upload the October donor report",
      request: `Add the October 2026 donor report and supporting ${line.toLowerCase()} records.`,
      why: "Meet the donor reporting requirement.",
      owner: "Reporting lead",
      due: "2026-10-01",
    },
    {
      id: "extension",
      title: "Request a no-cost extension from the donor",
      request:
        "Add the proposed end date, outstanding activities and a draft donor request. Record donor approval separately.",
      why: "Continue outstanding work within an approved timeframe.",
      owner: "Program manager",
      due: "2026-10-20",
    },
  ];
  return {
    sources,
    program: {
      id,
      name,
      country,
      theme,
      donor,
      currency,
      decimals: precision,
      objective: `Track ${theme.toLowerCase()} delivery, spending and the evidence needed to review results.`,
      start: "2026-07-01",
      end: "2027-06-30",
      periodStart,
      periodEnd,
      rules,
      data,
      followups,
      activities: [
        {id:"program-planning",title:"Agree program plan & donor requirements",start:"2026-07-01",due:"2026-07-31",required:[governing.id,plan.id]},
        {id:"delivery-period",title:line,start:"2026-08-01",due:"2027-04-30",required:[report.id]},
        {id:"delivery-followup",title:`${theme} follow-up`,start:"2026-09-01",due:"2026-09-30",required:["delivery-upload"]},
        {id:"donor-reporting",title:"October donor report",start:"2026-09-01",due:"2026-10-01",required:["donor-upload"]},
        {id:"outcome-reporting",title:"Outcome & final reporting",start:"2027-05-01",due:"2027-06-30",required:["delivery-upload","donor-upload"]},
      ],
      sample: true,
    },
  };
}
export function defaultProgram(
  sources: EvidenceSource[],
): ProgramConfiguration {
  const { program } = createProgramExample("health", DEFAULT_PROGRAM_ID);
  const source = (id: string) => sources.find((s) => s.id === id),
    governing = source("assurance-grant-v1"),
    report = source("field-report-v1"),
    plan = source("assurance-budget-v1"),
    expense = source("finance-v1");
  program.name = "2026 MOH Maternal Delivery";
  program.rules = [
    {
      ...program.rules[0],
      id: "transport-approval",
      title: "Review transport approval",
      requirement: governing?.passages[0].text || program.rules[0].requirement,
      clause: governing ? anchorFor(governing) : undefined,
      approvalMode: "exact",
    },
    {
      ...program.rules[1],
      id: "ledger-reconcile",
      clause: governing
        ? anchorFor(governing, governing.passages[1]?.id)
        : undefined,
      requirement: governing?.passages[1]?.text || program.rules[1].requirement,
    },
    {
      ...program.rules[2],
      id: "reach-support",
      title: "Review the reported reach",
      clause: governing
        ? anchorFor(governing, governing.passages[1]?.id)
        : undefined,
      requirement: governing?.passages[1]?.text || program.rules[2].requirement,
    },
    {
      ...program.rules[3],
      id: "delivery-report",
      sourceIds: report ? [report.id] : [],
      clause: governing
        ? anchorFor(governing, governing.passages[1]?.id)
        : undefined,
      requirement: governing?.passages[1]?.text || program.rules[3].requirement,
    },
  ];
  program.data = program.data.map((d) => ({
    ...d,
    anchor:
      d.id === "allocation" && plan
        ? anchorFor(plan)
        : d.id === "spend" && expense
          ? anchorFor(expense)
          : d.id === "delivery" && report
            ? anchorFor(report)
            : undefined,
    reviewedBy: d.id !== "approval" ? "Prepared example" : undefined,
  }));
  program.followups = [
    {
      id: "attendance",
      title: "Upload September workshop attendance",
      request:
        "Upload the September 2026 Saturday health-worker workshop attendance register, with session dates and participant totals.",
      why: "Keep the workshop delivery record complete.",
      owner: "M&E lead",
      due: "2026-09-22",
    },
    {
      id: "referrals",
      title: "Upload the 30-day referral follow-up report",
      request:
        "Upload the 30-day care follow-up report for August outreach referrals in Districts 2 and 4, or type the follow-up dates, completion totals and barriers.",
      why: "Record whether referred women received care.",
      owner: "Field coordinator",
      due: "2026-09-30",
    },
    {
      id: "donor-support",
      title: "Upload the October donor report",
      request:
        "Upload the October 2026 donor report, due 1 October, with delivery and expenditure records.",
      why: "Meet the donor reporting deadline.",
      owner: "Reporting lead",
      due: "2026-10-01",
    },
    {
      id: "cost-followup",
      title: "Update the extra 12,000 in travel costs",
      request:
        "Add the transport cost breakdown, invoices and revised amount approval for the additional USD 12,000.",
      why: "Keep the cost change and its approval traceable.",
      owner: "Finance focal point",
      due: "2026-10-15",
    },
    {
      id: "extension",
      title: "Request a no-cost extension from the donor",
      request:
        "Add outstanding activities, the proposed end date and a draft request. Record donor approval separately.",
      why: "Allow time for outstanding follow-up and reporting.",
      owner: "Program manager",
      due: "2026-10-20",
    },
  ];
  program.activities = [
    {
      id: "irb-submission",
      title: "IRB submission",
      start: "2026-07-01",
      due: "2026-07-14",
      completedAt: "2026-07-14",
      required: ["protocol", "consent", "irb"],
    },
    {
      id: "package-procurement",
      title: "Procure prenatal packages",
      start: "2026-07-15",
      due: "2026-07-31",
      completedAt: "2026-07-31",
      required: ["procurement", "stock-receipt"],
      dependsOn: "irb-submission",
    },
    {
      id: "midwife-training",
      title: "Health-worker training",
      start: "2026-08-01",
      due: "2026-08-07",
      completedAt: "2026-08-07",
      required: ["training-register"],
      dependsOn: "irb-submission",
    },
    {
      id: "package-distribution",
      title: "August outreach and package delivery",
      start: "2026-08-08",
      due: "2026-08-31",
      completedAt: "2026-08-31",
      required: ["reach", "distribution"],
      dependsOn: "irb-submission",
    },
    {
      id: "delivery",
      title: "Delivery evidence closeout",
      start: "2026-09-01",
      due: "2026-09-15",
      required: ["reach"],
      dependsOn: "irb-submission",
    },
    {
      id: "recipient-followup",
      title: "30-day care follow-up",
      start: "2026-09-01",
      due: "2026-09-30",
      required: ["referrals"],
      dependsOn: "irb-submission",
    },
    {
      id: "me-check",
      title: "Attendance and M&E review",
      start: "2026-09-16",
      due: "2026-09-22",
      required: ["attendance"],
      dependsOn: "irb-submission",
    },
    {
      id: "donor-call",
      title: "Donor calls · every 2 months",
      start: "2026-09-25",
      due: "2026-09-30",
      required: ["finance"],
      recurrenceMonths: 2,
      dependsOn: "irb-submission",
    },
    {
      id: "donor-report",
      title: "October donor report",
      start: "2026-10-01",
      due: "2026-10-01",
      required: ["donor-support"],
      dependsOn: "irb-submission",
    },
    {
      id: "ongoing-outreach",
      title: "Ongoing outreach & referral follow-up",
      start: "2026-10-01",
      due: "2027-04-30",
      required: ["distribution", "referrals"],
      dependsOn: "irb-submission",
    },
    {
      id: "biannual",
      title: "Outcome and final reporting",
      start: "2027-05-01",
      due: "2027-06-30",
      required: ["baseline", "methods", "referrals"],
      dependsOn: "irb-submission",
    },
  ];
  return program;
}

// Upgrade only the untouched synthetic schedule. Never replace edited dates or
// real-program plans when refreshing the demo's illustrative timeline.
export function refreshDemoSchedule(program: ProgramConfiguration): ProgramConfiguration {
  if(program.id!=="cambodia-demo"||!program.sample||program.end!=="2027-06-30")return program;
  const final=program.activities.find(a=>a.id==="biannual");
  if(!final||final.start!=="2027-01-01"||final.due!=="2027-06-30")return program;
  const activities=program.activities.map(a=>a.id==="biannual"?{...a,start:"2027-05-01"}:a);
  if(!activities.some(a=>a.id==="ongoing-outreach"))activities.splice(activities.length-1,0,{id:"ongoing-outreach",title:"Ongoing outreach & referral follow-up",start:"2026-10-01",due:"2027-04-30",required:["distribution","referrals"],dependsOn:"irb-submission"});
  return {...program,activities};
}
export function initializeProgram(
  program: ProgramConfiguration,
  sources: EvidenceSource[],
): AssuranceState {
  return {
    program,
    addedSources: sources,
    controls: program.rules.map((r) => configuredControl(r, program.id)),
    runs: [],
    findings: [],
    audit: [],
  };
}

export function seedProgramExamples(state:AssuranceState,sources:EvidenceSource[]):AssuranceState {
  if(!state.program?.sample)return state;
  const program=state.program;
  const source=allEvidence(state,sources).find(s=>!s.id.startsWith("configured-inputs:")&&(s.id==="field-report-v1"||s.id.endsWith("-delivery")));
  if(!source)return state;
  const activityId=state.program.activities.find(a=>a.id===(state.program!.id===DEFAULT_PROGRAM_ID?"package-distribution":"delivery-period"))?.id;
  // Only prepared examples receive this explicit source-to-activity link.
  // Do not change user dates, requests, decisions or a link they already set.
  const findings=state.findings.map(f=>(f.id==="example-review"||f.id==="example-decision")&&!f.activityId&&f.basis==="Prepared illustrative example. This is not a live reviewer decision."&&f.sourceIds?.includes(source.id)&&activityId?{...f,activityId}:f);
  if(findings.some((f,i)=>f!==state.findings[i]))state={...state,findings};
  const cases=[{id:"example-review",title:"Example: review a delivery update",status:"evidence submitted" as const,response:"A delivery update is linked. Review the passage and record any follow-up."},{id:"example-decision",title:"Example: delivery source reviewed",status:"closed" as const,response:"The delivery statement is present in the source. Outcomes still need follow-up."}];
  const pending=cases.filter(c=>!state.findings.some(f=>f.id===c.id));if(!pending.length)return state;
  const time=program.periodEnd+"T12:00:00Z",fp=fingerprint([source]);
  return {...state,findings:[...state.findings,...pending.map(c=>({id:c.id,activityId,title:c.title,controlId:"",firstRunId:"",latestRunId:"",kind:"evidence-gap" as const,question:"Review the linked delivery passage.",basis:"Prepared illustrative example. This is not a live reviewer decision.",scope:state.program!.name,status:c.status,owner:"",due:"",request:"Review the source statement and note its limits.",requestOpen:c.status!=="closed",response:c.response,sourceIds:[source.id],receiptFingerprint:fp,resolutionFingerprint:c.status==="closed"?fp:undefined,rounds:[{id:c.id+"-round",time,actor:"Illustrative program staff",request:"Review the delivery source.",response:c.response,sources:[JSON.parse(JSON.stringify(source))],review:c.status==="closed"?{time,actor:"Illustrative reviewer",result:"resolved" as const,reason:"The source supports the stated delivery figure; no outcome conclusion was made."}:undefined}],decisions:c.status==="closed"?[{time,actor:"Illustrative reviewer",action:"Example decision",reason:"The source supports the delivery statement; outcome follow-up remains open."}]:[]}))]};
}
