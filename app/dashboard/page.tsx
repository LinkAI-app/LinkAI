"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import SchedulePostForm from "@/components/SchedulePostForm";

export default function DashboardPage() {
  const [content, setContent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [plan, setPlan] = useState("free");
  const [connections, setConnections] = useState<any[]>([]);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/login";
      return;
    }

    setUser(user);

    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", user.id)
      .single();

    if (profile?.plan) setPlan(profile.plan);

    const connectionsRes = await fetch("/api/social-connections");
    const connectionsData = await connectionsRes.json();
    setConnections(connectionsData.connections || []);

    const { data } = await supabase
      .from("saved_content")
      .select("*")
      .order("created_at", { ascending: false });

    setContent(data || []);
    setLoading(false);
  }

  async function upgradeToPremium() {
    const response = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id }),
    });

    const data = await response.json();
    if (data.url) window.location.href = data.url;
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

  return (
    <main className="min-h-screen bg-[#050816] text-white p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-300 bg-clip-text text-transparent">
              LinkAI Dashboard
            </h1>

            <p className="text-gray-400 mt-2">
              Your AI social media command center
            </p>

            <div className="mt-4 flex flex-wrap gap-3">
              <Badge label={plan === "premium" ? "Premium Plan" : "Free Plan"} />

              {hasTikTok && <Badge label="TikTok Connected" />}
              {hasInstagram && <Badge label="Instagram/Facebook Connected" />}
              {hasYouTube && <Badge label="YouTube Connected" />}
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            {plan !== "premium" && (
              <button
                onClick={upgradeToPremium}
                className="bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 px-5 py-3 rounded-xl font-bold"
              >
                Upgrade to Premium
              </button>
            )}

            <a
              href="/publishing"
              className="bg-purple-500/20 text-purple-300 border border-white/10 px-5 py-3 rounded-xl font-bold"
            >
              Manage Publishing →
            </a>

            <a
              href="/api/tiktok/connect"
              className="bg-green-500/20 text-green-300 border border-white/10 px-5 py-3 rounded-xl font-bold"
            >
              {hasTikTok ? "Reconnect TikTok" : "Connect TikTok"}
            </a>

            <a
              href={user?.id ? `/api/meta/connect?user_id=${user.id}` : "/api/meta/connect"}
              className="bg-blue-500/20 text-blue-300 border border-white/10 px-5 py-3 rounded-xl font-bold"
            >
              {hasInstagram ? "Reconnect Instagram" : "Connect Instagram"}
            </a>

            <a
              href="/api/youtube/connect"
              className="bg-red-500/20 text-red-300 border border-white/10 px-5 py-3 rounded-xl font-bold"
            >
              {hasYouTube ? "Reconnect YouTube" : "Connect YouTube"}
            </a>

            <button
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.href = "/login";
              }}
              className="bg-white/10 border border-white/10 px-5 py-3 rounded-xl font-bold"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="mb-8">
          <SchedulePostForm />
        </div>

        <section className="mb-8 bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="text-2xl font-bold mb-4">Connected Accounts</h2>

          {connections.length === 0 ? (
            <p className="text-gray-400">No social accounts connected yet.</p>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {connections.map((account) => (
                <div
                  key={account.id}
                  className="bg-black/30 border border-white/10 rounded-xl p-4 flex items-center gap-4"
                >
                  <div className="w-14 h-14 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center font-bold">
                    {account.platform?.slice(0, 2).toUpperCase()}
                  </div>

                  <div>
                    <p className="text-lg font-bold capitalize">
                      {account.platform}
                    </p>
                    <p className="text-gray-300">
                      {account.username
                        ? account.platform?.toLowerCase() === "instagram"
                          ? `@${account.username}`
                          : account.username
                        : "Connected account"}
                    </p>
                    <p className="text-green-300 text-sm">
                      Connected successfully
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {loading ? (
          <div className="text-gray-400">Loading...</div>
        ) : content.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold mb-2">No saved content yet</h2>
            <p className="text-gray-400">
              Generate and save content from the homepage.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {content.map((item, index) => (
              <div
                key={index}
                className="border border-white/10 rounded-2xl p-6 bg-white/5"
              >
                <div className="flex flex-wrap gap-3 mb-4">
                  <div className="bg-pink-600 px-3 py-1 rounded-full text-sm">
                    {item.platform}
                  </div>
                  <div className="bg-blue-600 px-3 py-1 rounded-full text-sm">
                    {item.niche}
                  </div>
                  <div className="bg-purple-600 px-3 py-1 rounded-full text-sm">
                    {item.language}
                  </div>
                </div>

                {item.content?.caption && (
                  <div className="bg-black/30 border border-white/10 p-4 rounded-xl">
                    {item.content.caption}
                  </div>
                )}

                <div className="text-gray-500 text-sm mt-6">
                  Saved on {new Date(item.created_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-400/30 px-4 py-2 rounded-full">
      <div className="w-3 h-3 rounded-full bg-green-400" />
      <span className="text-sm font-medium text-green-300">{label}</span>
    </div>
  );
}