import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_VIDEO_SIZE_MB = 250;
const MAX_VIDEO_SIZE_BYTES = MAX_VIDEO_SIZE_MB * 1024 * 1024;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("video") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No video uploaded." }, { status: 400 });
    }

    if (!file.type.startsWith("video/")) {
      return NextResponse.json(
        { error: "Please upload a valid video file." },
        { status: 400 }
      );
    }

    if (file.size > MAX_VIDEO_SIZE_BYTES) {
      return NextResponse.json(
        {
          error: `Video is too large. Maximum allowed size is ${MAX_VIDEO_SIZE_MB}MB.`,
        },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const extension = file.name.split(".").pop() || "mp4";
    const safeName = file.name
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-zA-Z0-9-_]/g, "_")
      .slice(0, 80);

    const filePath = `${Date.now()}-${crypto.randomUUID()}-${safeName}.${extension}`;

    const { error } = await supabase.storage
      .from("scheduled-videos")
      .upload(filePath, buffer, {
        contentType: file.type || "video/mp4",
        upsert: false,
      });

    if (error) {
      return NextResponse.json(
        { error: `Supabase upload failed: ${error.message}` },
        { status: 500 }
      );
    }

    const { data } = supabase.storage
      .from("scheduled-videos")
      .getPublicUrl(filePath);

    return NextResponse.json({
      url: data.publicUrl,
      fileName: file.name,
      size: file.size,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error:
          error.message ||
          "Video upload failed. Try a smaller MP4 file or re-export the video.",
      },
      { status: 500 }
    );
  }
}