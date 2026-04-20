import { useRef } from "react";
import { loadStore, saveStore } from "../../lib/storage";

export function ExportImport() {
  const inputRef = useRef<HTMLInputElement>(null);

  function onExport() {
    const blob = new Blob([JSON.stringify(loadStore(), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ai_master-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function onImport(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (parsed?.version !== 1) {
          alert("Unsupported version.");
          return;
        }
        saveStore(parsed);
        alert("Imported — refresh to see changes.");
      } catch {
        alert("Invalid file.");
      }
    };
    reader.readAsText(f);
  }

  return (
    <div className="flex gap-2 my-4">
      <button className="px-3 py-1 border rounded" onClick={onExport}>Export JSON</button>
      <button className="px-3 py-1 border rounded" onClick={() => inputRef.current?.click()}>Import JSON</button>
      <input type="file" ref={inputRef} accept=".json" hidden onChange={onImport} />
    </div>
  );
}
