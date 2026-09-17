import { NextRequest, NextResponse } from "next/server";
import { listInterviews } from "@/lib/supabase/service";

export async function GET(req: NextRequest) {
  try {
    const interviews = await listInterviews();
    return NextResponse.json({
      success: true,
      interviews,
    });
  } catch (error: any) {
    console.error("Error listing interviews:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to list interviews" },
      { status: 500 }
    );
  }
}
