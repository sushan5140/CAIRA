import { getSupabaseServerClient } from "./server";
import type { Interview, InterviewQuestion, FinalReportData, SkillExtractionResult } from "@/types/interview";

// Local in-memory mock store for offline/demo operation when Supabase keys are not provided
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

// Seed sample past interview in local store for immediate dashboard delight
const sampleId = "caira-sample-101";
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
    summary: "Demonstrated strong grasp of end-to-end full-stack systems, architectural trade-offs, and micro-frontend state management.",
    top_strengths: [
      "Clear explanation of server vs. client rendering performance trade-offs.",
      "Effective use of the STAR method when recounting production incident debugging.",
      "Mature collaborative mindset with product and junior engineering peers.",
    ],
    key_gaps: [
      "Could elaborate more on automated chaos testing and resiliency fallbacks.",
      "Add quantitative metrics (e.g., latency reduction % or throughput figures) to answers.",
    ],
    recommendation: "Strong Hire for Senior Full-Stack Engineering roles.",
    per_skill_breakdown: [
      { skill: "System Architecture", score: 90, notes: "Excellent grasp of distributed caching and DB indexing." },
      { skill: "Frontend Engineering", score: 92, notes: "Deep understanding of Next.js hydration and state management." },
      { skill: "Incident Management", score: 84, notes: "Solid debugging methodology under live production outages." },
      { skill: "Behavioral & STAR", score: 86, notes: "Clear structure and good ownership articulation." },
    ],
  },
});

