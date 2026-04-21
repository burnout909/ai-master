import type { ChatStore, Session, Message, PedagogyMode } from "./types";

type Listener = () => void;

export type Store = {
  getState: () => ChatStore;
  getActive: () => Session | null;
  startSession: (mode: PedagogyMode) => string;
  appendMessage: (m: Message) => void;
  replaceLastAssistant: (content: string) => void;
  setPedagogyMode: (mode: PedagogyMode) => void;
  setActive: (id: string) => void;
  rename: (id: string, title: string) => void;
  deleteSession: (id: string) => void;
  subscribe: (l: Listener) => () => void;
};

function truncateTitle(s: string): string {
  const t = s.trim().replace(/\s+/g, " ");
  return t.length > 14 ? t.slice(0, 12) + "…" : t;
}

export function createStore(key: string): Store {
  const listeners = new Set<Listener>();

  const load = (): ChatStore => {
    if (typeof localStorage === "undefined") return { sessions: [], activeId: null };
    const raw = localStorage.getItem(key);
    if (!raw) return { sessions: [], activeId: null };
    try { return JSON.parse(raw) as ChatStore; } catch { return { sessions: [], activeId: null }; }
  };

  let state: ChatStore = load();

  const persist = () => {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(key, JSON.stringify(state));
  };

  const commit = (next: ChatStore) => {
    state = next;
    persist();
    listeners.forEach((l) => l());
  };

  const byId = (id: string | null) => state.sessions.find((s) => s.id === id) ?? null;

  return {
    getState: () => state,
    getActive: () => byId(state.activeId),

    startSession(mode) {
      const id = new Date().toISOString() + "-" + Math.random().toString(36).slice(2, 6);
      const session: Session = {
        id, title: "새 대화", startedAt: id, lastActiveAt: id,
        pedagogyMode: mode, messages: [],
      };
      commit({ sessions: [session, ...state.sessions], activeId: id });
      return id;
    },

    appendMessage(m) {
      const active = byId(state.activeId);
      if (!active) return;
      const updated: Session = {
        ...active,
        lastActiveAt: m.ts,
        messages: [...active.messages, m],
      };
      if (m.role === "user" && active.title === "새 대화") {
        updated.title = truncateTitle(m.content);
      }
      commit({
        ...state,
        sessions: state.sessions.map((s) => s.id === active.id ? updated : s),
      });
    },

    replaceLastAssistant(content) {
      const active = byId(state.activeId);
      if (!active) return;
      const msgs = [...active.messages];
      for (let i = msgs.length - 1; i >= 0; i--) {
        if (msgs[i].role === "assistant") { msgs[i] = { ...msgs[i], content }; break; }
      }
      const updated: Session = { ...active, messages: msgs };
      commit({ ...state, sessions: state.sessions.map((s) => s.id === active.id ? updated : s) });
    },

    setPedagogyMode(mode) {
      const active = byId(state.activeId);
      if (!active) return;
      const updated: Session = { ...active, pedagogyMode: mode };
      commit({ ...state, sessions: state.sessions.map((s) => s.id === active.id ? updated : s) });
    },

    setActive(id) {
      if (!byId(id)) return;
      commit({ ...state, activeId: id });
    },

    rename(id, title) {
      const next = state.sessions.map((s) => s.id === id ? { ...s, title } : s);
      commit({ ...state, sessions: next });
    },

    deleteSession(id) {
      const next = state.sessions.filter((s) => s.id !== id);
      const activeId = state.activeId === id ? (next[0]?.id ?? null) : state.activeId;
      commit({ sessions: next, activeId });
    },

    subscribe(l) {
      listeners.add(l);
      return () => { listeners.delete(l); };
    },
  };
}
