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

  await logPost(post.id, "tiktok", "started", "TikTok worker started.", {
    worker_id: WORKER_ID,
    scheduled_time: post.scheduled_time,
  });

  const { error: lockError } = await supabase
    .from("scheduled_posts")
    .update({
      locked_at: new Date().toISOString(),
      locked_by: WORKER_ID,
      status: "uploading",
      last_attempt_at: new Date().toISOString(),
    })
    .eq("id", post.id)
    .is("locked_at", null);

  if (lockError) {
    await logPost(post.id, "tiktok", "lock_failed", "Failed to lock post.", {
      error: lockError.message,
    });

    return NextResponse.json({ error: "Failed to lock post." }, { status: 500 });
  }

  await logPost(post.id, "tiktok", "locked", "Post locked for processing.", {
    worker_id: WORKER_ID,
  });

  const { data: connection } = await supabase
    .from("social_connections")
    .select("*")
    .ilike("platform", "tiktok")
    .eq("connected", true)
    .maybeSingle();

  if (!connection?.access_token) {
    await supabase
      .from("scheduled_posts")
      .update({
        status: "failed",
        description: "No connected TikTok access token found.",
        last_error: "No connected TikTok access token found.",
        locked_at: null,
        locked_by: null,
      })
      .eq("id", post.id);

    await logPost(
      post.id,
      "tiktok",
      "failed",
      "No connected TikTok access token found."
    );

    return NextResponse.json(
      { error: "No connected TikTok access token found." },
      { status: 400 }
    );
  }

  try {
    await logPost(post.id, "tiktok", "downloading", "Downloading video file.", {
      media_url: post.media_url,
    });

    const videoRes = await fetch(post.media_url);

    if (!videoRes.ok) {
      throw new Error("Could not download scheduled video file.");
    }

    const videoBuffer = Buffer.from(await videoRes.arrayBuffer());
    const videoSize = videoBuffer.length;

    await logPost(post.id, "tiktok", "downloaded", "Video downloaded.", {
      video_size: videoSize,
    });

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

    await logPost(post.id, "tiktok", "init_response", "TikTok init response.", {
      initData,
    });

    if (initData.error?.code !== "ok") {
      throw new Error(JSON.stringify(initData.error));
    }

    const uploadUrl = initData.data.upload_url;

    await logPost(post.id, "tiktok", "uploading", "Uploading video to TikTok.");

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
      throw new Error("TikTok video upload failed.");
    }

    await supabase
      .from("scheduled_posts")
      .update({
        status: "posted",
        external_post_id: initData.data.publish_id,
        description: "TikTok upload completed.",
        last_error: null,
        locked_at: null,
        locked_by: null,
      })
      .eq("id", post.id);

    await logPost(post.id, "tiktok", "posted", "TikTok upload completed.", {
      publish_id: initData.data.publish_id,
    });

    return NextResponse.json({
      message: "TikTok post uploaded.",
      publish_id: initData.data.publish_id,
    });
  } catch (err: any) {
    await supabase
      .from("scheduled_posts")
      .update({
        status: "failed",
        description: err.message || "TikTok publishing failed.",
        last_error: err.message || "Unknown TikTok error",
        locked_at: null,
        locked_by: null,
      })
      .eq("id", post.id);

    await logPost(post.id, "tiktok", "failed", "TikTok publishing failed.", {
      error: err.message || "Unknown TikTok error",
    });

    return NextResponse.json(
      { error: err.message || "TikTok publishing failed." },
      { status: 500 }
    );
  }
}