import { useState } from "react";

interface Skill {
  name: string;
  unlockEp: number;
}

const SKILLS: Skill[] = [
  { name: "mineWood", unlockEp: 1 },
  { name: "craftPickaxe", unlockEp: 2 },
  { name: "mineStone", unlockEp: 3 },
  { name: "craftFurnace", unlockEp: 4 },
  { name: "mineCoal", unlockEp: 5 },
  { name: "mineIron", unlockEp: 6 },
  { name: "smeltIron", unlockEp: 7 },
  { name: "craftIronSword", unlockEp: 8 },
];

// Dependency edges: [from index, to index]
const EDGES: [number, number][] = [
  [0, 1], // mineWood -> craftPickaxe
  [1, 2], // craftPickaxe -> mineStone
  [2, 3], // mineStone -> craftFurnace
  [2, 4], // mineStone -> mineCoal
  [2, 5], // mineStone -> mineIron
  [3, 6], // craftFurnace -> smeltIron
  [4, 6], // mineCoal -> smeltIron
  [5, 6], // mineIron -> smeltIron
  [6, 7], // smeltIron -> craftIronSword
];

const NODE_W = 120;
const NODE_H = 32;
const H_GAP = 40;
const V_GAP = 48;

// Assign x/y positions by topological layers
const LAYERS: number[][] = [
  [0],       // mineWood
  [1],       // craftPickaxe
  [2],       // mineStone
  [3, 4, 5], // craftFurnace, mineCoal, mineIron
  [6],       // smeltIron
  [7],       // craftIronSword
];

function buildPositions() {
  const pos: { x: number; y: number }[] = new Array(SKILLS.length);
  LAYERS.forEach((layer, li) => {
    const x = li * (NODE_W + H_GAP);
    layer.forEach((idx, vi) => {
      const totalH = layer.length * NODE_H + (layer.length - 1) * (V_GAP - NODE_H);
      const startY = -totalH / 2;
      pos[idx] = { x, y: startY + vi * (NODE_H + V_GAP - NODE_H) };
    });
  });
  return pos;
}

const POSITIONS = buildPositions();

const SVG_W = LAYERS.length * (NODE_W + H_GAP) - H_GAP + 20;
const SVG_H = 3 * NODE_H + 2 * (V_GAP - NODE_H) + 80;

export default function SkillLibrary() {
  const [episode, setEpisode] = useState(0);
  const [showDeps, setShowDeps] = useState(false);

  const unlockedCount = SKILLS.filter((s) => episode >= s.unlockEp).length;

  const centerY = SVG_H / 2;

  return (
    <div className="p-4 font-sans max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Voyager — Skill Library</h2>

      {/* Controls */}
      <div className="flex flex-col gap-3 mb-6">
        <div className="flex items-center gap-3">
          <label htmlFor="episode-slider" className="font-medium w-20">
            Episode
          </label>
          <input
            id="episode-slider"
            type="range"
            min={0}
            max={10}
            step={1}
            value={episode}
            aria-label="episode"
            onChange={(e) => setEpisode(Number(e.target.value))}
            className="w-48 accent-green-600"
          />
          <span className="tabular-nums w-6 text-center">{episode}</span>
        </div>

        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showDeps}
            onChange={(e) => setShowDeps(e.target.checked)}
            aria-label="Show dependencies"
          />
          <span>Show dependencies</span>
        </label>
      </div>

      {/* Library size */}
      <p className="mb-4 text-sm font-medium">
        library size ={" "}
        <span className="text-green-700 font-bold">{unlockedCount}</span>
      </p>

      {/* Skill list + optional SVG */}
      <div className="flex gap-6 items-start">
        {/* Skill list */}
        <ul className="space-y-1 min-w-[160px]">
          {SKILLS.map((skill) => {
            const unlocked = episode >= skill.unlockEp;
            return (
              <li
                key={skill.name}
                className={`flex items-center gap-2 text-sm ${
                  unlocked ? "text-green-700 font-semibold" : "text-gray-400"
                }`}
              >
                <span>{unlocked ? "✓" : "○"}</span>
                <span>{skill.name}</span>
                <span className="text-xs opacity-60">(ep {skill.unlockEp})</span>
              </li>
            );
          })}
        </ul>

        {/* Dependency SVG */}
        {showDeps && (
          <svg
            width={SVG_W}
            height={SVG_H}
            role="img"
            aria-label="skill dependency graph"
            className="border rounded bg-gray-50 overflow-visible"
          >
            <g transform={`translate(10, ${centerY})`}>
              {/* Draw edges first */}
              {EDGES.map(([from, to], i) => {
                const fp = POSITIONS[from];
                const tp = POSITIONS[to];
                const x1 = fp.x + NODE_W;
                const y1 = fp.y + NODE_H / 2;
                const x2 = tp.x;
                const y2 = tp.y + NODE_H / 2;
                const fromUnlocked = episode >= SKILLS[from].unlockEp;
                const toUnlocked = episode >= SKILLS[to].unlockEp;
                const active = fromUnlocked && toUnlocked;
                return (
                  <line
                    key={i}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={active ? "#16a34a" : "#d1d5db"}
                    strokeWidth={active ? 2 : 1}
                    markerEnd={`url(#arrow-${active ? "green" : "grey"})`}
                  />
                );
              })}

              {/* Arrow markers */}
              <defs>
                <marker
                  id="arrow-green"
                  markerWidth="6"
                  markerHeight="6"
                  refX="5"
                  refY="3"
                  orient="auto"
                >
                  <path d="M0,0 L0,6 L6,3 z" fill="#16a34a" />
                </marker>
                <marker
                  id="arrow-grey"
                  markerWidth="6"
                  markerHeight="6"
                  refX="5"
                  refY="3"
                  orient="auto"
                >
                  <path d="M0,0 L0,6 L6,3 z" fill="#d1d5db" />
                </marker>
              </defs>

              {/* Draw nodes */}
              {SKILLS.map((skill, i) => {
                const { x, y } = POSITIONS[i];
                const unlocked = episode >= skill.unlockEp;
                return (
                  <g key={skill.name}>
                    <rect
                      x={x}
                      y={y}
                      width={NODE_W}
                      height={NODE_H}
                      rx={6}
                      fill={unlocked ? "#dcfce7" : "#f3f4f6"}
                      stroke={unlocked ? "#16a34a" : "#d1d5db"}
                      strokeWidth={1.5}
                    />
                    <text
                      x={x + NODE_W / 2}
                      y={y + NODE_H / 2 + 4}
                      textAnchor="middle"
                      fontSize={10}
                      fill={unlocked ? "#15803d" : "#9ca3af"}
                    >
                      {skill.name}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>
        )}
      </div>
    </div>
  );
}
