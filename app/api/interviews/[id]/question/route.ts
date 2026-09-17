import { NextRequest, NextResponse } from "next/server";
import { generateQuestionWithGemini } from "@/lib/ai/gemini";
import { getInterviewById, saveQuestion } from "@/lib/supabase/service";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const interviewId = params.id;
    const interview = await getInterviewById(interviewId);

    if (!interview) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 });
    }

    const questions = interview.questions || [];
    const nextQuestionNumber = questions.length + 1;
    const targetTotal = interview.target_questions || 5;

    if (nextQuestionNumber > targetTotal) {
      return NextResponse.json({
        completed: true,
        message: "Target number of questions reached",
      });
    }

    // Format Q&A history for context
    const qaHistory = questions.map((q) => ({
      question: q.question_text,
      answer: q.answer_text,
      evaluation: q.evaluation,
    }));

    // Generate adaptive question with Gemini
    const result = await generateQuestionWithGemini(
      interview.job_role,
      interview.extracted_skills,
      qaHistory,
      nextQuestionNumber,
      targetTotal
    );

    const newQuestion = await saveQuestion({
      interviewId,
      questionNumber: nextQuestionNumber,
      questionText: result.question,
      questionType: result.question_type,
      targetsSkill: result.targets_skill,
    });

    return NextResponse.json({
      success: true,
      question: newQuestion,
    });
  } catch (error: any) {
    console.error("Error generating question:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate next question" },
      { status: 500 }
    );
  }
}
