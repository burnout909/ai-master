import React, { useEffect, useState } from "react";
import ChatPanel from "./ChatPanel";
import { computeSnapshot } from "../../lib/chat/progressSnapshot";
import type { ChatMode, ProgressSnapshot } from "../../lib/chat/types";

type Props = { mode: ChatMode; storageKey: string; paperSlug?: string };

export default function ChatPanelWithSnapshot(props: Props) {
  const [snap, setSnap] = useState<ProgressSnapshot>({ completed: [], inProgress: [] });
  useEffect(() => { setSnap(computeSnapshot()); }, []);
  return <ChatPanel {...props} progressSnapshot={snap} />;
}
