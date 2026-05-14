"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function DashboardPage() {
  const [content, setContent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [plan, setPlan] = useState("free");
  const [tiktokConnected, setTiktokConnected] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.get("tiktok") === "connected") {
      setTiktokConnected(true);
    }

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

    if (profile?.plan) {
      setPlan(profile.plan);
    }

    const { data, error } = await supabase
      .from("saved_content")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    setContent(data || []);
    setLoading(false);
  }

  async function upgradeToPremium() {
    try {
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
    } catch (error) {
      console.error(error);
      alert("Stripe checkout failed.");
    }
  }

  return (
    <main className="min-h-screen bg-[#050816] text-white p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-300 bg-clip-text text-transparent">
              LinkAI Dashboard
            </h1>

            <p className="text-gray-400 mt-2">
              Your saved AI creator content
            </p>

            <div className="mt-4 flex flex-wrap gap-3">
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/10 px-4 py-2 rounded-full">
                <div
                  className={`w-3 h-3 rounded-full ${
                    plan === "premium"
                      ? "bg-green-400"
                      : "bg-yellow-400"
                  }`}
                />

                <span className="text-sm font-medium">
                  {plan === "premium"
                    ? "Premium Plan"
                    : "Free Plan"}
                </span>
              </div>

              {tiktokConnected && (
                <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-400/30 px-4 py-2 rounded-full">
                  <div className="w-3 h-3 rounded-full bg-green-400" />

                  <span className="text-sm font-medium text-green-300">
                    TikTok Connected
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            {plan !== "premium" && (
              <button
                onClick={upgradeToPremium}
                className="bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 px-5 py-3 rounded-xl font-bold shadow-lg shadow-purple-500/20"
              >
                Upgrade to Premium
              </button>
            )}

            <a
              href="/api/tiktok/connect"
              className={`border border-white/10 px-5 py-3 rounded-xl font-bold ${
                tiktokConnected
                  ? "bg-green-500/20 text-green-300"
                  : "bg-black"
              }`}
            >
              {tiktokConnected ? "TikTok Connected" : "Connect TikTok"}
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

        {loading ? (
          <div className="text-gray-400">Loading...</div>
        ) : content.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center backdrop-blur-xl">
            <h2 className="text-2xl font-bold mb-2">
              No saved content yet
            </h2>

            <p className="text-gray-400">
              Generate and save content from the homepage.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {content.map((item, index) => (
              <div
                key={index}
                className="border border-white/10 rounded-2xl p-6 bg-white/5 backdrop-blur-xl"
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

                {item.content?.hooks && (
                  <div className="mb-6">
                    <h3 className="text-xl font-bold mb-3">
                      Viral Hooks
                    </h3>

                    <div className="space-y-3">
                      {item.content.hooks.map(
                        (hook: string, i: number) => (
                          <div
                            key={i}
                            className="bg-black/30 border border-white/10 p-4 rounded-xl"
                          >
                            {hook}
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

                {item.content?.caption && (
                  <div className="mb-6">
                    <h3 className="text-xl font-bold mb-3">
                      Caption
                    </h3>

                    <div className="bg-black/30 border border-white/10 p-4 rounded-xl">
                      {item.content.caption}
                    </div>
                  </div>
                )}

                {item.content?.hashtags && (
                  <div className="mb-6">
                    <h3 className="text-xl font-bold mb-3">
                      Hashtags
                    </h3>

                    <div className="flex flex-wrap gap-3">
                      {item.content.hashtags.map(
                        (tag: string, i: number) => (
                          <div
                            key={i}
                            className="bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-2 rounded-full"
                          >
                            #{tag.replace("#", "")}
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

                {item.content?.analysis && (
                  <div>
                    <h3 className="text-xl font-bold mb-3">
                      Video Analysis
                    </h3>

                    <div className="bg-black/30 border border-white/10 p-4 rounded-xl whitespace-pre-line">
                      {item.content.analysis}
                    </div>
                  </div>
                )}

                <div className="text-gray-500 text-sm mt-6">
                  Saved on{" "}
                  {new Date(item.created_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}