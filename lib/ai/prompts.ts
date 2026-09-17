import { SchemaType, type ResponseSchema } from "@google/generative-ai";

// ==============================================================================
// 1. SKILL EXTRACTION
// ==============================================================================
export const SKILL_EXTRACTION_SCHEMA: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    required_skills: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: "Must-have technical or domain skills extracted from the JD and role.",
    },
    nice_to_have_skills: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: "Preferred or secondary skills mentioned.",
    },
    seniority_level: {
      type: SchemaType.STRING,
      enum: ["junior", "mid", "senior", "lead"],
      description: "Inferred seniority level.",
    },
    key_focus_areas: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: "Key themes or interview assessment focus areas (e.g. System Design, Conflict Resolution).",
    },
  },
  required: ["required_skills", "nice_to_have_skills", "seniority_level", "key_focus_areas"],
};

export function buildSkillExtractionPrompt(jobRole: string, jdText?: string, resumeText?: string): string {
  return `Analyze the following job role, job description, and candidate resume to extract key competency requirements for conducting a mock interview.

Target Job Role: ${jobRole}

${jdText ? `Job Description:\n${jdText}\n` : "Job Description: None provided. Infer standard industry expectations for this title."}

${resumeText ? `Candidate Resume / Background:\n${resumeText}\n` : "Resume: None provided. Assess standard expectations for candidate."}

Extract the required skills, nice-to-have skills, assessed seniority level, and key focus areas for the interview arc.`;
}

// ==============================================================================
// 2. QUESTION GENERATION
// ==============================================================================
export const QUESTION_GENERATION_SCHEMA: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    question: {
      type: SchemaType.STRING,
      description: "The interview question to ask the candidate.",
    },
    question_type: {
      type: SchemaType.STRING,
      enum: ["technical", "behavioral", "situational"],
      description: "Category of the question.",
    },
    targets_skill: {
      type: SchemaType.STRING,
      description: "The primary skill or competency this question targets.",
    },
  },
  required: ["question", "question_type", "targets_skill"],
};

export function buildQuestionGenerationSystemPrompt(jobRole: string): string {
  return `You are CAIRA, an experienced, empathetic, and rigorous technical/behavioral interviewer conducting a realistic mock interview for the role of "${jobRole}".
Ask ONE concise, conversational question at a time.
Base each new question on the candidate's previous answer — probe deeper on weak spots, clarify vague points, or move on smoothly from well-covered ground.
Ensure the full interview arc covers both role-specific technical skills and behavioral/leadership competencies.
Keep questions natural, encouraging, and human. Do not repeat topics already covered.`;
}

export function buildQuestionGenerationPrompt(
  jobRole: string,
  extractedSkills: any,
  qaHistory: Array<{ question: string; answer?: string | null; evaluation?: any }>,
  currentQuestionNumber: number,
  targetTotalQuestions: number
): string {
  const historyText = qaHistory.length === 0
    ? "No questions have been asked yet. This is Question 1."
    : qaHistory.map((item, idx) => {
        return `Q${idx + 1}: ${item.question}\nCandidate Answer: ${item.answer || "No answer recorded."}\nEvaluation Notes: ${item.evaluation?.feedback || "N/A"}`;
      }).join("\n---\n");

  return `Current Interview Progress: Question ${currentQuestionNumber} of ${targetTotalQuestions}.
Target Job Role: ${jobRole}
Target Skills & Competencies: ${JSON.stringify(extractedSkills || {})}

Previous Conversation History:
${historyText}

Instructions:
${currentQuestionNumber === 1
  ? "Generate an opening warm-up yet substantive question appropriate for the role and candidate seniority."
  : currentQuestionNumber === targetTotalQuestions
  ? "Generate a final concluding question, such as a high-level situational scenario, architectural trade-off, or career leadership reflection."
  : "Generate the next contextual question. Look at the last answer, adapt to what was said, and target an uncovered competency."}

Return the response adhering strictly to the JSON schema.`;
}

