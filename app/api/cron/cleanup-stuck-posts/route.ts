import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const cutoff = new Date(Date.now() - 15 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("scheduled_posts")
    .update({
      status: "failed",
      description:
        "Upload timed out or got stuck. Please try scheduling again.",
    })
    .eq("status", "uploading")
    .lte("scheduled_time", cutoff)
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    message: "Cleanup complete.",
    updated: data?.length || 0,
    posts: data || [],
  });
}