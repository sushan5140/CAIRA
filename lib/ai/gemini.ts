import { GoogleGenerativeAI } from "@google/generative-ai";
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

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// Helper for transient retry
async function executeWithRetry<T>(fn: () => Promise<T>, retries = 1): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    if (retries > 0) {
      console.warn("Gemini API call failed, retrying once...", error?.message || error);
      await new Promise((res) => setTimeout(res, 1200));
      return executeWithRetry(fn, retries - 1);
    }
    throw error;
  }
}

// ------------------------------------------------------------------------------
// 1. Skill Extraction
// ------------------------------------------------------------------------------
export async function extractSkillsWithGemini(
  jobRole: string,
  jdText?: string,
  resumeText?: string,
  resumePdfBase64?: string
): Promise<SkillExtractionResult> {
  if (!genAI) {
    return getSimulatedSkills(jobRole, jdText);
  }

  return executeWithRetry(async () => {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: SKILL_EXTRACTION_SCHEMA,
        temperature: 0.2,
      },
    });

    const parts: any[] = [];
    if (resumePdfBase64) {
      parts.push({
        inlineData: {
          mimeType: "application/pdf",
          data: resumePdfBase64,
        },
      });
    }

    parts.push({
      text: buildSkillExtractionPrompt(jobRole, jdText, resumeText),
    });

    const result = await model.generateContent(parts);
    const text = result.response.text();
    return JSON.parse(text) as SkillExtractionResult;
  }).catch((err) => {
    console.error("Gemini skill extraction failed, using fallback:", err);
    return getSimulatedSkills(jobRole, jdText);
  });
}

// ------------------------------------------------------------------------------
// 2. Question Generation
// ------------------------------------------------------------------------------
export async function generateQuestionWithGemini(
  jobRole: string,
  extractedSkills: any,
  qaHistory: Array<{ question: string; answer?: string | null; evaluation?: any }>,
  currentQuestionNumber: number,
  targetTotalQuestions: number
): Promise<QuestionGenerationResult> {
  if (!genAI) {
    return getSimulatedQuestion(jobRole, currentQuestionNumber, targetTotalQuestions, extractedSkills, qaHistory);
  }

  return executeWithRetry(async () => {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: buildQuestionGenerationSystemPrompt(jobRole),
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: QUESTION_GENERATION_SCHEMA,
        temperature: 0.6,
      },
    });

    const prompt = buildQuestionGenerationPrompt(
      jobRole,
      extractedSkills,
      qaHistory,
      currentQuestionNumber,
      targetTotalQuestions
    );

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return JSON.parse(text) as QuestionGenerationResult;
  }).catch((err) => {
    console.error("Gemini question generation error, falling back to simulated:", err);
    return getSimulatedQuestion(jobRole, currentQuestionNumber, targetTotalQuestions, extractedSkills, qaHistory);
  });
}

// ------------------------------------------------------------------------------
// 3. Answer Evaluation
// ------------------------------------------------------------------------------
export async function evaluateAnswerWithGemini(
  jobRole: string,
  question: string,
  answer: string,
  targetSkill?: string,
  extractedSkills?: any
): Promise<AnswerEvaluationResult> {
  if (!genAI) {
    return getSimulatedAnswerEvaluation(answer, targetSkill);
  }

  return executeWithRetry(async () => {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: ANSWER_EVALUATION_SCHEMA,
        temperature: 0.3,
      },
    });

    const prompt = buildAnswerEvaluationPrompt(
      jobRole,
      question,
      answer,
      targetSkill,
      extractedSkills
    );

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return JSON.parse(text) as AnswerEvaluationResult;
  }).catch((err) => {
    console.error("Gemini evaluation error, using simulation:", err);
    return getSimulatedAnswerEvaluation(answer, targetSkill);
  });
}

