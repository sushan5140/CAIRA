import { NextRequest, NextResponse } from "next/server";
import { generateFinalReportWithGemini } from "@/lib/ai/gemini";
import { getInterviewById, completeInterview } from "@/lib/supabase/service";

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

    if (interview.status === "completed" && interview.report) {
      return NextResponse.json({
        success: true,
        report: interview.report,
        overall_score: interview.overall_score ?? interview.report.overall_score,
        reused: true,
      });
    }

    const questions = [...(interview.questions || [])].sort(
      (a, b) => a.question_number - b.question_number
    );
    const targetTotal = Math.max(5, Math.min(10, interview.target_questions || 5));
    const answered = questions.filter((q) => Boolean(q.answer_text?.trim()));

    if (questions.length < targetTotal || answered.length < targetTotal) {
      return NextResponse.json(
        {
          error: "Interview is not complete yet",
          answered: answered.length,
          required: targetTotal,
        },
        { status: 409 }
      );
    }

    const report = await generateFinalReportWithGemini(
      interview.job_role,
      interview.extracted_skills,
      questions.slice(0, targetTotal)
    );

    await completeInterview(interviewId, report.overall_score, report);

    return NextResponse.json({
      success: true,
      report,
      overall_score: report.overall_score,
    });
  } catch (error: unknown) {
    console.error("Error generating final report:", error);
    return NextResponse.json({ error: "Failed to generate final report" }, { status: 500 });
  }
}
