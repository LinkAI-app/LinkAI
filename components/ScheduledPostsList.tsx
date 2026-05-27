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
    const { data } = await supabase
      .from("scheduled_posts")
      .select("*")
      .order("scheduled_time", { ascending: false });

    setPosts(data || []);
    setLoading(false);
  }

  return (
    <section className="mb-8 bg-white/5 border border-white/10 rounded-2xl p-6">
      <h2 className="text-2xl font-bold mb-4">Scheduled Posts</h2>

      {loading ? (
        <p className="text-gray-400">Loading scheduled posts...</p>
      ) : posts.length === 0 ? (
        <p className="text-gray-400">No scheduled posts yet.</p>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-black/30 border border-white/10 rounded-xl p-4"
            >
              <div className="flex flex-wrap justify-between gap-3 mb-2">
                <p className="font-bold capitalize">{post.platform}</p>
                <span className="text-sm text-green-300">
                  {post.status}
                </span>
              </div>

              <p className="text-gray-300 mb-2">{post.title}</p>

              <p className="text-sm text-gray-400">
                Scheduled for:{" "}
                {new Date(post.scheduled_time).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}