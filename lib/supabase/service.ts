import { getSupabaseServerClient } from "./server";
import type {
  FinalReportData,
  Interview,
  InterviewQuestion,
  SkillExtractionResult,
} from "@/types/interview";

// Local in-memory store used only when Supabase is not configured or when a
// visitor intentionally uses the unauthenticated demo experience.
const globalForStore = globalThis as unknown as {
  cairaStore?: {
    interviews: Map<string, Interview>;
    questions: Map<string, InterviewQuestion[]>;
  };
};

export const localStore =
  globalForStore.cairaStore ||
  (globalForStore.cairaStore = {
    interviews: new Map<string, Interview>(),
    questions: new Map<string, InterviewQuestion[]>(),
  });

const sampleId = "caira-sample-101";

if (!localStore.interviews.has(sampleId)) {
  localStore.interviews.set(sampleId, {
    id: sampleId,
    user_id: "demo-user-id",
    job_role: "Senior Full-Stack Engineer",
    jd_text: "Lead architecture for modern Next.js and microservices applications.",
    extracted_skills: {
      required_skills: ["Next.js & React", "TypeScript", "Node.js API Design", "PostgreSQL"],
      nice_to_have_skills: ["Distributed Caching", "Docker / Kubernetes", "CI/CD Pipelines"],
      seniority_level: "senior",
      key_focus_areas: ["System Architecture", "Performance Tuning", "Technical Leadership"],
    },
    status: "completed",
    overall_score: 88,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    completed_at: new Date(Date.now() - 86400000 * 2 + 1800000).toISOString(),
    target_questions: 5,
    report: {
      overall_score: 88,
      summary:
        "Demonstrated strong grasp of end-to-end full-stack systems, architectural trade-offs, and micro-frontend state management.",
      top_strengths: [
        "Clear explanation of server vs. client rendering performance trade-offs.",
        "Effective use of the STAR method when recounting production incident debugging.",
        "Mature collaborative mindset with product and junior engineering peers.",
      ],
      key_gaps: [
        "Could elaborate more on automated chaos testing and resiliency fallbacks.",
        "Add quantitative metrics (e.g., latency reduction % or throughput figures) to answers.",
      ],
      recommendation: "Strong readiness for advanced Senior Full-Stack Engineering practice.",
      per_skill_breakdown: [
        {
          skill: "System Architecture",
          score: 90,
          notes: "Excellent grasp of distributed caching and DB indexing.",
        },
        {
          skill: "Frontend Engineering",
          score: 92,
          notes: "Deep understanding of Next.js hydration and state management.",
        },
        {
          skill: "Incident Management",
          score: 84,
          notes: "Solid debugging methodology under live production outages.",
        },
        {
          skill: "Behavioral & STAR",
          score: 86,
          notes: "Clear structure and good ownership articulation.",
        },
      ],
    },
  });

  localStore.questions.set(sampleId, [
    {
      id: "q-1",
      interview_id: sampleId,
      question_number: 1,
      question_text:
        "Can you describe the architecture of a high-traffic web application you built, and how you balanced SSR vs CSR?",
      question_type: "technical",
      targets_skill: "System Architecture",
      answer_text:
        "In my previous role, we redesigned our e-commerce platform using Next.js App Router. We utilized Server Components for SEO-critical catalog pages with Redis caching, and client components for dynamic carts and checkout. This reduced our TTFB by 42%.",
      score: 9,
      evaluation: {
        score: 9,
        strengths: [
          "Clear architectural context",
          "Included quantifiable metrics (42% TTFB reduction)",
          "Good breakdown of SSR vs CSR",
        ],
        gaps: ["Could mention edge caching strategies"],
        feedback: "Outstanding opening answer with concrete tech stack and metrics.",
      },
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: "q-2",
      interview_id: sampleId,
      question_number: 2,
      question_text:
        "Tell me about a time a critical database migration failed in production. How did you handle recovery?",
      question_type: "situational",
      targets_skill: "Incident Management",
      answer_text:
        "We had a lock acquisition timeout on Postgres during a peak shopping hour. We immediately engaged the failover read replica, aborted the migration lock, rolled back via expand/contract schema patterns, and executed it later during off-peak with zero data loss.",
      score: 9,
      evaluation: {
        score: 9,
        strengths: ["Mentioned expand/contract pattern", "Calm triage steps", "Zero data loss"],
        gaps: ["Brief mention of post-mortem improvements"],
        feedback: "Great demonstration of real production engineering maturity.",
      },
      created_at: new Date(Date.now() - 86400000 * 2 + 300000).toISOString(),
    },
  ]);
}

async function getAuthenticatedContext() {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return null;

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;
  return { supabase, userId: user.id };
}

