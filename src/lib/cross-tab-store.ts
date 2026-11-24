// Browser-local stores are synchronous. Refresh before an action reads state so
// an older tab cannot write its stale whole-store snapshot over newer evidence.
// This is not a shared-server transaction or cross-device collaboration system.
export function syncBrowserStore(store: any, key: string) {
  // Server rendering has no localStorage, so Zustand may omit persist entirely.
  if (typeof window === "undefined" || !store.persist) return;
  const actions = Object.fromEntries(Object.entries(store.getState()).filter(([, value]) => typeof value === "function").map(([name, action]) => [name, (...args: unknown[]) => {
    // Zustand's synchronous localStorage hydration completes synchronously.
    // If storage is unavailable, fail closed rather than overwrite blindly.
    if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
      localStorage.getItem(key);
      store.persist.rehydrate();
    }
    return (action as (...values: unknown[]) => unknown)(...args);
  }]));
  // Keep action wrapping from writing an old snapshot on module load.
  const storage = store.persist.getOptions().storage;
  store.persist.setOptions({ storage: undefined });
  store.setState(actions);
  store.persist.setOptions({ storage });
  if (typeof window !== "undefined" && window.addEventListener) {
    window.addEventListener("storage", (event: StorageEvent) => {
      if (event.key === key || event.key === null) store.persist.rehydrate();
    });
  }
}
