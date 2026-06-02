import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const maxDuration = 60;

const WORKER_ID = `instagram-worker-${Math.random()
  .toString(36)
  .slice(2, 8)}`;

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

async function unlockPost(postId: string) {
  await supabase
    .from("scheduled_posts")
    .update({
      locked_at: null,
      locked_by: null,
    })
    .eq("id", postId);
}

export async function GET() {
  const now = new Date().toISOString();

  const { data: posts, error } = await supabase
    .from("scheduled_posts")
    .select("*")
    .ilike("platform", "instagram")
    .in("status", ["scheduled", "uploading"])
    .lte("scheduled_time", now)
    .not("media_url", "is", null)
    .is("locked_at", null)
    .limit(1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!posts?.length) {
    return NextResponse.json({ message: "No Instagram posts ready." });
  }

  const post = posts[0];

  await logPost(post.id, "instagram", "started", "Instagram worker started.", {
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
    await logPost(post.id, "instagram", "lock_failed", "Failed to lock post.", {
      error: lockError.message,
    });

    return NextResponse.json({ error: "Failed to lock post." }, { status: 500 });
  }

  try {
    const { data: connection } = await supabase
      .from("social_connections")
      .select("*")
      .ilike("platform", "instagram")
      .eq("connected", true)
      .maybeSingle();

    if (!connection?.access_token || !connection?.instagram_account_id) {
      throw new Error("No connected Instagram account/token found.");
    }

    await logPost(
      post.id,
      "instagram",
      "creating_container",
      "Creating Instagram media container.",
      { media_url: post.media_url }
    );

    const containerRes = await fetch(
      `https://graph.facebook.com/v19.0/${connection.instagram_account_id}/media`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          media_type: "REELS",
          video_url: post.media_url,
          caption: post.caption || post.title || "",
          access_token: connection.access_token,
        }),
      }
    );

    const containerData = await containerRes.json();

    await logPost(
      post.id,
      "instagram",
      "container_response",
      "Instagram container response.",
      { containerData }
    );

    if (!containerData.id) {
      throw new Error(JSON.stringify(containerData));
    }

    const creationId = containerData.id;

    let containerReady = false;
    let attempts = 0;

    while (!containerReady && attempts < 10) {
      attempts++;

      await new Promise((resolve) => setTimeout(resolve, 5000));

      const statusRes = await fetch(
        `https://graph.facebook.com/v19.0/${creationId}?fields=status_code,status&access_token=${connection.access_token}`
      );

      const statusData = await statusRes.json();

      await logPost(
        post.id,
        "instagram",
        "processing_check",
        "Checking Instagram processing status.",
        statusData
      );

      if (
        statusData.status_code === "FINISHED" ||
        statusData.status === "FINISHED"
      ) {
        containerReady = true;
      }

      if (
        statusData.status_code === "ERROR" ||
        statusData.status === "ERROR"
      ) {
        throw new Error("Instagram processing failed.");
      }
    }

    if (!containerReady) {
      throw new Error("Instagram processing timed out.");
    }

    await logPost(
      post.id,
      "instagram",
      "publishing",
      "Publishing Instagram media.",
      { creation_id: creationId }
    );

    const publishRes = await fetch(
      `https://graph.facebook.com/v19.0/${connection.instagram_account_id}/media_publish`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          creation_id: creationId,
          access_token: connection.access_token,
        }),
      }
    );

    const publishData = await publishRes.json();

    await logPost(
      post.id,
      "instagram",
      "publish_response",
      "Instagram publish response.",
      { publishData }
    );

    if (!publishData.id) {
      throw new Error(JSON.stringify(publishData));
    }

    await supabase
      .from("scheduled_posts")
      .update({
        status: "posted",
        external_post_id: publishData.id,
        description: "Instagram upload completed.",
        last_error: null,
        locked_at: null,
        locked_by: null,
      })
      .eq("id", post.id);

    await logPost(post.id, "instagram", "posted", "Instagram upload completed.", {
      external_post_id: publishData.id,
    });

    return NextResponse.json({
      message: "Instagram post uploaded.",
      external_post_id: publishData.id,
    });
  } catch (err: any) {
    await supabase
      .from("scheduled_posts")
      .update({
        status: "failed",
        description: err.message || "Instagram publishing failed.",
        last_error: err.message || "Unknown Instagram error",
        locked_at: null,
        locked_by: null,
      })
      .eq("id", post.id);

    await logPost(post.id, "instagram", "failed", "Instagram publishing failed.", {
      error: err.message || "Unknown Instagram error",
    });

    await unlockPost(post.id);

    return NextResponse.json(
      { error: err.message || "Instagram publishing failed." },
      { status: 500 }
    );
  }
}