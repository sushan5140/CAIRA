import { NextRequest, NextResponse } from "next/server";
import { evaluateAnswerWithGemini } from "@/lib/ai/gemini";
import { getInterviewById, updateQuestionAnswer } from "@/lib/supabase/service";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const interviewId = params.id;
    const body = await req.json();
    const { questionId, answerText } = body;

    if (!questionId || typeof answerText !== "string") {
      return NextResponse.json(
        { error: "Question ID and answer text are required" },
        { status: 400 }
      );
    }

    const interview = await getInterviewById(interviewId);
    if (!interview) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 });
    }

    const question = interview.questions?.find((q) => q.id === questionId);
    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    // Evaluate answer with Gemini
    const evaluation = await evaluateAnswerWithGemini(
      interview.job_role,
      question.question_text,
      answerText,
      question.targets_skill,
      interview.extracted_skills
    );

    // Persist answer and evaluation
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
  } catch (error: any) {
    console.error("Error evaluating answer:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to evaluate answer" },
      { status: 500 }
    );
  }
}
