import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useDemoStore } from "./demo-store";
import { logWorkflowEvent } from "@/lib/demo-workflow-event";
export const useTodo = create<{done:Record<string,boolean>;toggle:(id:string,done:boolean)=>void;reset:()=>void}>()(persist(set=>({
  done:{},
  toggle:(id,done)=>{
    if(useDemoStore.getState().role!=="program"||!id.trim())return;
    set(s=>({done:{...s.done,[id]:done}}));
    logWorkflowEvent("DOCUMENT_FOLLOWUP_UPDATED",`${id}: follow-up ${done?"checked off":"reopened"}; not evidence verification.`,"/dashboard");
  },
  reset:()=>set({done:{}}),
}),{name:"maptoc-document-followups-v1"}));
