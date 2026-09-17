import { GoogleGenAI, type Part } from "@google/genai";
import {
  SKILL_EXTRACTION_SCHEMA,
  QUESTION_GENERATION_SCHEMA,
  ANSWER_EVALUATION_SCHEMA,
  FINAL_REPORT_SCHEMA,
  buildSkillExtractionPrompt,
  buildQuestionGenerationSystemPrompt,
  buildQuestionGenerationPrompt,
  buildAnswerEvaluationPrompt,
  buildFinalReportPrompt,
} from "./prompts";
import type {
  SkillExtractionResult,
  QuestionGenerationResult,
  AnswerEvaluationResult,
  FinalReportData,
} from "@/types/interview";

const apiKey = process.env.GEMINI_API_KEY?.trim() || "";
const modelName = process.env.GEMINI_MODEL?.trim() || "gemini-3.8-flash";
const parsedTimeout = Number(process.env.GEMINI_TIMEOUT_MS || 20000);
const GEMINI_TIMEOUT_MS = Number.isFinite(parsedTimeout)
  ? Math.max(5000, Math.min(60000, parsedTimeout))
  : 20000;
const genAI = apiKey ? new GoogleGenAI({ apiKey }) : null;

async function executeWithRetry<T>(fn: () => Promise<T>, retries = 1): Promise<T> {
  try {
    return await fn();
  } catch (error: unknown) {
    if (retries > 0) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn("Gemini API call failed, retrying once...", message);
      await new Promise((resolve) => setTimeout(resolve, 1200));
      return executeWithRetry(fn, retries - 1);
    }
    throw error;
  }
}

function parseJson<T>(text: string | undefined): T {
  const payload = text?.trim();
  if (!payload) throw new Error("EMPTY_GEMINI_RESPONSE");
  return JSON.parse(payload) as T;
}

function httpOptions() {
  return { timeout: GEMINI_TIMEOUT_MS };
}

export async function extractSkillsWithGemini(
  jobRole: string,
  jdText?: string,
  resumeText?: string,
  resumePdfBase64?: string
): Promise<SkillExtractionResult> {
  if (!genAI) return getSimulatedSkills(jobRole);

  return executeWithRetry(async () => {
    const parts: Part[] = [];
    if (resumePdfBase64) {
      parts.push({
        inlineData: {
          mimeType: "application/pdf",
          data: resumePdfBase64,
        },
      });
    }
    parts.push({ text: buildSkillExtractionPrompt(jobRole, jdText, resumeText) });

    const result = await genAI.models.generateContent({
      model: modelName,
      contents: parts,
      config: {
        responseMimeType: "application/json",
        responseSchema: SKILL_EXTRACTION_SCHEMA,
        temperature: 0.2,
        maxOutputTokens: 1200,
        httpOptions: httpOptions(),
      },
    });

    return parseJson<SkillExtractionResult>(result.text);
  }).catch((error) => {
    console.error("Gemini skill extraction failed, using fallback:", error);
    return getSimulatedSkills(jobRole);
  });
}

export async function generateQuestionWithGemini(
  jobRole: string,
  extractedSkills: unknown,
  qaHistory: Array<{ question: string; answer?: string | null; evaluation?: unknown }>,
  currentQuestionNumber: number,
  targetTotalQuestions: number
): Promise<QuestionGenerationResult> {
  if (!genAI) {
    return getSimulatedQuestion(
      jobRole,
      currentQuestionNumber,
      targetTotalQuestions,
      qaHistory
    );
  }

  return executeWithRetry(async () => {
    const prompt = buildQuestionGenerationPrompt(
      jobRole,
      extractedSkills,
      qaHistory,
      currentQuestionNumber,
      targetTotalQuestions
    );

    const result = await genAI.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        systemInstruction: buildQuestionGenerationSystemPrompt(jobRole),
        responseMimeType: "application/json",
        responseSchema: QUESTION_GENERATION_SCHEMA,
        temperature: 0.6,
        maxOutputTokens: 700,
        httpOptions: httpOptions(),
      },
    });

    return parseJson<QuestionGenerationResult>(result.text);
  }).catch((error) => {
    console.error("Gemini question generation failed, using fallback:", error);
    return getSimulatedQuestion(
      jobRole,
      currentQuestionNumber,
      targetTotalQuestions,
      qaHistory
    );
  });
}

