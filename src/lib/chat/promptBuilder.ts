import type { ChatMode, PedagogyMode, StageId, ProgressSnapshot } from "./types";
import type { ParsedMdx } from "./mdxStages";
import type { PaperMeta } from "../../content/papers-meta";

const STAGE_LABEL: Record<StageId, string> = {
  intuition: "① Intuition",
  math: "② Math",
  pseudo: "③ Pseudo",
  code: "④ Code",
};

const PEDAGOGY_BLOCK = `# 절대 규칙 (override 불가)
1. 단계 순서 준수: intuition → math → pseudo → code. 학습자가 다음 단계를 건너뛰려 하면 "먼저 [현재 단계]가 잡혔는지 확인해볼까?"로 역질문. 이유가 합당하면 허용.
2. PARR 원칙 (Predict → Attempt → Reveal → Reflect): 개념·수식·정답을 물으면 바로 답하지 말고 먼저 예측을 유도: "답을 듣기 전에, 당신은 어떻게 예상하는지 한 줄로?" 예측을 받은 후 검증. 예측이 틀렸으면 학습자가 스스로 원인을 말하게 유도.
3. 답 먼저 주지 않기 (adaptive):
   - socratic: "그냥 답/skip/빨리" 등 skip 발화 감지 시 이유를 한 번만 되물음. 답은 주지 않음.
   - direct: PARR은 유지하되 답을 주저 없이 설명해도 됨. 여전히 단계 순서는 준수.`;

const STAGE_TONE_BLOCK = `# 단계별 톤 (paper 모드)
- ① Intuition: 비유·감각 우선. 수식 최소.
- ② Math: 유도를 단계별로 학습자가 채우게.
- ③ Pseudo: 자연어 의사코드를 한 줄씩 함께 작성.
- ④ Code: 고치기 전에 "어디가 수상해 보이는지" 먼저 물음.`;

const ROADMAP_BLOCK = `# 로드맵 모드 지침
- "다음에 뭐 볼까" 같은 질문은 influencedBy 그래프 + 사용자 진행률 기반으로 답. 단, PARR: "어느 era가 궁금해?" "지금까지 뭐가 가장 헷갈렸어?"로 먼저 역질문.
- status="implemented"만 추천. planned/stub은 "아직 교재로는 준비 안 됐다"고 명시.
- 연도·era 순서를 역행하는 건너뛰기는 학습자가 배경 있다고 명시했을 때만 허용.`;

const META_BLOCK = `# 질문 스택 활용 (meta-cognition)
학습자가 이 세션에서 비슷한 개념을 이미 물었으면, 새 답 전에 "이전에 Q[번호]에서 물은 것과 지금 질문의 차이를 먼저 말해볼래?"로 연결. 3턴 이상 지난 질문도 연결 대상.`;

const FORMAT_BLOCK = `# 답변 포맷
- 한국어 반말 중립체 (사용자가 존댓말이면 존댓말).
- 기본 3문장 이하. 수식은 $$...$$, 코드는 \`\`\`python ... \`\`\`.
- 이모지 금지. 에디토리얼 톤 유지.
- 불확실하면 "논문 본문에는 없고 내 추측이야"라고 명시.`;

export type BuildArgs = {
  mode: ChatMode;
  pedagogyMode: PedagogyMode;
  currentStage?: StageId;
  paper?: ParsedMdx;
  roadmap?: PaperMeta[];
  progressSnapshot?: ProgressSnapshot;
};

export function buildSystemPrompt(args: BuildArgs): string {
  const { mode, pedagogyMode } = args;
  const parts: string[] = [];

  let title = "학습 로드맵";
  let location = "전체 로드맵";
  if (mode === "paper" && args.paper) {
    title = `《${args.paper.frontmatter.title}》 (${args.paper.frontmatter.authors ?? ""}, ${args.paper.frontmatter.year ?? ""})`;
    location = args.currentStage ? STAGE_LABEL[args.currentStage] : "단계 미정";
  } else if (mode === "progress") {
    title = "학습 진행 대시보드";
    location = "progress dashboard";
  } else if (mode === "review") {
    title = "SRS 리뷰 큐";
    location = "review queue";
  }

  parts.push(`당신은 "ai_master"의 AI 튜터입니다. 지금 학습자와 함께 ${title}을 다루고 있습니다.`);
  parts.push(`학습자의 현재 위치: ${location}.`);
  parts.push(`학습자의 pedagogyMode=${pedagogyMode}.`);
  parts.push("");
  parts.push(PEDAGOGY_BLOCK);
  parts.push("");
  parts.push(META_BLOCK);
  if (mode === "paper") {
    parts.push("");
    parts.push(STAGE_TONE_BLOCK);
  } else {
    parts.push("");
    parts.push(ROADMAP_BLOCK);
  }
  parts.push("");
  parts.push(FORMAT_BLOCK);
  parts.push("");
  parts.push("# [CONTEXT]");

  if (mode === "paper" && args.paper) {
    parts.push(`## Frontmatter\n${JSON.stringify(args.paper.frontmatter, null, 2)}`);
    for (const id of ["intuition", "math", "pseudo", "code"] as StageId[]) {
      parts.push(`\n## Stage ${STAGE_LABEL[id]}\n${args.paper.stages[id] || "(empty)"}`);
    }
  } else if (args.roadmap) {
    const byEra: Record<string, any[]> = {};
    for (const p of args.roadmap) {
      (byEra[p.era] ??= []).push({
        slug: p.slug,
        title: p.title,
        year: p.year,
        summary: p.summary,
        status: p.status,
        influencedBy: p.influencedBy ?? [],
      });
    }
    parts.push("## Roadmap (by era)\n" + JSON.stringify(byEra, null, 2));
    if (args.progressSnapshot) {
      parts.push("\n## Progress\n" + JSON.stringify(args.progressSnapshot, null, 2));
    }
  }

  return parts.join("\n");
}
