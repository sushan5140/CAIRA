import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const MAX_FILE_BYTES = 10 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No JD file provided" }, { status: 400 });
    }

    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: "Job description must be 10MB or smaller" }, { status: 413 });
    }

    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    const isText = file.type === "text/plain" || file.name.toLowerCase().endsWith(".txt");
    if (!isPdf && !isText) {
      return NextResponse.json({ error: "Only PDF and TXT job descriptions are supported" }, { status: 415 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const generatedName = `${Date.now()}-${safeName}`;
    let storagePath: string | undefined;

    const supabase = await getSupabaseServerClient();
    if (supabase) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        storagePath = `${user.id}/${generatedName}`;
        const { error } = await supabase.storage
          .from("job-descriptions")
          .upload(storagePath, buffer, {
            contentType: isPdf ? "application/pdf" : "text/plain",
            upsert: false,
          });

        if (error) {
          console.error("JD storage upload failed:", error);
          return NextResponse.json({ error: "Failed to store job description securely" }, { status: 500 });
        }
      }
    }

    return NextResponse.json({
      success: true,
      fileName: file.name,
      fileSize: file.size,
      storagePath,
      base64: isPdf ? buffer.toString("base64") : undefined,
      text: isText ? buffer.toString("utf8") : undefined,
    });
  } catch (error: unknown) {
    console.error("JD upload error:", error);
    return NextResponse.json({ error: "Failed to upload job description" }, { status: 500 });
  }
}