// ------------------------------------------------------------------------------
// 4. Final Report
// ------------------------------------------------------------------------------
export async function generateFinalReportWithGemini(
  jobRole: string,
  extractedSkills: any,
  qaRecords: Array<{
    question_number: number;
    question_text: string;
    question_type?: string;
    targets_skill?: string;
    answer_text?: string | null;
    score?: number | null;
    evaluation?: any;
  }>
): Promise<FinalReportData> {
  if (!genAI) {
    return getSimulatedFinalReport(jobRole, extractedSkills, qaRecords);
  }

  return executeWithRetry(async () => {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: FINAL_REPORT_SCHEMA,
        temperature: 0.4,
      },
    });

    const prompt = buildFinalReportPrompt(jobRole, extractedSkills, qaRecords);
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return JSON.parse(text) as FinalReportData;
  }).catch((err) => {
    console.error("Gemini report generation error, using fallback:", err);
    return getSimulatedFinalReport(jobRole, extractedSkills, qaRecords);
  });
}

// ==============================================================================
// Realistic Fallback / Simulation Generators
// ==============================================================================
function getSimulatedSkills(jobRole: string, jdText?: string): SkillExtractionResult {
  const isEngineer = /engineer|developer|software|fullstack|frontend|backend/i.test(jobRole);
  const isProduct = /product|manager|pm/i.test(jobRole);
  const isData = /data|ml|ai|analyst/i.test(jobRole);

  if (isProduct) {
    return {
      required_skills: ["Product Strategy", "User Research & PRD", "Metrics & KPIs", "Stakeholder Alignment"],
      nice_to_have_skills: ["A/B Testing", "SQL / Data Analysis", "Figma Prototyping"],
      seniority_level: "senior",
      key_focus_areas: ["Product Sense", "Execution & Prioritization", "Cross-Functional Leadership"],
    };
  }

  if (isData) {
    return {
      required_skills: ["Python", "SQL & Data Modeling", "Statistical Analysis", "Machine Learning Pipelines"],
      nice_to_have_skills: ["PyTorch / TensorFlow", "Distributed Computing (Spark)", "Cloud Warehouses (BigQuery/Snowflake)"],
      seniority_level: "mid",
      key_focus_areas: ["Model Architecture", "Data Reliability & Drift", "Translating Insights to Business"],
    };
  }

  return {
    required_skills: ["System Architecture", "TypeScript / JavaScript", "API Design (REST/GraphQL)", "Database Modeling (SQL/NoSQL)"],
    nice_to_have_skills: ["Cloud & DevOps (Docker, CI/CD)", "Next.js / React Performance", "Testing & Reliability"],
    seniority_level: "senior",
    key_focus_areas: ["Distributed Systems", "Clean Code & Refactoring", "Technical Communication under Pressure"],
  };
}

function getSimulatedQuestion(
  jobRole: string,
  qNum: number,
  totalQ: number,
  skills: any,
  history: any[]
): QuestionGenerationResult {
  const lastAns = history.length > 0 ? history[history.length - 1]?.answer || "" : "";

  if (qNum === 1) {
    return {
      question: `Welcome! To kick off our mock interview for the ${jobRole} role, could you walk me through a recent project you led or contributed heavily to, focusing on the technical architecture decisions and trade-offs you made?`,
      question_type: "technical",
      targets_skill: "System Architecture",
    };
  }

  if (qNum === 2) {
    return {
      question: `Thanks for that breakdown. You mentioned handling complex data flows. Can you describe a challenging bug or performance bottleneck that occurred in production, and how you traced and resolved it?`,
      question_type: "technical",
      targets_skill: "Debugging & Observability",
    };
  }

  if (qNum === 3) {
    return {
      question: `Tell me about a time when you strongly disagreed with an engineering manager, product lead, or teammate regarding a technical roadmap or implementation choice. How did you navigate that disagreement?`,
      question_type: "behavioral",
      targets_skill: "Stakeholder Alignment & Communication",
    };
  }

  if (qNum === 4) {
    return {
      question: `Let's dive into scaling. If the traffic on your core service suddenly increased 10x overnight, what parts of your system would break first, and what mitigation steps would you implement?`,
      question_type: "situational",
      targets_skill: "Scalability & Resilience",
    };
  }

  if (qNum >= totalQ) {
    return {
      question: `Looking back at your career so far, what is one major technical failure or regret you experienced, what did you learn from it, and how has it shaped your engineering judgment today?`,
      question_type: "behavioral",
      targets_skill: "Continuous Learning & Ownership",
    };
  }

  return {
    question: `In your previous answer, you touched on collaboration. When requirements are ambiguous and deadlines are tight, how do you determine what to build versus what to defer?`,
    question_type: "situational",
    targets_skill: "Execution & Prioritization",
  };
}

