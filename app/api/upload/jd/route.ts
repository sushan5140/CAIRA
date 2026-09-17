import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No JD file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    let storagePath = fileName;

    const supabase = getSupabaseServerClient();
    if (supabase) {
      const { data, error } = await supabase.storage
        .from("job-descriptions")
        .upload(fileName, buffer, {
          contentType: file.type || "application/pdf",
          upsert: true,
        });

      if (!error && data) {
        storagePath = data.path;
      }
    }

    return NextResponse.json({
      success: true,
      fileName: file.name,
      storagePath,
    });
  } catch (error: any) {
    console.error("JD upload error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to upload JD" },
      { status: 500 }
    );
  }
}
