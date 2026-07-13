"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import SchedulePostForm from "@/components/SchedulePostForm";

export default function DashboardPage() {
  const [content, setContent] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [plan, setPlan] = useState("free");

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/login";
      return;
    }

    setUser(user);

    const [
      profileResult,
      contentResult,
      postsResult,
      connectionsResponse,
    ] = await Promise.all([
      supabase
        .from("profiles")
        .select("plan")
        .eq("id", user.id)
        .maybeSingle(),

      supabase
        .from("saved_content")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5),

      supabase
        .from("scheduled_posts")
        .select("*")
        .eq("user_id", user.id)
        .order("scheduled_time", { ascending: true }),

      fetch("/api/social-connections"),
    ]);

    if (profileResult.data?.plan) {
      setPlan(profileResult.data.plan);
    }

    setContent(contentResult.data || []);
    setPosts(postsResult.data || []);

    try {
      const connectionsData = await connectionsResponse.json();
      setConnections(connectionsData.connections || []);
    } catch (err) {
      console.error(err);
      setConnections([]);
    }

    setLoading(false);
  }

  async function upgradeToPremium() {
    if (!user) return;

    const response = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: user.id,
      }),
    });

    const data = await response.json();

    if (data.url) {
      window.location.href = data.url;
    }
  }

  const hasInstagram = connections.some(
    (c) => c.platform?.toLowerCase() === "instagram"
  );

  const hasTikTok = connections.some(
    (c) => c.platform?.toLowerCase() === "tiktok"
  );

  const hasYouTube = connections.some(
    (c) => c.platform?.toLowerCase() === "youtube"
  );

  const stats = useMemo(() => {
    const scheduled = posts.filter(
      (p) => p.status === "scheduled"
    );

    const posted = posts.filter(
      (p) => p.status === "posted"
    );

    const failed = posts.filter(
      (p) => p.status === "failed"
    );

    const processing = posts.filter(
      (p) =>
        p.status === "processing" ||
        p.status === "uploading"
    );

    const nextPost =
      scheduled
        .filter(
          (p) =>
            p.scheduled_time &&
            new Date(p.scheduled_time) > new Date()
        )
        .sort(
          (a, b) =>
            new Date(a.scheduled_time).getTime() -
            new Date(b.scheduled_time).getTime()
        )[0] || null;

    return {
      scheduled,
      posted,
      failed,
      processing,
      nextPost,
    };
  }, [posts]);

  return (
    <main className="min-h-screen bg-[#050816] text-white p-8">
      <div className="max-w-7xl mx-auto">

        <div className="flex flex-col lg:flex-row lg:justify-between gap-6 mb-8">

          <div>

            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-300 bg-clip-text text-transparent">
              LinkAI Dashboard
            </h1>

            <p className="text-gray-400 mt-2">
              Your AI social media command center
            </p>

            <div className="mt-4 flex flex-wrap gap-3">

              <Badge
                label={
                  plan === "premium"
                    ? "Premium Plan"
                    : "Free Plan"
                }
              />

              {hasTikTok && (
                <Badge label="TikTok Connected" />
              )}

              {hasInstagram && (
                <Badge label="Instagram Connected" />
              )}

              {hasYouTube && (
                <Badge label="YouTube Connected" />
              )}

            </div>

          </div>

          <div className="flex flex-wrap gap-3">

            {plan !== "premium" && (
              <button
                onClick={upgradeToPremium}
                className="bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 px-5 py-3 rounded-xl font-bold"
              >
                Upgrade
              </button>
            )}

            <a
              href="/publishing"
              className="bg-purple-500/20 px-5 py-3 rounded-xl font-bold"
            >
              Publishing
            </a>

            <a
              href="/calendar"
              className="bg-blue-500/20 px-5 py-3 rounded-xl font-bold"
            >
              <a
  href="/publishing"
  className="bg-purple-500/20 text-purple-300 border border-white/10 px-5 py-3 rounded-xl font-bold"
>
  Manage Publishing →
</a>

<a
  href="/planner"
  className="bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 px-5 py-3 rounded-xl font-bold"
>
  🤖 AI Planner
</a>
              Calendar
            </a>

            <a
              href="/analytics"
              className="bg-cyan-500/20 px-5 py-3 rounded-xl font-bold"
            >
              Analytics
            </a>

            <button
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.href = "/login";
              }}
              className="bg-white/10 px-5 py-3 rounded-xl font-bold"
            >
              Logout
            </button>

          </div>

        </div>
                <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <SummaryCard
            label="Scheduled"
            value={stats.scheduled.length}
            subtitle="Waiting to publish"
          />

          <SummaryCard
            label="Published"
            value={stats.posted.length}
            subtitle="Successfully posted"
          />

          <SummaryCard
            label="Processing"
            value={stats.processing.length}
            subtitle="Uploading now"
          />

          <SummaryCard
            label="Failed"
            value={stats.failed.length}
            subtitle="Needs attention"
          />
        </section>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">

          <section className="lg:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-6">

            <div className="flex items-center justify-between mb-4">

              <h2 className="text-2xl font-bold">
                Next Scheduled Post
              </h2>

              <a
                href="/publishing"
                className="text-purple-300 text-sm font-bold"
              >
                View all →
              </a>

            </div>

            {!stats.nextPost ? (
              <div className="text-center py-10">

                <p className="text-gray-400">
                  No upcoming scheduled posts.
                </p>

                <a
                  href="#schedule-post"
                  className="inline-block mt-4 text-purple-300 font-bold"
                >
                  Schedule one →
                </a>

              </div>
            ) : (
              <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-400/20 rounded-xl p-6">

                <div className="flex justify-between items-center mb-4">

                  <PlatformBadge
                    platform={stats.nextPost.platform}
                  />

                  <StatusBadge
                    status={stats.nextPost.status}
                  />

                </div>

                <h3 className="text-2xl font-bold mb-2">
                  {stats.nextPost.title ||
                    "Scheduled Post"}
                </h3>

                <p className="text-gray-300 line-clamp-3">
                  {stats.nextPost.caption}
                </p>

                <p className="mt-6 text-lg font-bold">
                  {new Date(
                    stats.nextPost.scheduled_time
                  ).toLocaleString()}
                </p>

              </div>
            )}

          </section>

          <section className="bg-white/5 border border-white/10 rounded-2xl p-6">

            <h2 className="text-2xl font-bold mb-5">
              Quick Actions
            </h2>

            <div className="space-y-3">

              <a
                href="#schedule-post"
                className="block bg-purple-600/20 rounded-xl p-4"
              >
                📅 Schedule New Post
              </a>

              <a
                href="/publishing"
                className="block bg-white/10 rounded-xl p-4"
              >
                🚀 Publishing
              </a>

              <a
                href="/calendar"
                className="block bg-white/10 rounded-xl p-4"
              >
                🗓 Calendar
              </a>

              <a
                href="/analytics"
                className="block bg-white/10 rounded-xl p-4"
              >
                📊 Analytics
              </a>

            </div>

          </section>

        </div>

        <section className="mb-8 bg-white/5 border border-white/10 rounded-2xl p-6">

          <div className="flex justify-between items-center mb-4">

            <h2 className="text-2xl font-bold">
              Recent Activity
            </h2>

            <a
              href="/publishing"
              className="text-purple-300 text-sm font-bold"
            >
              View history →
            </a>

          </div>

          {posts.length === 0 ? (
            <p className="text-gray-400">
              No publishing activity yet.
            </p>
          ) : (
            <div className="space-y-3">

              {posts
                .slice()
                .reverse()
                .slice(0, 5)
                .map((post) => (
                  <div
                    key={post.id}
                    className="bg-black/30 border border-white/10 rounded-xl p-4 flex justify-between items-center gap-4"
                  >
                    <div>

                      <div className="flex gap-2 items-center">

                        <PlatformBadge
                          platform={post.platform}
                        />

                        <StatusBadge
                          status={post.status}
                        />

                      </div>

                      <p className="text-gray-300 mt-2 line-clamp-1">
                        {post.caption ||
                          post.title ||
                          "Scheduled Post"}
                      </p>

                    </div>

                    <div className="text-right text-sm text-gray-400">

                      {post.scheduled_time &&
                        new Date(
                          post.scheduled_time
                        ).toLocaleDateString()}

                    </div>
                  </div>
                ))}

            </div>
          )}

        </section>

        <div
          id="schedule-post"
          className="mb-8 scroll-mt-6"
        >
          <SchedulePostForm />
        </div>
              </div>
    </main>
  );
}

