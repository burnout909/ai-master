import { useState } from "react";

type Strategy = "BFS" | "DFS" | "best-first";

interface Node {
  id: string;
  label: string;
  score: number;
  x: number;
  y: number;
  parentId: string | null;
}

const NODES: Node[] = [
  { id: "root", label: "root",  score: 0.0, x: 240, y: 30,  parentId: null   },
  { id: "A1",   label: "A1",    score: 0.7, x: 80,  y: 110, parentId: "root" },
  { id: "A2",   label: "A2",    score: 0.4, x: 240, y: 110, parentId: "root" },
  { id: "A3",   label: "A3",    score: 0.1, x: 400, y: 110, parentId: "root" },
  { id: "B1",   label: "B1",    score: 0.9, x: 20,  y: 200, parentId: "A1"   },
  { id: "B2",   label: "B2",    score: 0.5, x: 120, y: 200, parentId: "A1"   },
  { id: "B3",   label: "B3",    score: 0.2, x: 200, y: 200, parentId: "A2"   },
  { id: "B4",   label: "B4",    score: 0.8, x: 280, y: 200, parentId: "A2"   },
  { id: "B5",   label: "B5",    score: 0.3, x: 360, y: 200, parentId: "A3"   },
  { id: "B6",   label: "B6",    score: 0.2, x: 440, y: 200, parentId: "A3"   },
];

const ORDER: Record<Strategy, string[]> = {
  BFS:         ["root","A1","A2","A3","B1","B2","B3","B4","B5","B6"],
  DFS:         ["root","A1","B1","B2","A2","B3","B4","A3","B5","B6"],
  "best-first":["root","A1","B1","A2","B4","B2","A3","B5","B3","B6"],
};

const MAX_STEP = 9; // 0..9 => 10 positions

export function TotTree() {
  const [strategy, setStrategy] = useState<Strategy>("BFS");
  const [step, setStep]         = useState(0);

  const expanded = new Set(ORDER[strategy].slice(0, step + 1));

  const expandedScores = NODES
    .filter((n) => expanded.has(n.id))
    .map((n) => n.score);
  const bestSeen = expandedScores.length > 0 ? Math.max(...expandedScores) : 0;

  const nodeById = Object.fromEntries(NODES.map((n) => [n.id, n]));

  return (
    <div className="my-4 p-4 border rounded-lg">
      {/* Controls */}
      <div className="mb-3 flex flex-wrap gap-4 items-center text-sm">
        <label className="flex items-center gap-1">
          Strategy:
          <select
            aria-label="strategy"
            value={strategy}
            onChange={(e) => {
              setStrategy(e.target.value as Strategy);
              setStep(0);
            }}
            className="ml-1 border rounded px-1 py-0.5"
          >
            <option value="BFS">BFS</option>
            <option value="DFS">DFS</option>
            <option value="best-first">best-first</option>
          </select>
        </label>

        <label className="flex items-center gap-1">
          Step: {step}
          <input
            type="range"
            aria-label="step"
            min={0}
            max={MAX_STEP}
            value={step}
            onChange={(e) => setStep(Number(e.target.value))}
            className="ml-1 w-40"
          />
        </label>
      </div>

      {/* SVG Tree */}
      <svg viewBox="0 0 480 250" width="100%" height="240">
        {/* Edges */}
        {NODES.filter((n) => n.parentId !== null).map((n) => {
          const parent = nodeById[n.parentId!];
          return (
            <line
              key={`edge-${n.id}`}
              x1={parent.x}
              y1={parent.y}
              x2={n.x}
              y2={n.y}
              stroke="#d1d5db"
              strokeWidth={1.5}
            />
          );
        })}

        {/* Nodes */}
        {NODES.map((n) => {
          const isExpanded = expanded.has(n.id);
          const fill = isExpanded ? "#3b82f6" : "#9ca3af";
          const textColor = isExpanded ? "#fff" : "#fff";
          return (
            <g key={n.id}>
              <circle cx={n.x} cy={n.y} r={22} fill={fill} />
              <text
                x={n.x}
                y={n.y - 5}
                textAnchor="middle"
                fontSize={9}
                fill={textColor}
                fontWeight="bold"
              >
                {n.label}
              </text>
              <text
                x={n.x}
                y={n.y + 7}
                textAnchor="middle"
                fontSize={9}
                fill={textColor}
              >
                {n.score.toFixed(1)}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Stats */}
      <p className="mt-2 text-sm text-neutral-700">
        Best seen so far:{" "}
        <span className="font-semibold text-blue-600">{bestSeen.toFixed(1)}</span>
      </p>
    </div>
  );
}
