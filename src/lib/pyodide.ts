let worker: Worker | null = null;
let counter = 0;
const pending = new Map<string, (r: RunResult) => void>();

export type RunResult =
  | { ok: true; stdout: string; stderr: string; result: string }
  | { ok: false; stdout: string; stderr: string };

function ensureWorker(): Worker {
  if (worker) return worker;
  worker = new Worker(new URL("../workers/pyodide.worker.ts", import.meta.url), {
    type: "module",
  });
  worker.addEventListener("message", (e) => {
    const { id, ...rest } = e.data;
    pending.get(id)?.(rest);
    pending.delete(id);
  });
  return worker;
}

export function runPython(code: string): Promise<RunResult> {
  const w = ensureWorker();
  const id = `r${++counter}`;
  return new Promise((resolve) => {
    pending.set(id, resolve);
    w.postMessage({ id, code });
  });
}
