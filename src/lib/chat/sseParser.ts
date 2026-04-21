export type SseEvent =
  | { delta: string }
  | { done: true }
  | { error: string };

export type SseParser = { push: (chunk: string) => void };

export function createSseParser(onEvent: (e: SseEvent) => void): SseParser {
  let buffer = "";

  function flushFrame(frame: string) {
    const line = frame.split("\n").find((l) => l.startsWith("data: "));
    if (!line) return;
    const payload = line.slice("data: ".length).trim();
    if (payload === "[DONE]") {
      onEvent({ done: true });
      return;
    }
    try {
      onEvent(JSON.parse(payload) as SseEvent);
    } catch {
      onEvent({ error: `unparseable SSE payload: ${payload}` });
    }
  }

  return {
    push(chunk: string) {
      buffer += chunk;
      let idx;
      while ((idx = buffer.indexOf("\n\n")) !== -1) {
        const frame = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);
        flushFrame(frame);
      }
    },
  };
}
