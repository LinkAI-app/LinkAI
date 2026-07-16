"use client";

import { useState } from "react";

type PlannedPost = {
  day: number;
  title: string;
  hook: string;
  caption: string;
  hashtags: string[];
  suggested_time: string;
  content_type: string;
  call_to_action: string;
};

export default function PlannerPage() {
  const [platform, setPlatform] = useState("instagram");
  const [niche, setNiche] = useState("");
  const [days, setDays] = useState(30);
  const [tone, setTone] = useState("Educational");
  const [goal, setGoal] = useState("Grow followers");

  const [posts, setPosts] = useState<PlannedPost[]>([]);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [scheduling, setScheduling] = useState(false);

  async function generatePlan() {
    if (!niche.trim()) {
      setError("Please enter an industry or niche.");
      return;
    }

    if (days < 1 || days > 30) {
      setError("Choose between 1 and 30 days of content.");
      return;
    }

    setGenerating(true);
    setError("");
    setPosts([]);

    try {
      const response = await fetch("/api/planner/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          platform,
          niche: niche.trim(),
          days,
          tone,
          goal,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || "Could not generate the content plan.");
      }

      if (!Array.isArray(data.posts)) {
        throw new Error("The AI returned an invalid content plan.");
      }

      setPosts(data.posts);
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "The content plan could not be generated."
      );
    } finally {
      setGenerating(false);
    }
  }

  async function scheduleAllPosts() {
    if (posts.length === 0) {
      setError("Generate a content plan first.");
      return;
    }

    setScheduling(true);
    setError("");

    try {
      // The scheduling API will be connected in the next step.
      alert(
        "The content plan is ready. Next, we will connect this button to bulk scheduling."
      );
    } finally {
      setScheduling(false);
    }
  }

  function platformLabel(value: string) {
    switch (value) {
      case "instagram":
        return "Instagram";
      case "facebook":
        return "Facebook";
      case "tiktok":
        return "TikTok";
      case "youtube":
        return "YouTube Shorts";
      default:
        return value;
    }
  }

  return (
    <main className="min-h-screen bg-[#050816] text-white p-5 md:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-300 bg-clip-text text-transparent">
              AI Content Planner
            </h1>

            <p className="text-gray-400 mt-2">
              Generate an entire month of social media content with AI.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href="/dashboard"
              className="bg-white/10 border border-white/10 px-4 py-2 rounded-xl text-sm font-bold"
            >
              ← Dashboard
            </a>

            <a
              href="/calendar"
              className="bg-purple-500/20 border border-purple-400/30 text-purple-300 px-4 py-2 rounded-xl text-sm font-bold"
            >
              Calendar
            </a>
          </div>
        </header>

        <section className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
          <div className="grid md:grid-cols-2 gap-6">
            <label className="block">
              <span className="block mb-2 font-semibold">Platform</span>

              <select
                value={platform}
                onChange={(event) => setPlatform(event.target.value)}
                disabled={generating}
                className="w-full bg-black/30 border border-white/10 rounded-xl p-3 disabled:opacity-50"
              >
                <option value="instagram">Instagram</option>
                <option value="facebook">Facebook</option>
                <option value="tiktok">TikTok</option>
                <option value="youtube">YouTube Shorts</option>
              </select>
            </label>

            <label className="block">
              <span className="block mb-2 font-semibold">
                Industry or niche
              </span>

              <input
                value={niche}
                onChange={(event) => setNiche(event.target.value)}
                disabled={generating}
                placeholder="Fitness, real estate, AI, finance..."
                className="w-full bg-black/30 border border-white/10 rounded-xl p-3 disabled:opacity-50"
              />
            </label>

            <label className="block">
              <span className="block mb-2 font-semibold">
                Days of content
              </span>

              <input
                type="number"
                value={days}
                min={1}
                max={30}
                disabled={generating}
                onChange={(event) => {
                  const value = Number(event.target.value);
                  setDays(Math.min(Math.max(value || 1, 1), 30));
                }}
                className="w-full bg-black/30 border border-white/10 rounded-xl p-3 disabled:opacity-50"
              />

              <span className="block text-xs text-gray-500 mt-2">
                Choose between 1 and 30 days.
              </span>
            </label>

            <label className="block">
              <span className="block mb-2 font-semibold">Tone</span>

              <select
                value={tone}
                onChange={(event) => setTone(event.target.value)}
                disabled={generating}
                className="w-full bg-black/30 border border-white/10 rounded-xl p-3 disabled:opacity-50"
              >
                <option>Educational</option>
                <option>Funny</option>
                <option>Luxury</option>
                <option>Professional</option>
                <option>Motivational</option>
                <option>Conversational</option>
              </select>
            </label>

            <label className="block md:col-span-2">
              <span className="block mb-2 font-semibold">Goal</span>

              <select
                value={goal}
                onChange={(event) => setGoal(event.target.value)}
                disabled={generating}
                className="w-full bg-black/30 border border-white/10 rounded-xl p-3 disabled:opacity-50"
              >
                <option>Grow followers</option>
                <option>Generate leads</option>
                <option>Increase engagement</option>
                <option>Sell products</option>
                <option>Build brand awareness</option>
              </select>
            </label>
          </div>

          {error && (
            <div className="mt-6 bg-red-500/10 border border-red-400/20 rounded-xl p-4 text-red-300">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={generatePlan}
            disabled={generating || !niche.trim()}
            className="w-full mt-6 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl py-4 font-bold text-lg disabled:opacity-50"
          >
            {generating
              ? `Generating ${days} posts...`
              : "Generate Content Plan"}
          </button>
          </section>

        {generating && (
          <section className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center mb-8">
            <div className="w-10 h-10 border-4 border-white/20 border-t-purple-400 rounded-full animate-spin mx-auto" />

            <h2 className="text-xl font-bold mt-5">
              Creating your content plan
            </h2>

            <p className="text-gray-400 mt-2">
              LinkAI is generating hooks, captions, hashtags, and posting times.
            </p>
          </section>
        )}

        {!generating && posts.length > 0 && (
          <>
            <section className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-3xl font-bold">
                  Your {posts.length}-Day Plan
                </h2>

                <p className="text-gray-400 mt-1">
                  {platformLabel(platform)} · {niche} · {tone}
                </p>
              </div>

              <button
                type="button"
                onClick={scheduleAllPosts}
                disabled={scheduling}
                className="bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 px-6 py-3 rounded-xl font-bold disabled:opacity-50"
              >
                {scheduling ? "Scheduling..." : "Schedule All Posts"}
              </button>
            </section>

            <section className="space-y-5">
              {posts.map((post, index) => (
                <article
                  key={`${post.day}-${index}`}
                  className="bg-white/5 border border-white/10 rounded-2xl p-6"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
                    <div>
                      <p className="text-purple-300 text-sm font-bold">
                        Day {post.day}
                      </p>

                      <h3 className="text-2xl font-bold mt-1">
                        {post.title}
                      </h3>
                    </div>

                    <div className="text-right">
                      <p className="text-gray-500 text-xs uppercase tracking-wide">
                        Suggested time
                      </p>

                      <p className="text-lg font-bold mt-1">
                        {post.suggested_time}
                      </p>
                    </div>
                  </div>

                  <div className="grid lg:grid-cols-2 gap-4">
                    <div className="bg-black/30 border border-white/10 rounded-xl p-4">
                      <p className="text-gray-500 text-xs uppercase tracking-wide mb-2">
                        Hook
                      </p>

                      <p className="text-white font-medium">{post.hook}</p>
                    </div>

                    <div className="bg-black/30 border border-white/10 rounded-xl p-4">
                      <p className="text-gray-500 text-xs uppercase tracking-wide mb-2">
                        Content type
                      </p>

                      <p className="text-white font-medium">
                        {post.content_type}
                      </p>
                    </div>
                  </div>

                  <div className="bg-black/30 border border-white/10 rounded-xl p-4 mt-4">
                    <p className="text-gray-500 text-xs uppercase tracking-wide mb-2">
                      Caption
                    </p>

                    <p className="text-gray-200 whitespace-pre-line">
                      {post.caption}
                    </p>
                  </div>

                  <div className="bg-black/30 border border-white/10 rounded-xl p-4 mt-4">
                    <p className="text-gray-500 text-xs uppercase tracking-wide mb-2">
                      Call to action
                    </p>

                    <p className="text-gray-200">{post.call_to_action}</p>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-4">
                    {post.hashtags.map((hashtag, hashtagIndex) => {
                      const formattedHashtag = hashtag.startsWith("#")
                        ? hashtag
                        : `#${hashtag}`;

                      return (
                        <span
                          key={`${formattedHashtag}-${hashtagIndex}`}
                          className="bg-purple-500/15 border border-purple-400/20 text-purple-300 px-3 py-1 rounded-full text-sm"
                        >
                          {formattedHashtag}
                        </span>
                      );
                    })}
                  </div>
                </article>
              ))}
            </section>
          </>
        )}
      </div>
    </main>
  );
}