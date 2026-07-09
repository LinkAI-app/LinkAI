"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ScheduledPostsList() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPosts();
  }, []);

  async function loadPosts() {
    setLoading(true);

    const { data, error } = await supabase
      .from("scheduled_posts")
      .select("*")
      .order("scheduled_time", { ascending: false });

    if (error) console.error(error);

    setPosts(data || []);
    setLoading(false);
  }

  function statusStyle(status: string) {
    switch (status) {
      case "posted":
        return "bg-green-500/20 text-green-300 border-green-400/30";
      case "processing":
      case "uploading":
        return "bg-blue-500/20 text-blue-300 border-blue-400/30";
      case "failed":
        return "bg-red-500/20 text-red-300 border-red-400/30";
      case "scheduled":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-400/30";
      default:
        return "bg-white/10 text-gray-300 border-white/10";
    }
  }

  function platformLabel(platform: string) {
    if (!platform) return "Unknown";
    return platform.charAt(0).toUpperCase() + platform.slice(1);
  }

  return (
    <section className="mb-8 bg-white/5 border border-white/10 rounded-2xl p-6">
      <div className="flex items-center justify-between gap-4 mb-4">
        <h2 className="text-2xl font-bold">Post History</h2>

        <button
          onClick={loadPosts}
          className="bg-white/10 border border-white/10 px-4 py-2 rounded-xl text-sm font-bold"
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <p className="text-gray-400">Loading posts...</p>
      ) : posts.length === 0 ? (
        <p className="text-gray-400">No posts yet.</p>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-black/30 border border-white/10 rounded-xl p-4"
            >
              <div className="flex flex-wrap justify-between gap-3 mb-3">
                <div>
                  <p className="font-bold text-lg">
                    {platformLabel(post.platform)}
                  </p>
                  <p className="text-gray-400 text-sm">
                    {post.user_email || "No user email"}
                  </p>
                </div>

                <span
                  className={`text-sm border px-3 py-1 rounded-full font-bold capitalize ${statusStyle(
                    post.status
                  )}`}
                >
                  {post.status || "unknown"}
                </span>
              </div>

              <p className="text-gray-200 font-medium mb-2">
                {post.title || "Scheduled Video"}
              </p>

              {post.caption && (
                <p className="text-gray-400 text-sm mb-3 line-clamp-3">
                  {post.caption}
                </p>
              )}

              {post.status === "posted" && (
                <div className="mb-4 bg-green-500/10 border border-green-400/20 rounded-xl p-3 text-green-300 text-sm">
                  Posted successfully
                  {post.external_post_id && (
                    <div className="mt-1 text-green-200">
                      Post ID: {post.external_post_id}
                    </div>
                  )}
                </div>
              )}

              {post.status === "failed" && (
                <button
                  onClick={async () => {
                    await supabase
                      .from("scheduled_posts")
                      .update({
                        status: "scheduled",
                        last_error: null,
                        locked_at: null,
                        locked_by: null,
                      })
                      .eq("id", post.id);

                    loadPosts();
                  }}
                  className="mb-4 bg-yellow-500/20 border border-yellow-400/30 text-yellow-300 px-4 py-2 rounded-xl text-sm font-bold"
                >
                  Retry Post
                </button>
              )}

              <div className="grid md:grid-cols-4 gap-3 text-sm text-gray-400">
                <div>
                  <span className="text-gray-500">Scheduled:</span>
                  <br />
                  {post.scheduled_time
                    ? new Date(post.scheduled_time).toLocaleString()
                    : "No time"}
                </div>

                <div>
                  <span className="text-gray-500">Retries:</span>
                  <br />
                  {post.retry_count || 0}
                </div>

                <div>
                  <span className="text-gray-500">Media:</span>
                  <br />
                  {post.media_url ? (
                    <a
                      href={post.media_url}
                      target="_blank"
                      className="text-blue-300 underline"
                    >
                      View video
                    </a>
                  ) : (
                    "No media"
                  )}
                </div>

                <div>
                  <span className="text-gray-500">Published ID:</span>
                  <br />
                  {post.external_post_id || "Not posted yet"}
                </div>
              </div>

              {post.last_error && (
                <div className="mt-3 bg-red-500/10 border border-red-400/20 rounded-xl p-3 text-red-300 text-sm">
                  {post.last_error}
                </div>
              )}

              {post.description && post.status === "failed" && (
                <div className="mt-3 bg-red-500/10 border border-red-400/20 rounded-xl p-3 text-red-300 text-sm">
                  {post.description}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}