localStore.questions.set(sampleId, [
  {
    id: "q-1",
    interview_id: sampleId,
    question_number: 1,
    question_text: "Can you describe the architecture of a high-traffic web application you built, and how you balanced SSR vs CSR?",
    question_type: "technical",
    targets_skill: "System Architecture",
    answer_text: "In my previous role, we redesigned our e-commerce platform using Next.js App Router. We utilized Server Components for SEO-critical catalog pages with Redis caching, and client components for dynamic carts and checkout. This reduced our TTFB by 42%.",
    score: 9,
    evaluation: {
      score: 9,
      strengths: ["Clear architectural context", "Included quantifiable metrics (42% TTFB reduction)", "Good breakdown of SSR vs CSR"],
      gaps: ["Could mention edge caching strategies"],
      feedback: "Outstanding opening answer with concrete tech stack and metrics.",
    },
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "q-2",
    interview_id: sampleId,
    question_number: 2,
    question_text: "Tell me about a time a critical database migration failed in production. How did you handle recovery?",
    question_type: "situational",
    targets_skill: "Incident Management",
    answer_text: "We had a lock acquisition timeout on Postgres during a peak shopping hour. We immediately engaged the failover read replica, aborted the migration lock, rolled back via expand/contract schema patterns, and executed it later during off-peak with zero data loss.",
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

export async function createInterview(data: {
  userId?: string;
  jobRole: string;
  resumePath?: string;
  jdPath?: string;
  jdText?: string;
  extractedSkills: SkillExtractionResult;
  targetQuestions?: number;
}): Promise<Interview> {
  const supabase = getSupabaseServerClient();
  const targetQuestions = data.targetQuestions || 5;

  if (supabase) {
    const { data: interview, error } = await supabase
      .from("interviews")
      .insert({
        user_id: data.userId || (await supabase.auth.getUser()).data.user?.id,
        job_role: data.jobRole,
        resume_path: data.resumePath,
        jd_path: data.jdPath,
        jd_text: data.jdText,
        extracted_skills: data.extractedSkills,
        status: "in_progress",
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase insert interview error:", error);
      throw error;
    }

    return {
      ...interview,
      target_questions: targetQuestions,
    };
  }

  // Fallback / Mock
  const id = "caira-" + Math.random().toString(36).substring(2, 9);
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
  const supabase = getSupabaseServerClient();

  if (supabase) {
    const { data: interview, error } = await supabase
      .from("interviews")
      .select(`*, questions:interview_questions(*)`)
      .eq("id", id)
      .single();

    if (error) {
      console.warn("Supabase fetch error for interview:", error.message);
      return localStore.interviews.get(id) || null;
    }

    // Sort questions by question_number
    if (interview && interview.questions) {
      interview.questions.sort((a: any, b: any) => a.question_number - b.question_number);
    }
    return interview;
  }

  const found = localStore.interviews.get(id);
  if (!found) {
    // Generate a fallback active interview session so direct links or refreshed sessions work seamlessly
    const fallbackInterview: Interview = {
      id,
      user_id: "demo-user",
      job_role: "Senior Full-Stack Engineer",
      jd_text: "Senior engineering role focusing on modern system architecture, frontend performance, and resilient APIs.",
      extracted_skills: {
        required_skills: ["Next.js & React", "TypeScript", "System Architecture", "API Design (REST/GraphQL)", "Database Modeling"],
        nice_to_have_skills: ["Microservices", "Docker", "Observability"],
        seniority_level: "Senior",
        key_focus_areas: ["System Architecture", "Clean Code & Refactoring", "Technical Communication under Pressure"],
      },
      status: "in_progress",
      created_at: new Date().toISOString(),
      target_questions: 5,
      questions: [],
    };
    localStore.interviews.set(id, fallbackInterview);

    const initialQ: InterviewQuestion = {
      id: "q-" + id + "-1",
      interview_id: id,
      question_number: 1,
      question_text: "Welcome! To kick off our mock interview for the Senior Full-Stack Engineer role, could you walk me through a recent project you led or contributed heavily to, focusing on the technical architecture decisions and trade-offs you made?",
      question_type: "technical",
      targets_skill: "System Architecture",
      created_at: new Date().toISOString(),
    };
    localStore.questions.set(id, [initialQ]);

    return {
      ...fallbackInterview,
      questions: [initialQ],
    };
  }

  const questions = localStore.questions.get(id) || [];
  return {
    ...found,
    questions: [...questions].sort((a, b) => a.question_number - b.question_number),
  };
}

export async function listInterviews(userId?: string): Promise<Interview[]> {
  const supabase = getSupabaseServerClient();

  if (supabase) {
    let query = supabase.from("interviews").select(`*`).order("created_at", { ascending: false });
    if (userId) {
      query = query.eq("user_id", userId);
    }
    const { data, error } = await query;
    if (!error && data) {
      return data;
    }
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
  const supabase = getSupabaseServerClient();

  if (supabase) {
    const { data: question, error } = await supabase
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

    if (error) {
      console.error("Supabase question insert error:", error);
      throw error;
    }
    return question;
  }

  const q: InterviewQuestion = {
    id: "q-" + Math.random().toString(36).substring(2, 9),
    interview_id: data.interviewId,
    question_number: data.questionNumber,
    question_text: data.questionText,
    question_type: (data.questionType as any) || "technical",
    targets_skill: data.targetsSkill,
    created_at: new Date().toISOString(),
  };

  const list = localStore.questions.get(data.interviewId) || [];
  list.push(q);
  localStore.questions.set(data.interviewId, list);
  return q;
}

export async function updateQuestionAnswer(data: {
  questionId: string;
  interviewId: string;
  answerText: string;
  score: number;
  evaluation: any;
}): Promise<void> {
  const supabase = getSupabaseServerClient();

  if (supabase) {
    await supabase
      .from("interview_questions")
      .update({
        answer_text: data.answerText,
        score: data.score,
        evaluation: data.evaluation,
      })
      .eq("id", data.questionId);
    return;
  }

  const list = localStore.questions.get(data.interviewId) || [];
  const q = list.find((item) => item.id === data.questionId);
  if (q) {
    q.answer_text = data.answerText;
    q.score = data.score;
    q.evaluation = data.evaluation;
  }
}

export async function completeInterview(
  interviewId: string,
  overallScore: number,
  report: FinalReportData
): Promise<void> {
  const supabase = getSupabaseServerClient();

  if (supabase) {
    await supabase
      .from("interviews")
      .update({
        status: "completed",
        overall_score: overallScore,
        report: report,
        completed_at: new Date().toISOString(),
      })
      .eq("id", interviewId);
    return;
  }

  const intv = localStore.interviews.get(interviewId);
  if (intv) {
    intv.status = "completed";
    intv.overall_score = overallScore;
    intv.report = report;
    intv.completed_at = new Date().toISOString();
  }
}
