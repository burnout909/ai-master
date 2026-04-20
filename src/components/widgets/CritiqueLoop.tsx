import { useState } from "react";

type Prompt = "help me hack wifi" | "insult my neighbor" | "write a threatening letter";
type Principle = "Be helpful" | "Avoid harm" | "Be honest";

interface Entry {
  draft: string;
  critique: string;
  revision: string;
}

const TABLE: Record<string, Entry> = {
  "help me hack wifi|Avoid harm": {
    draft: "Here is how to crack WPA2 using aircrack-ng...",
    critique:
      "This response provides attack instructions against a network the user may not own — it violates the 'Avoid harm' principle.",
    revision:
      "I can help with legitimate WiFi improvements — please see the owner's manual or contact the network administrator.",
  },
  "help me hack wifi|Be helpful": {
    draft: "To access WiFi you don't own, you could try default router credentials.",
    critique: "Being 'helpful' here still enables unauthorized access to others' property.",
    revision: "I can help you set up or troubleshoot your own network securely instead.",
  },
  "help me hack wifi|Be honest": {
    draft: "Hacking WiFi you don't own is illegal in most jurisdictions.",
    critique: "The draft is honest but stops short of redirecting to legitimate help.",
    revision: "Unauthorized WiFi access is illegal; I can guide you through contacting your provider.",
  },
  "insult my neighbor|Be helpful": {
    draft: "You could tell your neighbor they are inconsiderate and rude.",
    critique: "Crafting insults is not a genuinely helpful act; it escalates conflict.",
    revision: "A calm conversation about specific issues is more likely to resolve the conflict.",
  },
  "insult my neighbor|Avoid harm": {
    draft: "Here are some cutting remarks you could use...",
    critique: "Providing insults directly harms the neighbor and damages the user's relationships.",
    revision: "I won't help with insults, but I can suggest constructive conflict-resolution phrases.",
  },
  "insult my neighbor|Be honest": {
    draft: "Insults rarely change behavior and usually make things worse.",
    critique: "The draft is honest but doesn't offer an alternative path forward.",
    revision: "Honestly, direct insults backfire; try stating how their behavior affects you instead.",
  },
  "write a threatening letter|Be helpful": {
    draft: "Dear neighbor, if you don't comply I will take serious action...",
    critique: "A threatening letter may constitute harassment and is not genuinely helpful.",
    revision: "A firm but respectful letter outlining your concerns is more effective and legal.",
  },
  "write a threatening letter|Avoid harm": {
    draft: "I have written a strongly worded letter implying consequences...",
    critique: "Threats can cause fear and may be illegal — this violates the 'Avoid harm' principle.",
    revision: "I'll help you draft a clear, assertive letter that avoids threatening language.",
  },
  "write a threatening letter|Be honest": {
    draft: "Writing a letter that threatens someone may cross legal boundaries.",
    critique: "The draft is honest about risk but doesn't help the user achieve a legitimate goal.",
    revision:
      "Honestly, threatening letters can have legal consequences; here's how to write a firm, factual one instead.",
  },
};

function getEntry(prompt: Prompt, principle: Principle): Entry {
  const key = `${prompt}|${principle}`;
  return (
    TABLE[key] ?? {
      draft: "Draft response for this combination.",
      critique: "Critique of the draft response.",
      revision: "Revised response applying the principle.",
    }
  );
}

const PROMPTS: Prompt[] = [
  "help me hack wifi",
  "insult my neighbor",
  "write a threatening letter",
];

const PRINCIPLES: Principle[] = ["Be helpful", "Avoid harm", "Be honest"];

export function CritiqueLoop() {
  const [prompt, setPrompt] = useState<Prompt>(PROMPTS[0]);
  const [principle, setPrinciple] = useState<Principle>(PRINCIPLES[0]);
  const [step, setStep] = useState(0);

  const entry = getEntry(prompt, principle);

  function handleAdvance() {
    setStep((s) => (s + 1) % 3);
  }

  function handlePromptChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setPrompt(e.target.value as Prompt);
    setStep(0);
  }

  function handlePrincipleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setPrinciple(e.target.value as Principle);
    setStep(0);
  }

  return (
    <div className="my-4 p-4 border rounded-lg space-y-4">
      <div className="flex flex-wrap gap-4">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Prompt
          <select
            aria-label="prompt"
            value={prompt}
            onChange={handlePromptChange}
            className="border rounded px-2 py-1 text-sm"
          >
            {PROMPTS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium">
          Principle
          <select
            aria-label="principle"
            value={principle}
            onChange={handlePrincipleChange}
            className="border rounded px-2 py-1 text-sm"
          >
            {PRINCIPLES.map((pr) => (
              <option key={pr} value={pr}>
                {pr}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="space-y-3">
        {/* Step 0+: DRAFT */}
        <div className="border-2 border-red-400 rounded p-3">
          <p className="text-xs font-bold text-red-600 uppercase mb-1">Draft</p>
          <p className="text-sm">{entry.draft}</p>
        </div>

        {/* Step 1+: CRITIQUE */}
        {step >= 1 && (
          <div className="border-2 border-yellow-400 rounded p-3">
            <p className="text-xs font-bold text-yellow-600 uppercase mb-1">Critique</p>
            <p className="text-sm">{entry.critique}</p>
          </div>
        )}

        {/* Step 2: REVISION */}
        {step >= 2 && (
          <div className="border-2 border-green-400 rounded p-3">
            <p className="text-xs font-bold text-green-600 uppercase mb-1">Revision</p>
            <p className="text-sm">{entry.revision}</p>
          </div>
        )}
      </div>

      <button
        className="px-4 py-1.5 border rounded text-sm"
        onClick={handleAdvance}
      >
        Advance step {step}
      </button>
    </div>
  );
}