export async function evaluateAnswerWithGemini(
  jobRole: string,
  question: string,
  answer: string,
  targetSkill?: string,
  extractedSkills?: unknown
): Promise<AnswerEvaluationResult> {
  if (!genAI) return getSimulatedAnswerEvaluation(answer);

  return executeWithRetry(async () => {
    const prompt = buildAnswerEvaluationPrompt(
      jobRole,
      question,
      answer,
      targetSkill,
      extractedSkills
    );

    const result = await genAI.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: ANSWER_EVALUATION_SCHEMA,
        temperature: 0.3,
        maxOutputTokens: 1200,
        httpOptions: httpOptions(),
      },
    });

    const evaluation = parseJson<AnswerEvaluationResult>(result.text);
    return {
      ...evaluation,
      score: Math.max(0, Math.min(10, Math.round(Number(evaluation.score) || 0))),
    };
  }).catch((error) => {
    console.error("Gemini answer evaluation failed, using fallback:", error);
    return getSimulatedAnswerEvaluation(answer);
  });
}

export async function generateFinalReportWithGemini(
  jobRole: string,
  extractedSkills: unknown,
  qaRecords: Array<{
    question_number: number;
    question_text: string;
    question_type?: string;
    targets_skill?: string;
    answer_text?: string | null;
    score?: number | null;
    evaluation?: unknown;
  }>
): Promise<FinalReportData> {
  if (!genAI) return getSimulatedFinalReport(jobRole, qaRecords);

  return executeWithRetry(async () => {
    const prompt = buildFinalReportPrompt(jobRole, extractedSkills, qaRecords);
    const result = await genAI.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: FINAL_REPORT_SCHEMA,
        temperature: 0.4,
        maxOutputTokens: 2400,
        httpOptions: httpOptions(),
      },
    });

    const report = parseJson<FinalReportData>(result.text);
    return {
      ...report,
      overall_score: Math.max(
        0,
        Math.min(100, Math.round(Number(report.overall_score) || 0))
      ),
    };
  }).catch((error) => {
    console.error("Gemini final report failed, using fallback:", error);
    return getSimulatedFinalReport(jobRole, qaRecords);
  });
}

function getSimulatedSkills(jobRole: string): SkillExtractionResult {
  const isProduct = /product|manager|pm/i.test(jobRole);
  const isData = /data|ml|ai|analyst/i.test(jobRole);

  if (isProduct) {
    return {
      required_skills: [
        "Product Strategy",
        "User Research & PRD",
        "Metrics & KPIs",
        "Stakeholder Alignment",
      ],
      nice_to_have_skills: ["A/B Testing", "SQL / Data Analysis", "Figma Prototyping"],
      seniority_level: "senior",
      key_focus_areas: [
        "Product Sense",
        "Execution & Prioritization",
        "Cross-Functional Leadership",
      ],
    };
  }

  if (isData) {
    return {
      required_skills: [
        "Python",
        "SQL & Data Modeling",
        "Statistical Analysis",
        "Machine Learning Pipelines",
      ],
      nice_to_have_skills: [
        "PyTorch / TensorFlow",
        "Distributed Computing (Spark)",
        "Cloud Warehouses (BigQuery/Snowflake)",
      ],
      seniority_level: "mid",
      key_focus_areas: [
        "Model Architecture",
        "Data Reliability & Drift",
        "Translating Insights to Business",
      ],
    };
  }

  return {
    required_skills: [
      "System Architecture",
      "TypeScript / JavaScript",
      "API Design (REST/GraphQL)",
      "Database Modeling (SQL/NoSQL)",
    ],
    nice_to_have_skills: [
      "Cloud & DevOps (Docker, CI/CD)",
      "Next.js / React Performance",
      "Testing & Reliability",
    ],
    seniority_level: "senior",
    key_focus_areas: [
      "Distributed Systems",
      "Clean Code & Refactoring",
      "Technical Communication under Pressure",
    ],
  };
}

