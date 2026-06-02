import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const maxDuration = 60;

const WORKER_ID = `worker-${Math.random().toString(36).slice(2, 8)}`;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function logPost(
  postId: string,
  platform: string,
  status: string,
  message: string,
  metadata: any = {}
) {
  await supabase.from("post_logs").insert({
    post_id: postId,
    platform,
    status,
    message,
    metadata,
  });
}

export async function GET() {
  const now = new Date().toISOString();

  const { data: posts, error } = await supabase
    .from("scheduled_posts")
    .select("*")
    .ilike("platform", "tiktok")
    .in("status", ["scheduled", "uploading"])
    .lte("scheduled_time", now)
    .not("media_url", "is", null)
    .is("locked_at", null)
    .limit(1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!posts?.length) {
    return NextResponse.json({ message: "No TikTok posts ready." });
  }

  const post = posts[0];

  await supabase
    .from("scheduled_posts")
    .update({
      status: "awaiting_tiktok_approval",
      description: "TikTok publishing is pending Content Posting API approval.",
      last_error: "Waiting for TikTok video.publish approval.",
      locked_at: null,
      locked_by: null,
    })
    .eq("id", post.id);

  await logPost(
    post.id,
    "tiktok",
    "awaiting_tiktok_approval",
    "TikTok publishing skipped until video.publish is approved.",
    { worker_id: WORKER_ID }
  );

  return NextResponse.json({
    message: "TikTok publishing is pending Content Posting API approval.",
    post_id: post.id,
  });
}