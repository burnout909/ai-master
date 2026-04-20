import type { EraId } from "../lib/eras";

export type PaperStatus = "implemented" | "stub" | "planned";

export type PaperMeta = {
  slug: string;
  title: string;
  authors: string;
  year: number;
  era: EraId;
  arxivId?: string;
  summary: string;
  status: PaperStatus;
  influencedBy?: string[];
};

export const PAPERS_META: PaperMeta[] = [
  // ——— DL Foundations ———
  { slug: "alexnet",     title: "ImageNet Classification with Deep CNNs", authors: "Krizhevsky, Sutskever, Hinton", year: 2012, era: "foundations", arxivId: "1102.0183", summary: "CNN + GPU + dropout wins ImageNet, kicks off deep-learning era.", status: "implemented" },
  { slug: "dropout",     title: "Dropout: A Simple Way to Prevent Neural Networks from Overfitting", authors: "Srivastava et al.", year: 2014, era: "foundations", arxivId: "1207.0580", summary: "Random unit-zeroing regularizer.", status: "implemented" },
  { slug: "adam",        title: "Adam: A Method for Stochastic Optimization", authors: "Kingma, Ba", year: 2014, era: "foundations", arxivId: "1412.6980", summary: "Adaptive moment estimation optimizer.", status: "implemented" },
  { slug: "seq2seq",     title: "Sequence to Sequence Learning with Neural Networks", authors: "Sutskever, Vinyals, Le", year: 2014, era: "foundations", arxivId: "1409.3215", summary: "Encoder–decoder RNN for translation.", status: "implemented" },
  { slug: "gan",         title: "Generative Adversarial Nets", authors: "Goodfellow et al.", year: 2014, era: "foundations", arxivId: "1406.2661", summary: "Generator vs discriminator minimax game.", status: "implemented" },
  { slug: "batchnorm",   title: "Batch Normalization", authors: "Ioffe, Szegedy", year: 2015, era: "foundations", arxivId: "1502.03167", summary: "Reduces internal covariate shift, stabilizes training.", status: "implemented" },
  { slug: "resnet",      title: "Deep Residual Learning for Image Recognition", authors: "He et al.", year: 2015, era: "foundations", arxivId: "1512.03385", summary: "Skip connections enable very deep networks.", status: "implemented" },
  { slug: "bahdanau",    title: "Neural Machine Translation by Jointly Learning to Align and Translate", authors: "Bahdanau, Cho, Bengio", year: 2014, era: "foundations", arxivId: "1409.0473", summary: "Attention mechanism for seq2seq alignment.", status: "implemented" },

  // ——— Transformer Era ———
  { slug: "transformer", title: "Attention Is All You Need", authors: "Vaswani et al.", year: 2017, era: "transformer", arxivId: "1706.03762", summary: "Self-attention-only architecture replaces RNNs.", status: "implemented", influencedBy: ["bahdanau", "seq2seq"] },
  { slug: "bert",        title: "BERT: Pre-training of Deep Bidirectional Transformers", authors: "Devlin et al.", year: 2018, era: "transformer", arxivId: "1810.04805", summary: "Masked-LM pretraining + fine-tuning.", status: "implemented", influencedBy: ["transformer"] },
  { slug: "gpt2",        title: "Language Models are Unsupervised Multitask Learners", authors: "Radford et al.", year: 2019, era: "transformer", summary: "Scaling decoder-only LMs to 1.5B params.", status: "implemented", influencedBy: ["transformer"] },
  { slug: "gpt3",        title: "Language Models are Few-Shot Learners", authors: "Brown et al.", year: 2020, era: "transformer", arxivId: "2005.14165", summary: "175B-param LM with in-context learning.", status: "implemented", influencedBy: ["gpt2"] },
  { slug: "vit",         title: "An Image is Worth 16x16 Words", authors: "Dosovitskiy et al.", year: 2020, era: "transformer", arxivId: "2010.11929", summary: "Transformers for image classification at scale.", status: "stub", influencedBy: ["transformer"] },
  { slug: "clip",        title: "Learning Transferable Visual Models From Natural Language Supervision", authors: "Radford et al.", year: 2021, era: "transformer", arxivId: "2103.00020", summary: "Contrastive image-text pretraining.", status: "stub", influencedBy: ["transformer", "vit"] },
  { slug: "chinchilla",  title: "Training Compute-Optimal Large Language Models", authors: "Hoffmann et al.", year: 2022, era: "transformer", arxivId: "2203.15556", summary: "Compute-optimal scaling laws.", status: "stub", influencedBy: ["gpt3"] },

  // ——— Generative Models ———
  { slug: "ddpm",        title: "Denoising Diffusion Probabilistic Models", authors: "Ho, Jain, Abbeel", year: 2020, era: "generative", arxivId: "2006.11239", summary: "Diffusion models as generative modeling.", status: "implemented" },
  { slug: "ldm",         title: "High-Resolution Image Synthesis with Latent Diffusion Models", authors: "Rombach et al.", year: 2022, era: "generative", arxivId: "2112.10752", summary: "Diffusion in VAE latent space; Stable Diffusion.", status: "stub", influencedBy: ["ddpm"] },
  { slug: "cfg",         title: "Classifier-Free Diffusion Guidance", authors: "Ho, Salimans", year: 2022, era: "generative", arxivId: "2207.12598", summary: "Conditional generation without a separate classifier.", status: "stub", influencedBy: ["ddpm"] },
  { slug: "flow-matching", title: "Flow Matching for Generative Modeling", authors: "Lipman et al.", year: 2023, era: "generative", arxivId: "2210.02747", summary: "Continuous-time generative modeling via vector fields.", status: "stub", influencedBy: ["ddpm"] },

  // ——— Efficiency ———
  { slug: "flashattention", title: "FlashAttention: Fast and Memory-Efficient Exact Attention", authors: "Dao et al.", year: 2022, era: "efficiency", arxivId: "2205.14135", summary: "IO-aware attention for GPU memory.", status: "stub", influencedBy: ["transformer"] },
  { slug: "mamba",       title: "Mamba: Linear-Time Sequence Modeling with Selective State Spaces", authors: "Gu, Dao", year: 2023, era: "efficiency", arxivId: "2312.00752", summary: "Selective SSM alternative to attention.", status: "stub", influencedBy: ["transformer"] },
  { slug: "gqa",         title: "GQA: Training Generalized Multi-Query Transformer Models", authors: "Ainslie et al.", year: 2023, era: "efficiency", arxivId: "2305.13245", summary: "Grouped-query attention for inference speed.", status: "stub", influencedBy: ["transformer"] },

  // ——— Alignment ———
  { slug: "instructgpt", title: "Training Language Models to Follow Instructions", authors: "Ouyang et al.", year: 2022, era: "alignment", arxivId: "2203.02155", summary: "RLHF pipeline behind ChatGPT.", status: "stub", influencedBy: ["gpt3"] },
  { slug: "ppo",         title: "Proximal Policy Optimization", authors: "Schulman et al.", year: 2017, era: "alignment", arxivId: "1707.06347", summary: "Clipped-ratio policy gradient; backbone of RLHF.", status: "stub" },
  { slug: "dpo",         title: "Direct Preference Optimization", authors: "Rafailov et al.", year: 2023, era: "alignment", arxivId: "2305.18290", summary: "Preference learning without a reward model.", status: "stub", influencedBy: ["instructgpt"] },
  { slug: "constitutional", title: "Constitutional AI: Harmlessness from AI Feedback", authors: "Bai et al.", year: 2022, era: "alignment", arxivId: "2212.08073", summary: "Self-critique against a written constitution.", status: "stub", influencedBy: ["instructgpt"] },

  // ——— Reasoning & Agents ———
  { slug: "cot",         title: "Chain-of-Thought Prompting Elicits Reasoning", authors: "Wei et al.", year: 2022, era: "agents", arxivId: "2201.11903", summary: "Step-by-step prompting improves reasoning.", status: "stub", influencedBy: ["gpt3"] },
  { slug: "react",       title: "ReAct: Synergizing Reasoning and Acting in Language Models", authors: "Yao et al.", year: 2022, era: "agents", arxivId: "2210.03629", summary: "Interleaved thought/act/observe loop.", status: "implemented", influencedBy: ["cot"] },
  { slug: "toolformer",  title: "Toolformer: Language Models Can Teach Themselves to Use Tools", authors: "Schick et al.", year: 2023, era: "agents", arxivId: "2302.04761", summary: "Self-supervised tool-use training.", status: "stub", influencedBy: ["react"] },
  { slug: "reflexion",   title: "Reflexion: Language Agents with Verbal Reinforcement Learning", authors: "Shinn et al.", year: 2023, era: "agents", arxivId: "2303.11366", summary: "Self-reflection improves agent performance.", status: "stub", influencedBy: ["react"] },
  { slug: "tot",         title: "Tree of Thoughts: Deliberate Problem Solving with LLMs", authors: "Yao et al.", year: 2023, era: "agents", arxivId: "2305.10601", summary: "Tree-search over reasoning steps.", status: "stub", influencedBy: ["cot"] },
  { slug: "voyager",     title: "Voyager: An Open-Ended Embodied Agent with LLMs", authors: "Wang et al.", year: 2023, era: "agents", arxivId: "2305.16291", summary: "LLM skill library with code-as-actions.", status: "stub", influencedBy: ["react"] },
  { slug: "deepseek-r1", title: "DeepSeek-R1: Incentivizing Reasoning via Pure RL", authors: "DeepSeek-AI", year: 2025, era: "agents", arxivId: "2501.12948", summary: "RL-only reasoning training at scale.", status: "stub", influencedBy: ["cot"] },
];
