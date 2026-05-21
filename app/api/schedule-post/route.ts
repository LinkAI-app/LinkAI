import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { platform, caption, media_url, scheduled_for } =
      await req.json();

    const { data, error } = await supabase
      .from("scheduled_posts")
      .insert({
        platform,
        caption,
        media_url,
        scheduled_for,
        status: "scheduled",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ post: data });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to schedule post" },
      { status: 500 }
    );
  }
}