import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

async function uploadToYouTube(post: any) {
  const videoRes = await fetch(post.video_url);
  const videoBuffer = new Uint8Array(await videoRes.arrayBuffer());

  const metadata = {
    snippet: {
      title: post.title.includes("#shorts") ? post.title : `${post.title} #shorts`,
      description: post.description.includes("#shorts")
        ? post.description
        : `${post.description} #shorts`,
      tags: ["shorts", "AI", "LinkAI"],
      categoryId: "22",
    },
    status: {
      privacyStatus: "private",
      selfDeclaredMadeForKids: false,
    },
  };

  const boundary = "foo_bar_baz";

  const body = new Uint8Array([
    ...new TextEncoder().encode(
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`
    ),
    ...new TextEncoder().encode(
      `--${boundary}\r\nContent-Type: video/mp4\r\n\r\n`
    ),
    ...videoBuffer,
    ...new TextEncoder().encode(`\r\n--${boundary}--`),
  ]);

  const res = await fetch(
    "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=multipart&part=snippet,status",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${post.access_token}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body,
    }
  );

  return await res.json();
}

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
        .update({ status: "uploading" })
        .eq("id", post.id);

      const result = await uploadToYouTube(post);

      if (result.id) {
        await supabaseAdmin
          .from("scheduled_posts")
          .update({
            status: "posted",
            youtube_video_id: result.id,
            error_message: null,
          })
          .eq("id", post.id);
      } else {
        await supabaseAdmin
          .from("scheduled_posts")
          .update({
            status: "failed",
            error_message: JSON.stringify(result),
          })
          .eq("id", post.id);
      }
    }

    return NextResponse.json({
      message: "Checked scheduled posts",
      count: posts?.length || 0,
    });
  } catch (err) {
    console.log("CRON ERROR:", err);
    return NextResponse.json({ error: "Cron error" }, { status: 500 });
  }
}