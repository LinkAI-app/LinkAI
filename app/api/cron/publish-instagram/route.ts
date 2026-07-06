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
  try {
    await supabase.from("post_logs").insert({
      post_id: postId,
      platform,
      status,
      message,
      metadata,
    });
  } catch (error) {
    console.error("Log failed:", error);
  }
}

async function updatePost(
  postId: string,
  values: Record<string, any>,
  label: string
) {
  const { data, error } = await supabase
    .from("scheduled_posts")
    .update(values)
    .eq("id", postId)
    .select("*")
    .maybeSingle();

  await logPost(postId, "instagram", `${label}_result`, `${label} result.`, {
    data,
    error: error?.message || null,
  });

  if (error) throw new Error(error.message);
  return data;
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 15000
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET() {
  const now = new Date().toISOString();

  const { data: posts, error } = await supabase
    .from("scheduled_posts")
    .select("*")
    .ilike("platform", "instagram")
    .in("status", ["scheduled", "processing"])
    .lte("scheduled_time", now)
    .not("media_url", "is", null)
    .is("locked_at", null)
    .order("scheduled_time", { ascending: true })
    .limit(1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!posts?.length)
    return NextResponse.json({ message: "No Instagram posts ready." });

  const post = posts[0];

  await logPost(post.id, "instagram", "started", "Instagram worker started.", {
    worker_id: WORKER_ID,
    scheduled_time: post.scheduled_time,
    user_id: post.user_id,
    user_email: post.user_email,
  });

  const { data: lockedPost, error: lockError } = await supabase
    .from("scheduled_posts")
    .update({
      locked_at: new Date().toISOString(),
      locked_by: WORKER_ID,
      status: "processing",
      last_attempt_at: new Date().toISOString(),
    })
    .eq("id", post.id)
    .is("locked_at", null)
    .select("*")
    .maybeSingle();

  if (lockError || !lockedPost) {
    await logPost(post.id, "instagram", "lock_failed", "Failed to lock post.", {
      error: lockError?.message || "No row locked",
    });

    return NextResponse.json({ error: "Failed to lock post." }, { status: 500 });
  }

  try {
    let connectionQuery = supabase
      .from("social_connections")
      .select("*")
      .ilike("platform", "instagram")
      .eq("connected", true);

    if (post.user_id) {
      connectionQuery = connectionQuery.eq("user_id", post.user_id);
    }

    const { data: connection, error: connectionError } =
      await connectionQuery.maybeSingle();

    await logPost(
      post.id,
      "instagram",
      "connection_checked",
      "Instagram connection checked.",
      {
        has_connection: !!connection,
        has_token: !!connection?.access_token,
        has_instagram_account_id: !!connection?.instagram_account_id,
        connection_user_id: connection?.user_id || null,
        post_user_id: post.user_id || null,
        error: connectionError?.message || null,
      }
    );

    if (connectionError) throw new Error(connectionError.message);

    if (!connection?.access_token || !connection?.instagram_account_id) {
      throw new Error("No connected Instagram account/token found for this user.");
    }

    let creationId = post.external_post_id || null;

    if (!creationId) {
      await logPost(
        post.id,
        "instagram",
        "creating_container",
        "Creating Instagram media container.",
        { media_url: post.media_url }
      );

      const containerRes = await fetchWithTimeout(
        `https://graph.facebook.com/v19.0/${connection.instagram_account_id}/media`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            media_type: "REELS",
            video_url: post.media_url,
            caption: post.caption || post.title || "",
            access_token: connection.access_token,
          }),
        },
        15000
      );

      const containerData = await containerRes.json();

      await logPost(
        post.id,
        "instagram",
        "container_response",
        "Instagram container response.",
        { containerData }
      );

      if (!containerData.id) throw new Error(JSON.stringify(containerData));

      creationId = containerData.id;

      await updatePost(
        post.id,
        {
          status: "processing",
          external_post_id: creationId,
          description: "Instagram container created. Processing video.",
          last_error: null,
          locked_at: null,
          locked_by: null,
        },
        "save_creation_id"
      );

      return NextResponse.json({
        message: "Instagram container created. Will check processing next run.",
        creation_id: creationId,
      });
    }

    await logPost(
      post.id,
      "instagram",
      "checking_existing_container",
      "Checking existing Instagram container.",
      { creation_id: creationId }
    );

    const statusRes = await fetchWithTimeout(
      `https://graph.facebook.com/v19.0/${creationId}?fields=status_code,status&access_token=${connection.access_token}`,
      {},
      15000
    );

    const statusData = await statusRes.json();

    await logPost(
      post.id,
      "instagram",
      "processing_check",
      "Checking Instagram processing status.",
      statusData
    );

    if (statusData.status_code === "ERROR" || statusData.status === "ERROR") {
      throw new Error("Instagram processing failed.");
    }

    if (
      statusData.status_code !== "FINISHED" &&
      statusData.status !== "FINISHED"
    ) {
      await updatePost(
        post.id,
        {
          status: "processing",
          description: "Instagram still processing. Will retry automatically.",
          last_error: null,
          locked_at: null,
          locked_by: null,
        },
        "still_processing"
      );

      return NextResponse.json({
        message: "Instagram still processing. Will retry automatically.",
        statusData,
      });
    }

    await logPost(post.id, "instagram", "publishing", "Publishing Instagram media.", {
      creation_id: creationId,
    });

    const publishRes = await fetchWithTimeout(
      `https://graph.facebook.com/v19.0/${connection.instagram_account_id}/media_publish`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creation_id: creationId,
          access_token: connection.access_token,
        }),
      },
      15000
    );

    const publishData = await publishRes.json();

    await logPost(
      post.id,
      "instagram",
      "publish_response",
      "Instagram publish response.",
      { publishData }
    );

    if (!publishData.id) throw new Error(JSON.stringify(publishData));

    const updatedPost = await updatePost(
      post.id,
      {
        status: "posted",
        external_post_id: publishData.id,
        description: "Instagram upload completed.",
        last_error: null,
        locked_at: null,
        locked_by: null,
      },
      "mark_posted"
    );

    await logPost(post.id, "instagram", "posted", "Instagram upload completed.", {
      external_post_id: publishData.id,
      updatedPost,
    });

    return NextResponse.json({
      message: "Instagram post uploaded.",
      external_post_id: publishData.id,
      updatedPost,
    });
  } catch (err: any) {
    await updatePost(
      post.id,
      {
        status: "failed",
        description: err.message || "Instagram publishing failed.",
        last_error: err.message || "Unknown Instagram error",
        locked_at: null,
        locked_by: null,
      },
      "mark_failed"
    );

    await logPost(post.id, "instagram", "failed", "Instagram publishing failed.", {
      error: err.message || "Unknown Instagram error",
    });

    return NextResponse.json(
      { error: err.message || "Instagram publishing failed." },
      { status: 500 }
    );
  }
}