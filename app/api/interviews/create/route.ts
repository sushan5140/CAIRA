import { NextRequest, NextResponse } from "next/server";
import { extractSkillsWithGemini, generateQuestionWithGemini } from "@/lib/ai/gemini";
import { createInterview, saveQuestion } from "@/lib/supabase/service";

const MAX_ROLE_CHARS = 160;
const MAX_TEXT_CHARS = 40000;
const MAX_BASE64_CHARS = 14_000_000;
const MAX_PATH_CHARS = 1024;

function optionalText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (trimmed.length > maxLength) throw new Error("INPUT_TOO_LARGE");
  return trimmed;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const jobRole = typeof body.jobRole === "string" ? body.jobRole.trim() : "";

    if (!jobRole) {
      return NextResponse.json({ error: "Job role is required" }, { status: 400 });
    }

    if (jobRole.length > MAX_ROLE_CHARS) {
      return NextResponse.json({ error: "Job role is too long" }, { status: 413 });
    }

    const jdText = optionalText(body.jdText, MAX_TEXT_CHARS);
    const resumeText = optionalText(body.resumeText, MAX_TEXT_CHARS);
    const resumePdfBase64 = optionalText(body.resumePdfBase64, MAX_BASE64_CHARS);
    const resumePath = optionalText(body.resumePath, MAX_PATH_CHARS);
    const jdPath = optionalText(body.jdPath, MAX_PATH_CHARS);
    const parsedTarget = Number(body.targetQuestions);
    const targetQuestions = Number.isFinite(parsedTarget)
      ? Math.max(5, Math.min(10, Math.round(parsedTarget)))
      : 5;

    const extractedSkills = await extractSkillsWithGemini(
      jobRole,
      jdText,
      resumeText,
      resumePdfBase64
    );

    const interview = await createInterview({
      jobRole,
      jdText,
      resumePath,
      jdPath,
      extractedSkills,
      targetQuestions,
    });

    const q1Result = await generateQuestionWithGemini(
      interview.job_role,
      extractedSkills,
      [],
      1,
      interview.target_questions || targetQuestions
    );

    const question1 = await saveQuestion({
      interviewId: interview.id,
      questionNumber: 1,
      questionText: q1Result.question,
      questionType: q1Result.question_type,
      targetsSkill: q1Result.targets_skill,
    });

    const hydratedInterview = { ...interview, questions: [question1] };

    return NextResponse.json({
      success: true,
      interview: hydratedInterview,
      question: question1,
      persistence: interview.id.startsWith("caira-") ? "local" : "server",
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "INPUT_TOO_LARGE") {
      return NextResponse.json(
        { error: "Resume or job-description input is too large" },
        { status: 413 }
      );
    }

    console.error("Error in /api/interviews/create:", error);
    return NextResponse.json(
      { error: "Failed to create interview and extract skills" },
      { status: 500 }
    );
  }
}