function getSimulatedQuestion(
  jobRole: string,
  questionNumber: number,
  totalQuestions: number,
  history: Array<{ question: string; answer?: string | null }>
): QuestionGenerationResult {
  if (questionNumber === 1) {
    return {
      question: `Welcome! To kick off our mock interview for the ${jobRole} role, could you walk me through a recent project you led or contributed heavily to, focusing on the technical architecture decisions and trade-offs you made?`,
      question_type: "technical",
      targets_skill: "System Architecture",
    };
  }

  if (questionNumber === 2) {
    return {
      question:
        "Thanks for that breakdown. Can you describe a challenging production bug or performance bottleneck, and how you traced and resolved it?",
      question_type: "technical",
      targets_skill: "Debugging & Observability",
    };
  }

  if (questionNumber === 3) {
    return {
      question:
        "Tell me about a time you strongly disagreed with a teammate or stakeholder about a technical roadmap or implementation choice. How did you navigate the disagreement?",
      question_type: "behavioral",
      targets_skill: "Stakeholder Alignment & Communication",
    };
  }

  if (questionNumber === 4) {
    return {
      question:
        "If traffic on your core service increased 10x overnight, what would you expect to fail first, and what mitigation steps would you prioritize?",
      question_type: "situational",
      targets_skill: "Scalability & Resilience",
    };
  }

  if (questionNumber >= totalQuestions) {
    return {
      question:
        "Looking back at your experience, what is one major technical mistake or failed approach, what did you learn from it, and how has it changed your judgment?",
      question_type: "behavioral",
      targets_skill: "Continuous Learning & Ownership",
    };
  }

  const previousAnswer = history.at(-1)?.answer?.trim();
  return {
    question: previousAnswer
      ? "Building on your previous answer, when requirements are ambiguous and deadlines are tight, how do you decide what to build now versus what to defer?"
      : "When requirements are ambiguous and deadlines are tight, how do you decide what to build now versus what to defer?",
    question_type: "situational",
    targets_skill: "Execution & Prioritization",
  };
}

function getSimulatedAnswerEvaluation(answer: string): AnswerEvaluationResult {
  const words = answer.trim().split(/\s+/).filter(Boolean).length;

  if (words < 12) {
    return {
      score: 4,
      strengths: ["Direct attempt at addressing the question."],
      gaps: [
        "The response is very brief.",
        "It needs more specific context, decisions, or measurable outcomes.",
      ],
      feedback:
        "Try using the STAR structure (Situation, Task, Action, Result) and add concrete technologies, trade-offs, or outcomes.",
    };
  }

  if (words < 40) {
    return {
      score: 7,
      strengths: ["Clear core message", "Includes relevant context."],
      gaps: ["The trade-offs or alternatives considered could be explained more clearly."],
      feedback:
        "Good foundation. Strengthen it by explaining why you chose this approach over the alternatives and what changed as a result.",
    };
  }

  return {
    score: 9,
    strengths: [
      "Structured, comprehensive explanation.",
      "Includes concrete technical or decision-making details.",
      "Shows ownership and reflection on outcomes.",
    ],
    gaps: ["Keep the narrative concise enough to leave room for follow-up questions."],
    feedback:
      "Strong response with clear depth and useful context. Keep the strongest evidence and metrics near the center of the answer.",
  };
}

function getSimulatedFinalReport(
  jobRole: string,
  qaRecords: Array<{ score?: number | null }>
): FinalReportData {
  const scores = qaRecords.map((question) => question.score ?? 7);
  const average = scores.length
    ? scores.reduce((sum, score) => sum + score, 0) / scores.length
    : 0;
  const overall = Math.max(0, Math.min(100, Math.round(average * 10)));

  return {
    overall_score: overall,
    summary: `The practice session showed a solid foundation for ${jobRole} interviews, with clear problem-solving and room to make examples more specific and measurable.`,
    top_strengths: [
      "Structured thought process when breaking down multi-layered problems.",
      "Clear communication of technical trade-offs.",
      "Constructive approach to collaboration and feedback.",
    ],
    key_gaps: [
      "Quantify outcomes more consistently with concrete metrics.",
      "Explain failure modes and fallback strategies more proactively.",
    ],
    recommendation:
      overall >= 80
        ? "Advanced practice readiness — continue with harder follow-up and system-design scenarios."
        : "Continue practice with deeper examples, clearer trade-offs, and stronger STAR outcomes.",
    per_skill_breakdown: [
      {
        skill: "Technical Depth & Architecture",
        score: Math.min(100, overall + 4),
        notes: "Good core reasoning; strengthen failure-mode analysis.",
      },
      {
        skill: "Behavioral & STAR Delivery",
        score: Math.max(0, overall - 2),
        notes: "Good structure; make the result phase more measurable.",
      },
      {
        skill: "Communication & Clarity",
        score: Math.min(100, overall + 6),
        notes: "Clear pacing and coherent explanations.",
      },
      {
        skill: "Problem Solving & Trade-offs",
        score: overall,
        notes: "Shows sound prioritization and trade-off awareness.",
      },
    ],
  };
}
