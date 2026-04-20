import { useState } from "react";
import { runPython } from "../../lib/pyodide";

type Props = {
  userCode: string;
  testCode: string;
};

export function AssertionTests({ userCode, testCode }: Props) {
  const [state, setState] = useState<"idle" | "pass" | "fail">("idle");
  const [detail, setDetail] = useState("");

  async function check() {
    const full = `${userCode}\n${testCode}`;
    const r = await runPython(full);
    if (r.ok) {
      setState("pass");
      setDetail("All assertions passed ✓");
    } else {
      setState("fail");
      setDetail(r.stderr);
    }
  }

  return (
    <div className="my-2">
      <button className="px-3 py-1 border rounded" onClick={check}>
        Run tests
      </button>
      {state !== "idle" && (
        <pre
          className={`mt-2 p-2 text-sm whitespace-pre-wrap ${
            state === "pass" ? "bg-green-50" : "bg-red-50"
          }`}
        >
          {detail}
        </pre>
      )}
    </div>
  );
}
