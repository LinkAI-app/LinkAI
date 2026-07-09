"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AnalyticsPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    setLoading(true);

    const { data } = await supabase
      .from("scheduled_posts")
      .select("*")
      .order("scheduled_time", { ascending: true });

    setPosts(data || []);
    setLoading(false);
  }

  const now = new Date();
  const weekAgo = new Date();
  weekAgo.setDate(now.getDate() - 7);

  const monthAgo = new Date();
  monthAgo.setDate(now.getDate() - 30);

  const total = posts.length;
  const posted = posts.filter((p) => p.status === "posted").length;
  const scheduled = posts.filter((p) => p.status === "scheduled").length;
  const processing = posts.filter(
    (p) => p.status === "processing" || p.status === "uploading"
  ).length;
  const failed = posts.filter((p) => p.status === "failed").length;
  const cancelled = posts.filter((p) => p.status === "cancelled").length;

  const successRate = total > 0 ? Math.round((posted / total) * 100) : 0;

  const thisWeek = posts.filter((p) => {
    if (!p.scheduled_time) return false;
    return new Date(p.scheduled_time) >= weekAgo;
  }).length;

  const thisMonth = posts.filter((p) => {
    if (!p.scheduled_time) return false;
    return new Date(p.scheduled_time) >= monthAgo;
  }).length;

  const platforms = ["instagram", "tiktok", "youtube", "facebook"];

  const platformStats = platforms.map((platform) => {
    const count = posts.filter(
      (p) => p.platform?.toLowerCase() === platform
    ).length;

    return {
      platform,
      count,
      percent: total > 0 ? Math.round((count / total) * 100) : 0,
    };
  });

  const upcomingPosts = posts
    .filter((p) => {
      if (!p.scheduled_time) return false;
      return p.status === "scheduled" && new Date(p.scheduled_time) > now;
    })
    .slice(0, 5);

  const cards = [
    { label: "Total Posts", value: total },
    { label: "Published", value: posted },
    { label: "Scheduled", value: scheduled },
    { label: "Processing", value: processing },
    { label: "Failed", value: failed },
    { label: "Success Rate", value: `${successRate}%` },
  ];

  return (
    <main className="min-h-screen bg-[#050816] text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-300 bg-clip-text text-transparent">
              Analytics
            </h1>

            <p className="text-gray-400 mt-2">
              View publishing performance across all connected platforms.
            </p>
          </div>

          <a
            href="/dashboard"
            className="bg-white/10 border border-white/10 px-4 py-2 rounded-xl text-sm font-bold"
          >
            ← Back to Dashboard
          </a>
        </div>

        {loading ? (
          <p className="text-gray-400">Loading analytics...</p>
        ) : (
          <>
            <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-5 mb-8">
              {cards.map((card) => (
                <div
                  key={card.label}
                  className="bg-white/5 border border-white/10 rounded-2xl p-6"
                >
                  <p className="text-gray-400 text-sm">{card.label}</p>
                  <p className="text-4xl font-bold mt-2">{card.value}</p>
                </div>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h2 className="text-2xl font-bold mb-4">Platform Breakdown</h2>

                <div className="space-y-4">
                  {platformStats.map((item) => (
                    <div key={item.platform}>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="capitalize text-gray-300">
                          {item.platform}
                        </span>
                        <span className="text-gray-400">
                          {item.count} posts
                        </span>
                      </div>

                      <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-600 to-blue-600"
                          style={{ width: `${item.percent}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h2 className="text-2xl font-bold mb-4">Recent Activity</h2>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-black/30 border border-white/10 rounded-xl p-4">
                    <p className="text-gray-400 text-sm">Last 7 Days</p>
                    <p className="text-3xl font-bold mt-2">{thisWeek}</p>
                  </div>

                  <div className="bg-black/30 border border-white/10 rounded-xl p-4">
                    <p className="text-gray-400 text-sm">Last 30 Days</p>
                    <p className="text-3xl font-bold mt-2">{thisMonth}</p>
                  </div>

                  <div className="bg-black/30 border border-white/10 rounded-xl p-4">
                    <p className="text-gray-400 text-sm">Cancelled</p>
                    <p className="text-3xl font-bold mt-2">{cancelled}</p>
                  </div>

                  <div className="bg-black/30 border border-white/10 rounded-xl p-4">
                    <p className="text-gray-400 text-sm">Need Attention</p>
                    <p className="text-3xl font-bold mt-2">{failed}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h2 className="text-2xl font-bold mb-4">Upcoming Posts</h2>

              {upcomingPosts.length === 0 ? (
                <p className="text-gray-400">No upcoming posts scheduled.</p>
              ) : (
                <div className="space-y-3">
                  {upcomingPosts.map((post) => (
                    <div
                      key={post.id}
                      className="bg-black/30 border border-white/10 rounded-xl p-4 flex flex-wrap justify-between gap-3"
                    >
                      <div>
                        <p className="font-bold capitalize">
                          {post.platform}
                        </p>
                        <p className="text-gray-400 text-sm">
                          {post.caption || post.title || "Scheduled post"}
                        </p>
                      </div>

                      <p className="text-gray-300 text-sm">
                        {new Date(post.scheduled_time).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}