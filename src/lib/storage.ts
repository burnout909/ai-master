import { EMPTY_STORE, type Store } from "./types";

export const STORE_KEY = "ai_master:v1";

export function loadStore(): Store {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return EMPTY_STORE;
    const parsed = JSON.parse(raw);
    if (parsed?.version !== 1) return EMPTY_STORE;
    return parsed as Store;
  } catch {
    return EMPTY_STORE;
  }
}

export function saveStore(store: Store): void {
  localStorage.setItem(STORE_KEY, JSON.stringify(store));
}

export function resetStore(): void {
  localStorage.removeItem(STORE_KEY);
}

export function updateStore(fn: (s: Store) => Store): Store {
  const next = fn(loadStore());
  saveStore(next);
  return next;
}