// ==============================================================================
// 3. ANSWER EVALUATION
// ==============================================================================
export const ANSWER_EVALUATION_SCHEMA: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    score: {
      type: SchemaType.INTEGER,
      description: "Score from 0 to 10 evaluating the quality and depth of the answer.",
    },
    strengths: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: "Specific strengths and good points in the candidate's answer.",
    },
    gaps: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: "Missing aspects, ambiguities, or areas where the candidate could be more specific.",
    },
    feedback: {
      type: SchemaType.STRING,
      description: "Constructive, encouraging, and actionable feedback for improvement.",
    },
  },
  required: ["score", "strengths", "gaps", "feedback"],
};

export function buildAnswerEvaluationPrompt(
  jobRole: string,
  question: string,
  answer: string,
  targetSkill?: string,
  extractedSkills?: any
): string {
  return `You are evaluating a candidate's spoken/typed answer in a mock interview for the role of "${jobRole}".
Context:
- Target Skill / Topic: ${targetSkill || "General Competency"}
- Required Role Skills: ${JSON.stringify(extractedSkills || {})}
- Question Asked: "${question}"
- Candidate Answer: "${answer}"

Provide an objective, encouraging, and constructive evaluation:
1. Score from 0 to 10 (10 = comprehensive, structured with STAR/metrics/tradeoffs; 7 = good foundational answer; 4 = vague or missing key technical depth).
2. Highlight specific strengths demonstrated.
3. Identify gaps or missed opportunities to strengthen the response.
4. Provide a succinct, constructive feedback summary.`;
}

// ==============================================================================
// 4. FINAL REPORT
// ==============================================================================
export const FINAL_REPORT_SCHEMA: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    overall_score: {
      type: SchemaType.INTEGER,
      description: "Overall interview readiness score from 0 to 100.",
    },
    summary: {
      type: SchemaType.STRING,
      description: "Executive summary of the candidate's interview performance and readiness level.",
    },
    top_strengths: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: "Top 3 to 5 candidate strengths across all questions.",
    },
    key_gaps: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: "Top 3 to 4 actionable gaps or areas needing study before real interviews.",
    },
    recommendation: {
      type: SchemaType.STRING,
      description: "Hiring decision prediction / readiness recommendation (e.g., 'Strong Hire for Mid-level', 'Borderline — Practice System Design').",
    },
    per_skill_breakdown: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          skill: { type: SchemaType.STRING },
          score: { type: SchemaType.INTEGER, description: "Score from 0 to 100" },
          notes: { type: SchemaType.STRING },
        },
        required: ["skill", "score", "notes"],
      },
      description: "Breakdown of scores and observations across key competencies assessed.",
    },
  },
  required: ["overall_score", "summary", "top_strengths", "key_gaps", "recommendation", "per_skill_breakdown"],
};

export function buildFinalReportPrompt(
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
): string {
  const qnaText = qaRecords.map(item => `
Question #${item.question_number} [${item.question_type || "General"} - ${item.targets_skill || "General"}]:
Q: ${item.question_text}
A: ${item.answer_text || "No response provided."}
Turn Score: ${item.score ?? "N/A"}/10
Strengths: ${(item.evaluation?.strengths || []).join("; ")}
Gaps: ${(item.evaluation?.gaps || []).join("; ")}
Notes: ${item.evaluation?.feedback || "N/A"}
`).join("\n---");

  return `Generate a comprehensive final interview readiness report for a candidate who completed a mock interview for "${jobRole}".

Target Competencies:
${JSON.stringify(extractedSkills || {})}

Full Interview Transcript & Evaluations:
${qnaText}

Synthesize all answers into:
1. Overall Readiness Score (0 to 100).
2. Professional, supportive executive summary.
3. Key strengths and standout examples.
4. Key gaps and clear recommendations for improvement.
5. Per-skill breakdown (0 to 100) with diagnostic notes.`;
}