function SummaryCard({
  label,
  value,
  subtitle,
}: {
  label: string;
  value: number;
  subtitle: string;
}) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
      <p className="text-gray-400 text-sm">{label}</p>

      <p className="text-4xl font-bold mt-2">
        {value}
      </p>

      <p className="text-gray-500 text-xs mt-2">
        {subtitle}
      </p>
    </div>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-400/30 px-4 py-2 rounded-full">
      <div className="w-3 h-3 rounded-full bg-green-400" />

      <span className="text-sm font-medium text-green-300">
        {label}
      </span>
    </div>
  );
}

function PlatformBadge({
  platform,
}: {
  platform?: string;
}) {
  const styles: Record<string, string> = {
    instagram:
      "bg-pink-500/20 text-pink-300 border-pink-400/30",

    facebook:
      "bg-blue-500/20 text-blue-300 border-blue-400/30",

    tiktok:
      "bg-white/10 text-white border-white/20",

    youtube:
      "bg-red-500/20 text-red-300 border-red-400/30",
  };

  return (
    <span
      className={`px-3 py-1 rounded-full border text-xs font-bold capitalize ${
        styles[platform?.toLowerCase() || ""] ||
        "bg-white/10 text-gray-300 border-white/10"
      }`}
    >
      {platform || "Unknown"}
    </span>
  );
}

function StatusBadge({
  status,
}: {
  status?: string;
}) {
  const styles: Record<string, string> = {
    posted:
      "bg-green-500/20 text-green-300 border-green-400/30",

    scheduled:
      "bg-yellow-500/20 text-yellow-300 border-yellow-400/30",

    processing:
      "bg-blue-500/20 text-blue-300 border-blue-400/30",

    uploading:
      "bg-blue-500/20 text-blue-300 border-blue-400/30",

    failed:
      "bg-red-500/20 text-red-300 border-red-400/30",

    cancelled:
      "bg-gray-500/20 text-gray-300 border-gray-400/30",
  };

  return (
    <span
      className={`px-3 py-1 rounded-full border text-xs font-bold capitalize ${
        styles[status || ""] ||
        "bg-white/10 text-gray-300 border-white/10"
      }`}
    >
      {status || "Unknown"}
    </span>
  );
}