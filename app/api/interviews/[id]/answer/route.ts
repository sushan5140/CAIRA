import { NextRequest, NextResponse } from "next/server";
import { evaluateAnswerWithGemini } from "@/lib/ai/gemini";
import { getInterviewById, updateQuestionAnswer } from "@/lib/supabase/service";

const MAX_ANSWER_CHARS = 12000;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: interviewId } = await params;
    const body = await req.json();
    const questionId = typeof body.questionId === "string" ? body.questionId : "";
    const answerText = typeof body.answerText === "string" ? body.answerText.trim() : "";

    if (!questionId || !answerText) {
      return NextResponse.json(
        { error: "Question ID and a non-empty answer are required" },
        { status: 400 }
      );
    }

    if (answerText.length > MAX_ANSWER_CHARS) {
      return NextResponse.json(
        { error: `Answer is too long. Maximum length is ${MAX_ANSWER_CHARS} characters.` },
        { status: 413 }
      );
    }

    const interview = await getInterviewById(interviewId);
    if (!interview) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 });
    }

    if (interview.status !== "in_progress") {
      return NextResponse.json({ error: "This interview is already closed" }, { status: 409 });
    }

    const question = interview.questions?.find((q) => q.id === questionId);
    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    // Make retries idempotent: if this turn was already evaluated, return the
    // stored result instead of invoking Gemini and charging twice.
    if (question.answer_text && question.evaluation) {
      return NextResponse.json({
        success: true,
        score: question.score,
        evaluation: question.evaluation,
        reused: true,
      });
    }

    const evaluation = await evaluateAnswerWithGemini(
      interview.job_role,
      question.question_text,
      answerText,
      question.targets_skill,
      interview.extracted_skills
    );

    await updateQuestionAnswer({
      questionId,
      interviewId,
      answerText,
      score: evaluation.score,
      evaluation,
    });

    return NextResponse.json({
      success: true,
      score: evaluation.score,
      evaluation,
    });
  } catch (error: unknown) {
    console.error("Error evaluating answer:", error);
    return NextResponse.json({ error: "Failed to evaluate answer" }, { status: 500 });
  }
}
