"use client";
import Link from "next/link";
const cell = "px-4 py-3";
function Table({
  headers,
  children,
}: {
  headers: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="memory-card overflow-x-auto">
      <table className="w-full min-w-[680px] text-left text-xs">
        <thead className="border-b bg-slate-50 text-[10px] text-slate-500">
          <tr>
            {headers.map((header) => (
              <th key={header} className={cell}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">{children}</tbody>
      </table>
    </div>
  );
}


export function FundingLedger(){return <section className="funding-ledger my-4"><h2 className="mb-3 text-xl font-semibold">Funding ledger</h2><p className="text-sm mb-3">Historical sample allocations · USD thousands. Transport is source-linked; other rows are illustrative.</p><div className="ledger-graph">{[["Transport",30,42],["Facility support",24,21],["Field staffing",20,18],["Supplies",16,11]].map(([name,budget,spend])=><div key={name}><strong>{name}</strong><div className="ledger-track" role="img" aria-label={`${name}: budget ${budget}k, spend ${spend}k`}><i style={{width:`${Number(spend)/42*100}%`,background:Number(spend)>Number(budget)?`linear-gradient(to right,#007f78 ${Number(budget)/Number(spend)*100}%,#b42323 ${Number(budget)/Number(spend)*100}%)`:"#007f78"}}/><b style={{left:`${Number(budget)/42*100}%`}}/></div><span>${spend}k / ${budget}k planned</span></div>)}</div><p className="text-xs my-3">Green: within plan · red: difference above plan · marker: planned amount</p><details><summary>View ledger details & evidence</summary>
        <>
          <div className="memory-card mb-4 p-4">
            <h2 className="text-sm font-semibold">
              Grant envelope → allocation → reported spending → delivery
              evidence
            </h2>
            <p className="mt-2 text-xs text-slate-500">
              $90k sample budget / $92k illustrative recorded spending. Only
              transport has a supporting expenditure source in this scenario.
              Other rows are scenario data, not verified accounts.
            </p>
          </div>
          <Table
            headers={[
              "Allocation",
              "Budget",
              "Reported spend",
              "Linked purpose / milestone",
              "Evidence status",
            ]}
          >
            {[
              {
                name: "Transport",
                budget: 30,
                actual: 42,
                purpose: "Reach outreach sites / sessions delivered",
                href: "/record?item=cost",
                status: "Expenditure source; milestone acceptance not recorded",
              },
              {
                name: "Facility support",
                budget: 24,
                actual: 21,
                purpose: "Facility readiness for maternal care",
                status: "Scenario only · invoice / acceptance needed",
              },
              {
                name: "Field staffing",
                budget: 20,
                actual: 18,
                purpose: "Outreach delivery and follow-up",
                status: "Scenario only · staffing report needed",
              },
              {
                name: "Supplies",
                budget: 16,
                actual: 11,
                purpose: "Prenatal package procurement",
                status: "Scenario only · stock / receipt evidence needed",
              },
            ].map((row) => (
              <tr key={row.name}>
                <th className={cell + " font-medium"}>{row.name}</th>
                <td className={cell}>${row.budget}k</td>
                <td className={cell}>${row.actual}k</td>
                <td className={cell}>{row.purpose}</td>
                <td className={cell}>
                  {row.href ? (
                    <Link className="text-[#356756]" href={row.href}>
                      {row.status} →
                    </Link>
                  ) : (
                    row.status
                  )}
                </td>
              </tr>
            ))}
          </Table>
          <div className="mt-3 flex flex-wrap gap-4 text-xs text-[#356756]">
            <Link href="/record?item=flood">Flooding → route change</Link>
            <Link href="/record?item=transport">Extra transport approval</Link>
            <Link href="/record?item=reach">Reported delivery</Link>
            <Link href="/program?view=funding#finance-evidence">Full financial analysis →</Link>
          </div>
          <p className="mt-3 text-[10px] text-slate-500">
            Linked evidence is not an independently verified milestone. No
            automatic grant release.
          </p>
        </></details></section>;}
