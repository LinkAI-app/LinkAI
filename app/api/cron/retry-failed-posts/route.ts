import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const { data: posts, error } = await supabase
    .from("scheduled_posts")
    .select("*")
    .eq("status", "failed")
    .lt("retry_count", 3)
    .limit(10);

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  if (!posts?.length) {
    return NextResponse.json({
      message: "No failed posts ready for retry.",
    });
  }

  const retried = [];

  for (const post of posts) {
    const nextRetryCount = (post.retry_count || 0) + 1;

    await supabase
      .from("scheduled_posts")
      .update({
        status: "scheduled",
        retry_count: nextRetryCount,
        last_attempt_at: new Date().toISOString(),
        last_error: null,
      })
      .eq("id", post.id);

    retried.push({
      id: post.id,
      platform: post.platform,
      retry_count: nextRetryCount,
    });
  }

  return NextResponse.json({
    message: "Failed posts reset for retry.",
    retried,
  });
}