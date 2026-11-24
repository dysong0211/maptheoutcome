"use client";
import { useState } from "react";
import { UserPlus, Check } from "lucide-react";
import { usePersonnel } from "@/stores/personnel-store";
import { useDemoStore } from "@/stores/demo-store";
import { useAssurance } from "@/stores/assurance-store";

export function AssignPersonnel({ id, suggestedRole,inline=false }: { id: string; suggestedRole?: string;inline?:boolean }) {
  const legacyOwner = usePersonnel(s => s.owners[id] || "");
  const finding=useAssurance(s=>s.workspace.findings.find(f=>f.id===id));
  const dispatch=useAssurance(s=>s.dispatch);
  const owner=finding?finding.owner:legacyOwner;
  const assign = usePersonnel(s => s.assign);
  const role = useDemoStore(s => s.role);
  const canAssign=finding ? role==="reviewer" || (role==="program" && !!finding.kind) : role==="program";
  const [draft, setDraft] = useState(owner);
  const [saved, setSaved] = useState(false);
  const [error,setError]=useState("");
  return <form className={`personnel-form ${inline?"inline-owner":""}`} onSubmit={e => { e.preventDefault(); try { if(finding){dispatch({type:"case-owner",id,owner:draft});setSaved(true);}else setSaved(assign(id,draft));setError(""); }catch(e){setError(e instanceof Error?e.message:"Assignment failed.");} }}>
    <label htmlFor={`owner-${id}`}><UserPlus size={17}/> Upload owner</label>
    <div><input id={`owner-${id}`} value={draft} maxLength={80} onChange={e => { setDraft(e.target.value); setSaved(false); }} placeholder={suggestedRole ? `Name or role, e.g. ${suggestedRole}` : "Enter personnel name or role"} disabled={!canAssign}/><button disabled={!canAssign} type="submit">{saved ? <><Check size={15}/> Saved</> : "Assign"}</button></div>
    {!inline&&<small>{!canAssign ? finding&&!finding.kind?"Choose Assurance Reviewer to assign this issue.":"Choose Program Manager or Assurance Reviewer to assign an owner." : "Saved in this browser only · no invitation or notification sent."}</small>}
    {saved && <span role="status">{owner ? `Assigned to ${owner}` : "Assignment cleared"}</span>}
    {error && <span role="alert">{error}</span>}
  </form>;
}
