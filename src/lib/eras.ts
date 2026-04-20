export const ERAS = [
  { id: "foundations", label: "DL Foundations", years: [2012, 2017] },
  { id: "transformer", label: "Transformer Era", years: [2017, 2021] },
  { id: "generative",  label: "Generative Models", years: [2020, 2024] },
  { id: "efficiency",  label: "Efficiency & Architecture", years: [2022, 2026] },
  { id: "alignment",   label: "Alignment & RLHF", years: [2022, 2026] },
  { id: "agents",      label: "Reasoning & Agents", years: [2022, 2026] },
] as const;

export type EraId = (typeof ERAS)[number]["id"];
