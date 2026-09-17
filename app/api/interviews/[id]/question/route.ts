import { NextRequest, NextResponse } from "next/server";
import { generateQuestionWithGemini } from "@/lib/ai/gemini";
import { getInterviewById, saveQuestion } from "@/lib/supabase/service";
import type { Interview, InterviewQuestion } from "@/types/interview";

function getGuestInterview(value: unknown, interviewId: string): Interview | null {
  if (!interviewId.startsWith("caira-") || !value || typeof value !== "object") return null;
  const candidate = value as Interview;
  return candidate.id === interviewId ? candidate : null;
}

function createGuestQuestion(data: {
  interviewId: string;
  questionNumber: number;
  questionText: string;
  questionType: InterviewQuestion["question_type"];
  targetsSkill?: string;
}): InterviewQuestion {
  return {
    id: `q-local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    interview_id: data.interviewId,
    question_number: data.questionNumber,
    question_text: data.questionText,
    question_type: data.questionType,
    targets_skill: data.targetsSkill,
    created_at: new Date().toISOString(),
  };
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: interviewId } = await params;
    const body = await req.json().catch(() => ({}));
    const guestInterview = getGuestInterview(body.localInterview, interviewId);
    const serverInterview = guestInterview ? null : await getInterviewById(interviewId);
    const interview = guestInterview || serverInterview;
    const isGuestFallback = Boolean(guestInterview);

    if (!interview) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 });
    }

    if (interview.status !== "in_progress") {
      return NextResponse.json({ completed: true, message: "Interview is already closed" });
    }

    const questions = [...(interview.questions || [])].sort(
      (a, b) => a.question_number - b.question_number
    );
    const targetTotal = Math.max(5, Math.min(10, interview.target_questions || 5));

    const existingUnanswered = questions.find((q) => !q.answer_text);
    if (existingUnanswered) {
      return NextResponse.json({ success: true, question: existingUnanswered, reused: true });
    }

    const nextQuestionNumber = questions.length + 1;
    if (nextQuestionNumber > targetTotal) {
      return NextResponse.json({
        completed: true,
        message: "Target number of questions reached",
      });
    }

    const qaHistory = questions.map((q) => ({
      question: q.question_text,
      answer: q.answer_text,
      evaluation: q.evaluation,
    }));

    const result = await generateQuestionWithGemini(
      interview.job_role,
      interview.extracted_skills,
      qaHistory,
      nextQuestionNumber,
      targetTotal
    );

    const newQuestion = isGuestFallback
      ? createGuestQuestion({
          interviewId,
          questionNumber: nextQuestionNumber,
          questionText: result.question,
          questionType: result.question_type,
          targetsSkill: result.targets_skill,
        })
      : await saveQuestion({
          interviewId,
          questionNumber: nextQuestionNumber,
          questionText: result.question,
          questionType: result.question_type,
          targetsSkill: result.targets_skill,
        });

    return NextResponse.json({ success: true, question: newQuestion });
  } catch (error: unknown) {
    console.error("Error generating question:", error);
    return NextResponse.json({ error: "Failed to generate next question" }, { status: 500 });
  }
}
