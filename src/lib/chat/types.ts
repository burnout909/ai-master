export type ChatMode = "paper" | "roadmap" | "progress" | "review";
export type PedagogyMode = "socratic" | "direct";
export type StageId = "intuition" | "math" | "pseudo" | "code";

export type Message = {
  role: "user" | "assistant";
  content: string;
  ts: string;
};

export type Session = {
  id: string;
  title: string;
  startedAt: string;
  lastActiveAt: string;
  pedagogyMode: PedagogyMode;
  messages: Message[];
};

export type ChatStore = {
  sessions: Session[];
  activeId: string | null;
};

export type ProgressSnapshot = {
  completed: string[];
  inProgress: { slug: string; stage: StageId }[];
  lastVisited?: string;
};

export type ChatRequest = {
  mode: ChatMode;
  paperSlug?: string;
  currentStage?: StageId;
  progressSnapshot?: ProgressSnapshot;
  messages: Pick<Message, "role" | "content">[];
  pedagogyMode: PedagogyMode;
};
