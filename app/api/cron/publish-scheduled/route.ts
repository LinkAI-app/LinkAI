import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const now = new Date().toISOString();

  const { data: posts, error } = await supabase
    .from("scheduled_posts")
    .select("*")
    .eq("status", "scheduled")
    .lte("scheduled_time", now)
    .limit(10);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!posts || posts.length === 0) {
    return NextResponse.json({
      message: "No scheduled posts ready to publish.",
      checked_at: now,
    });
  }

  for (const post of posts) {
    await supabase
      .from("scheduled_posts")
      .update({
        status: "uploading",
      })
      .eq("id", post.id);

    // Actual platform publishing will be added next.
    await supabase
      .from("scheduled_posts")
      .update({
        status: "posted",
      })
      .eq("id", post.id);
  }

  return NextResponse.json({
    message: "Scheduled posts processed.",
    count: posts.length,
  });
}