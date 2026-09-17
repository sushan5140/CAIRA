import { NextRequest, NextResponse } from "next/server";
import { extractSkillsWithGemini, generateQuestionWithGemini } from "@/lib/ai/gemini";
import { createInterview, saveQuestion } from "@/lib/supabase/service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { jobRole, jdText, resumeText, resumePdfBase64, targetQuestions = 5 } = body;

    if (!jobRole || typeof jobRole !== "string" || !jobRole.trim()) {
      return NextResponse.json({ error: "Job role is required" }, { status: 400 });
    }

    // 1. Extract required skills, nice-to-haves, seniority, and focus areas with Gemini
    const extractedSkills = await extractSkillsWithGemini(
      jobRole.trim(),
      jdText,
      resumeText,
      resumePdfBase64
    );

    // 2. Create the interview record
    const interview = await createInterview({
      jobRole: jobRole.trim(),
      jdText: jdText || undefined,
      extractedSkills,
      targetQuestions: Math.max(5, Math.min(10, Number(targetQuestions) || 5)),
    });

    // 3. Pre-generate Question 1
    const q1Result = await generateQuestionWithGemini(
      interview.job_role,
      extractedSkills,
      [],
      1,
      interview.target_questions || 5
    );

    const question1 = await saveQuestion({
      interviewId: interview.id,
      questionNumber: 1,
      questionText: q1Result.question,
      questionType: q1Result.question_type,
      targetsSkill: q1Result.targets_skill,
    });

    return NextResponse.json({
      success: true,
      interview: {
        ...interview,
        questions: [question1],
      },
      question: question1,
    });
  } catch (error: any) {
    console.error("Error in /api/interviews/create:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create interview and extract skills" },
      { status: 500 }
    );
  }
}
