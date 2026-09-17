import { NextRequest, NextResponse } from "next/server";
import { generateQuestionWithGemini } from "@/lib/ai/gemini";
import { getInterviewById, saveQuestion } from "@/lib/supabase/service";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const interviewId = params.id;
    const interview = await getInterviewById(interviewId);

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

    // If a previous request already created the next turn, reuse it instead of
    // creating a duplicate question during retries/double clicks.
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

    const newQuestion = await saveQuestion({
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
