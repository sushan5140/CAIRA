import { NextRequest, NextResponse } from "next/server";
import { generateFinalReportWithGemini } from "@/lib/ai/gemini";
import { getInterviewById, completeInterview } from "@/lib/supabase/service";

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
    if (questions.length === 0) {
      return NextResponse.json(
        { error: "Cannot generate report for interview with no questions" },
        { status: 400 }
      );
    }

    // Call Gemini to synthesize full interview report
    const report = await generateFinalReportWithGemini(
      interview.job_role,
      interview.extracted_skills,
      questions
    );

    // Save report & mark interview completed
    await completeInterview(interviewId, report.overall_score, report);

    return NextResponse.json({
      success: true,
      report,
      overall_score: report.overall_score,
    });
  } catch (error: any) {
    console.error("Error generating final report:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate final report" },
      { status: 500 }
    );
  }
}
