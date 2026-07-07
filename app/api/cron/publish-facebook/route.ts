import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const maxDuration = 60;

const WORKER_ID = `facebook-worker-${Math.random().toString(36).slice(2, 8)}`;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function logPost(postId: string, status: string, message: string, metadata: any = {}) {
  await supabase.from("post_logs").insert({
    post_id: postId,
    platform: "facebook",
    status,
    message,
    metadata,
  });
}

async function updatePost(postId: string, values: Record<string, any>) {
  const { data, error } = await supabase
    .from("scheduled_posts")
    .update(values)
    .eq("id", postId)
    .select("*")
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function GET() {
  const now = new Date().toISOString();

  const { data: posts, error } = await supabase
    .from("scheduled_posts")
    .select("*")
    .ilike("platform", "facebook")
    .in("status", ["scheduled"])
    .lte("scheduled_time", now)
    .not("media_url", "is", null)
    .is("locked_at", null)
    .order("scheduled_time", { ascending: true })
    .limit(1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!posts?.length) return NextResponse.json({ message: "No Facebook posts ready." });

  const post = posts[0];

  await logPost(post.id, "started", "Facebook worker started.", {
    worker_id: WORKER_ID,
    user_id: post.user_id,
  });

  const { data: lockedPost, error: lockError } = await supabase
    .from("scheduled_posts")
    .update({
      locked_at: new Date().toISOString(),
      locked_by: WORKER_ID,
      status: "uploading",
      last_attempt_at: new Date().toISOString(),
    })
    .eq("id", post.id)
    .is("locked_at", null)
    .select("*")
    .maybeSingle();

  if (lockError || !lockedPost) {
    return NextResponse.json({ error: "Failed to lock Facebook post." }, { status: 500 });
  }

  try {
    const { data: connection, error: connectionError } = await supabase
      .from("social_connections")
      .select("*")
      .ilike("platform", "facebook")
      .eq("connected", true)
      .eq("user_id", post.user_id)
      .maybeSingle();

    if (connectionError) throw new Error(connectionError.message);

    if (!connection?.access_token || !connection?.page_id) {
      throw new Error("No connected Facebook page/token found for this user.");
    }

    await logPost(post.id, "publishing", "Publishing Facebook video.", {
      page_id: connection.page_id,
      media_url: post.media_url,
    });

    const res = await fetch(
      `https://graph.facebook.com/v19.0/${connection.page_id}/videos`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file_url: post.media_url,
          description: post.caption || post.description || post.title || "",
          access_token: connection.access_token,
        }),
      }
    );

    const data = await res.json();

    await logPost(post.id, "publish_response", "Facebook publish response.", {
      facebookData: data,
    });

    if (!data.id) {
      throw new Error(JSON.stringify(data));
    }

    const updatedPost = await updatePost(post.id, {
      status: "posted",
      external_post_id: data.id,
      description: "Facebook upload completed.",
      last_error: null,
      locked_at: null,
      locked_by: null,
    });

    await logPost(post.id, "posted", "Facebook upload completed.", {
      external_post_id: data.id,
      updatedPost,
    });

    return NextResponse.json({
      message: "Facebook post uploaded.",
      external_post_id: data.id,
      updatedPost,
    });
  } catch (err: any) {
    await updatePost(post.id, {
      status: "failed",
      description: err.message || "Facebook publishing failed.",
      last_error: err.message || "Unknown Facebook error",
      locked_at: null,
      locked_by: null,
    });

    await logPost(post.id, "failed", "Facebook publishing failed.", {
      error: err.message || "Unknown Facebook error",
    });

    return NextResponse.json(
      { error: err.message || "Facebook publishing failed." },
      { status: 500 }
    );
  }
}