function getSimulatedAnswerEvaluation(answer: string, targetSkill?: string): AnswerEvaluationResult {
  const words = answer.trim().split(/\s+/).length;
  if (words < 12) {
    return {
      score: 4,
      strengths: ["Direct attempt at addressing the question."],
      gaps: ["The response is very brief.", "Lacks specific technical depth, metrics, or concrete examples."],
      feedback: "Try using the STAR format (Situation, Task, Action, Result) and include specific technologies or measurable outcomes.",
    };
  }

  if (words < 40) {
    return {
      score: 7,
      strengths: ["Clear core message", "Mentions relevant context."],
      gaps: ["Could articulate the trade-offs or alternatives considered more clearly."],
      feedback: "Good foundation! You can elevate this to a top-tier answer by explaining why you picked this approach over alternatives.",
    };
  }

  return {
    score: 9,
    strengths: [
      "Structured, comprehensive explanation.",
      "Good inclusion of concrete architectural or decision-making details.",
      "Clear ownership and reflection on outcomes.",
    ],
    gaps: ["Minor: ensure you keep the narrative concise so the interviewer has time for follow-ups."],
    feedback: "Strong response with clear technical depth and balanced situational context.",
  };
}

function getSimulatedFinalReport(
  jobRole: string,
  skills: any,
  qaRecords: any[]
): FinalReportData {
  const scores = qaRecords.map((q) => q.score || 7);
  const avg = Math.round(scores.reduce((a, b) => a + b, 0) / (scores.length || 1));
  const overall = Math.min(100, Math.max(30, avg * 10 + 5));

  return {
    overall_score: overall,
    summary: `The candidate demonstrated solid competence for the ${jobRole} role, articulating technical solutions with clarity and showing strong problem-solving instinct under interview conditions.`,
    top_strengths: [
      "Structured thought process when dissecting multi-layered problems.",
      "Effective communication of architectural trade-offs.",
      "Positive attitude towards cross-functional collaboration and feedback.",
    ],
    key_gaps: [
      "Quantify impact more consistently with specific metrics (e.g. latency reductions, percentage uptime).",
      "Proactively elaborate on system failure modes and fallback strategies.",
    ],
    recommendation: overall >= 80 ? "Strong Hire / Advanced Readiness" : "Solid Candidate — Practice Deeper System Design Scenarios",
    per_skill_breakdown: [
      {
        skill: "Technical Depth & Architecture",
        score: Math.min(100, overall + 4),
        notes: "Articulated core components well; can strengthen on failure edge-cases.",
      },
      {
        skill: "Behavioral & STAR Delivery",
        score: Math.min(100, overall - 2),
        notes: "Good storytelling; remember to highlight the 'Result' phase with numbers.",
      },
      {
        skill: "Communication & Clarity",
        score: Math.min(100, overall + 6),
        notes: "Calm, coherent pacing; handled follow-ups smoothly.",
      },
      {
        skill: "Problem Solving & Trade-offs",
        score: Math.min(100, overall),
        notes: "Understands cost vs. speed trade-offs in modern production environments.",
      },
    ],
  };
}
