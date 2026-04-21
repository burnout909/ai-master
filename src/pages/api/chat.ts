import type { APIRoute } from "astro";
import fs from "node:fs/promises";
import path from "node:path";
import { GoogleGenAI } from "@google/genai";
import { parseMdxStages } from "../../lib/chat/mdxStages";
import { buildSystemPrompt } from "../../lib/chat/promptBuilder";
import { PAPERS_META } from "../../content/papers-meta";
import type { ChatRequest } from "../../lib/chat/types";

export const prerender = false;

const API_KEY = process.env.GOOGLE_AI_API_KEY;
const MODEL = process.env.GOOGLE_AI_MODEL ?? "gemini-3.1-pro-preview";

function sseFrame(obj: unknown): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(obj)}\n\n`);
}
const DONE_FRAME = new TextEncoder().encode("data: [DONE]\n\n");

export const POST: APIRoute = async ({ request }) => {
  if (!API_KEY) {
    return new Response(JSON.stringify({ error: "GOOGLE_AI_API_KEY not set" }), { status: 500 });
  }

  let body: ChatRequest;
  try { body = await request.json(); }
  catch { return new Response(JSON.stringify({ error: "invalid json" }), { status: 400 }); }

  let paper;
  if (body.mode === "paper") {
    if (!body.paperSlug) {
      return new Response(JSON.stringify({ error: "paperSlug required" }), { status: 400 });
    }
    const known = PAPERS_META.find((p) => p.slug === body.paperSlug);
    if (!known) {
      return new Response(JSON.stringify({ error: `unknown paper: ${body.paperSlug}` }), { status: 404 });
    }
    const file = path.resolve("src/content/papers", `${known.slug}.mdx`);
    let raw: string;
    try { raw = await fs.readFile(file, "utf8"); }
    catch { return new Response(JSON.stringify({ error: `paper not found: ${known.slug}` }), { status: 404 }); }
    paper = parseMdxStages(raw);
  }

  const systemInstruction = buildSystemPrompt({
    mode: body.mode,
    pedagogyMode: body.pedagogyMode,
    currentStage: body.currentStage,
    paper,
    roadmap: body.mode === "paper" ? undefined : PAPERS_META,
    progressSnapshot: body.progressSnapshot,
  });

  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const contents = body.messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const iter = await ai.models.generateContentStream({
          model: MODEL,
          contents,
          config: { systemInstruction, temperature: 0.3 },
        });
        for await (const chunk of iter) {
          if (request.signal.aborted) break;
          const delta = chunk.text ?? "";
          if (delta) controller.enqueue(sseFrame({ delta }));
        }
      } catch (err: any) {
        controller.enqueue(sseFrame({ error: err?.message ?? "unknown error" }));
      } finally {
        controller.enqueue(DONE_FRAME);
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
};
