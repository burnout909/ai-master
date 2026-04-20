import Editor from "@monaco-editor/react";
import { useState } from "react";
import { runPython, type RunResult } from "../../lib/pyodide";

type Props = {
  initialCode: string;
  colabUrl?: string;
};

export function PyRunner({ initialCode, colabUrl }: Props) {
  const [code, setCode] = useState(initialCode);
  const [result, setResult] = useState<RunResult | null>(null);
  const [running, setRunning] = useState(false);

  async function run() {
    setRunning(true);
    try {
      const r = await runPython(code);
      setResult(r);
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="my-4 border rounded">
      <Editor
        height="260px"
        defaultLanguage="python"
        value={code}
        onChange={(v) => setCode(v ?? "")}
        options={{ fontSize: 13, minimap: { enabled: false } }}
      />
      <div className="flex gap-2 p-2 border-t bg-neutral-50">
        <button
          className="px-3 py-1 bg-blue-600 text-white rounded disabled:opacity-40"
          onClick={run}
          disabled={running}
        >
          {running ? "Running…" : "Run"}
        </button>
        {colabUrl && (
          <a
            className="px-3 py-1 border rounded"
            href={colabUrl}
            target="_blank"
            rel="noreferrer"
          >
            Open in Colab
          </a>
        )}
      </div>
      {result && (
        <pre
          className={`p-2 text-sm whitespace-pre-wrap ${
            result.ok ? "bg-green-50" : "bg-red-50"
          }`}
        >
{result.stdout}
{result.stderr && <span className="text-red-600">{result.stderr}</span>}
{result.ok && result.result ? `→ ${result.result}` : ""}
        </pre>
      )}
    </div>
  );
}