function createLocalId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export async function createInterview(data: {
  userId?: string;
  jobRole: string;
  resumePath?: string;
  jdPath?: string;
  jdText?: string;
  extractedSkills: SkillExtractionResult;
  targetQuestions?: number;
}): Promise<Interview> {
  const targetQuestions = Math.max(5, Math.min(10, data.targetQuestions || 5));
  const context = await getAuthenticatedContext();

  if (context) {
    const { data: interview, error } = await context.supabase
      .from("interviews")
      .insert({
        user_id: context.userId,
        job_role: data.jobRole,
        resume_path: data.resumePath,
        jd_path: data.jdPath,
        jd_text: data.jdText,
        extracted_skills: data.extractedSkills,
        target_questions: targetQuestions,
        status: "in_progress",
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase insert interview error:", error);
      throw error;
    }

    return interview as Interview;
  }

  const id = createLocalId("caira");
  const newInterview: Interview = {
    id,
    user_id: data.userId || "demo-user",
    job_role: data.jobRole,
    resume_path: data.resumePath,
    jd_path: data.jdPath,
    jd_text: data.jdText,
    extracted_skills: data.extractedSkills,
    status: "in_progress",
    created_at: new Date().toISOString(),
    target_questions: targetQuestions,
    questions: [],
  };

  localStore.interviews.set(id, newInterview);
  localStore.questions.set(id, []);
  return newInterview;
}

export async function getInterviewById(id: string): Promise<Interview | null> {
  const context = await getAuthenticatedContext();

  if (context) {
    const { data: interview, error } = await context.supabase
      .from("interviews")
      .select("*, questions:interview_questions(*)")
      .eq("id", id)
      .single();

    if (error || !interview) return null;

    if (interview.questions) {
      interview.questions.sort(
        (a: InterviewQuestion, b: InterviewQuestion) => a.question_number - b.question_number
      );
    }

    return interview as Interview;
  }

  const found = localStore.interviews.get(id);
  if (!found) return null;

  const questions = localStore.questions.get(id) || [];
  return {
    ...found,
    questions: [...questions].sort((a, b) => a.question_number - b.question_number),
  };
}

export async function listInterviews(): Promise<Interview[]> {
  const context = await getAuthenticatedContext();

  if (context) {
    const { data, error } = await context.supabase
      .from("interviews")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []) as Interview[];
  }

  return Array.from(localStore.interviews.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export async function saveQuestion(data: {
  interviewId: string;
  questionNumber: number;
  questionText: string;
  questionType?: string;
  targetsSkill?: string;
}): Promise<InterviewQuestion> {
  const context = await getAuthenticatedContext();

  if (context) {
    const { data: question, error } = await context.supabase
      .from("interview_questions")
      .insert({
        interview_id: data.interviewId,
        question_number: data.questionNumber,
        question_text: data.questionText,
        question_type: data.questionType,
        targets_skill: data.targetsSkill,
      })
      .select()
      .single();

    if (error) throw error;
    return question as InterviewQuestion;
  }

  const question: InterviewQuestion = {
    id: createLocalId("q"),
    interview_id: data.interviewId,
    question_number: data.questionNumber,
    question_text: data.questionText,
    question_type: (data.questionType as InterviewQuestion["question_type"]) || "technical",
    targets_skill: data.targetsSkill,
    created_at: new Date().toISOString(),
  };

  const list = localStore.questions.get(data.interviewId) || [];
  list.push(question);
  localStore.questions.set(data.interviewId, list);
  return question;
}

export async function updateQuestionAnswer(data: {
  questionId: string;
  interviewId: string;
  answerText: string;
  score: number;
  evaluation: unknown;
}): Promise<void> {
  const context = await getAuthenticatedContext();

  if (context) {
    const { error } = await context.supabase
      .from("interview_questions")
      .update({
        answer_text: data.answerText,
        score: data.score,
        evaluation: data.evaluation,
      })
      .eq("id", data.questionId)
      .eq("interview_id", data.interviewId);

    if (error) throw error;
    return;
  }

  const list = localStore.questions.get(data.interviewId) || [];
  const question = list.find((item) => item.id === data.questionId);
  if (question) {
    question.answer_text = data.answerText;
    question.score = data.score;
    question.evaluation = data.evaluation as InterviewQuestion["evaluation"];
  }
}

export async function completeInterview(
  interviewId: string,
  overallScore: number,
  report: FinalReportData
): Promise<void> {
  const context = await getAuthenticatedContext();

  if (context) {
    const { error } = await context.supabase
      .from("interviews")
      .update({
        status: "completed",
        overall_score: overallScore,
        report,
        completed_at: new Date().toISOString(),
      })
      .eq("id", interviewId);

    if (error) throw error;
    return;
  }

  const interview = localStore.interviews.get(interviewId);
  if (interview) {
    interview.status = "completed";
    interview.overall_score = overallScore;
    interview.report = report;
    interview.completed_at = new Date().toISOString();
  }
}
