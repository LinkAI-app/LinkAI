import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const maxDuration = 60;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const { data: posts, error } = await supabase
    .from("scheduled_posts")
    .select("*")
    .ilike("platform", "instagram")
    .eq("status", "processing")
    .not("external_post_id", "is", null);

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  if (!posts?.length) {
    return NextResponse.json({
      message: "No Instagram posts to sync.",
    });
  }

  const updatedPosts = [];

  for (const post of posts) {
    await supabase
      .from("scheduled_posts")
      .update({
        status: "posted",
        locked_at: null,
        locked_by: null,
        last_error: null,
        description: "Instagram post synced successfully.",
      })
      .eq("id", post.id);

    updatedPosts.push(post.id);
  }

  return NextResponse.json({
    message: "Instagram posts synced.",
    updatedPosts,
  });
}