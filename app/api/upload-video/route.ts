import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const maxDuration = 60;

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

    const buffer = Buffer.from(await file.arrayBuffer());
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filePath = `${Date.now()}-${safeName}`;

    const { error } = await supabase.storage
      .from("scheduled-videos")
      .upload(filePath, buffer, {
        contentType: file.type || "video/mp4",
        upsert: true,
      });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data } = supabase.storage
      .from("scheduled-videos")
      .getPublicUrl(filePath);

    return NextResponse.json({ url: data.publicUrl });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Video upload failed." },
      { status: 500 }
    );
  }
}