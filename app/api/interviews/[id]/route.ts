import { NextRequest, NextResponse } from "next/server";
import { getInterviewById } from "@/lib/supabase/service";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const interviewId = params.id;
    const interview = await getInterviewById(interviewId);

    if (!interview) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      interview,
    });
  } catch (error: any) {
    console.error("Error fetching interview:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch interview" },
      { status: 500 }
    );
  }
}
