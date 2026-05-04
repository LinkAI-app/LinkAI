import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  try {
    const now = new Date().toISOString();

    const { data: posts, error } = await supabaseAdmin
      .from("scheduled_posts")
      .select("*")
      .eq("status", "scheduled")
      .lte("scheduled_time", now);

    if (error) {
      return NextResponse.json({ error: error.message });
    }

    for (const post of posts || []) {
      await supabaseAdmin
        .from("scheduled_posts")
        .update({ status: "posted" })
        .eq("id", post.id);
    }

    return NextResponse.json({
      message: "Checked scheduled posts",
      count: posts?.length || 0,
    });
  } catch (err) {
    return NextResponse.json({ error: "Cron error" });
  }
}