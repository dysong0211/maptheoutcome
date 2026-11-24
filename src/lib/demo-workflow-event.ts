import { useMemoryStore } from "@/stores/program-memory-store";
import { useDemoStore } from "@/stores/demo-store";

export function logWorkflowEvent(action: string, detail: string, href: string) {
  useMemoryStore.setState(state => ({ events: [{ id: crypto.randomUUID(), action, detail, href, actor: `Demo ${useDemoStore.getState().role}`, occurredAt: new Date().toISOString() }, ...state.events] }));
}
