import { loadPyodide, type PyodideInterface } from "pyodide";

let pyodide: PyodideInterface | null = null;

async function ensurePyodide() {
  if (pyodide) return pyodide;
  pyodide = await loadPyodide({
    indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.2/full/",
  });
  return pyodide;
}

self.addEventListener("message", async (e: MessageEvent<{ id: string; code: string }>) => {
  const { id, code } = e.data;
  const py = await ensurePyodide();
  const out: string[] = [];
  const err: string[] = [];
  py.setStdout({ batched: (s) => out.push(s) });
  py.setStderr({ batched: (s) => err.push(s) });
  try {
    const result = await py.runPythonAsync(code);
    self.postMessage({ id, ok: true, stdout: out.join(""), stderr: err.join(""), result: String(result ?? "") });
  } catch (ex) {
    self.postMessage({ id, ok: false, stdout: out.join(""), stderr: String(ex) });
  }
});

export {};
