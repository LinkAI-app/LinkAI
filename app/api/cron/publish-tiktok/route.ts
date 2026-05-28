import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const maxDuration = 60;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const now = new Date().toISOString();

  const { data: posts, error } = await supabase
    .from("scheduled_posts")
    .select("*")
    .ilike("platform", "tiktok")
    .eq("status", "scheduled")
    .lte("scheduled_time", now)
    .limit(1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (!posts?.length) {
    return NextResponse.json({ message: "No TikTok posts ready." });
  }

  const post = posts[0];

  const videoUrl = post.media_url || post.video_url;

  if (!videoUrl) {
    await supabase
      .from("scheduled_posts")
      .update({ status: "failed" })
      .eq("id", post.id);

    return NextResponse.json(
      { error: "No video URL found for this scheduled post." },
      { status: 400 }
    );
  }

  const { data: connection } = await supabase
    .from("social_connections")
    .select("*")
    .ilike("platform", "tiktok")
    .eq("connected", true)
    .maybeSingle();

  if (!connection?.access_token) {
    await supabase
      .from("scheduled_posts")
      .update({ status: "failed" })
      .eq("id", post.id);

    return NextResponse.json(
      { error: "No connected TikTok access token found." },
      { status: 400 }
    );
  }

  await supabase
    .from("scheduled_posts")
    .update({ status: "uploading" })
    .eq("id", post.id);

  const videoRes = await fetch(videoUrl);

  if (!videoRes.ok) {
    await supabase
      .from("scheduled_posts")
      .update({ status: "failed" })
      .eq("id", post.id);

    return NextResponse.json(
      { error: "Could not download scheduled video file." },
      { status: 500 }
    );
  }

  const videoBuffer = Buffer.from(await videoRes.arrayBuffer());
  const videoSize = videoBuffer.length;

  const initRes = await fetch(
    "https://open.tiktokapis.com/v2/post/publish/video/init/",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${connection.access_token}`,
        "Content-Type": "application/json; charset=UTF-8",
      },
      body: JSON.stringify({
        post_info: {
          title: post.caption || post.title || "Scheduled video",
          privacy_level: "SELF_ONLY",
          disable_duet: false,
          disable_comment: false,
          disable_stitch: false,
          video_cover_timestamp_ms: 1000,
        },
        source_info: {
          source: "FILE_UPLOAD",
          video_size: videoSize,
          chunk_size: videoSize,
          total_chunk_count: 1,
        },
      }),
    }
  );

  const initData = await initRes.json();

  if (initData.error?.code !== "ok") {
    await supabase
      .from("scheduled_posts")
      .update({ status: "failed" })
      .eq("id", post.id);

    return NextResponse.json({ error: initData.error }, { status: 500 });
  }

  const uploadUrl = initData.data.upload_url;

  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": "video/mp4",
      "Content-Length": String(videoSize),
      "Content-Range": `bytes 0-${videoSize - 1}/${videoSize}`,
    },
    body: videoBuffer,
  });

  if (!uploadRes.ok) {
    await supabase
      .from("scheduled_posts")
      .update({ status: "failed" })
      .eq("id", post.id);

    return NextResponse.json(
      { error: "TikTok video upload failed." },
      { status: 500 }
    );
  }

  await supabase
    .from("scheduled_posts")
    .update({
      status: "posted",
      external_post_id: initData.data.publish_id,
    })
    .eq("id", post.id);

  return NextResponse.json({
    message: "TikTok post uploaded.",
    publish_id: initData.data.publish_id,
  });
}