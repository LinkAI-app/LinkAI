"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

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
  const [schedulingAll, setSchedulingAll] = useState(false);
  const [schedulingPostKey, setSchedulingPostKey] = useState<string | null>(
    null
  );
  const [savedPostKeys, setSavedPostKeys] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function postKey(post: PlannedPost, index: number) {
    return `${post.day}-${index}`;
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

  function createScheduledDate(post: PlannedPost) {
    const scheduledDate = new Date();

    // Day 1 means today, Day 2 means tomorrow, and so on.
    scheduledDate.setDate(scheduledDate.getDate() + Math.max(post.day - 1, 0));

    const timeMatch = post.suggested_time
      ?.trim()
      .match(/^([01]?\d|2[0-3]):([0-5]\d)$/);

    if (timeMatch) {
      scheduledDate.setHours(
        Number(timeMatch[1]),
        Number(timeMatch[2]),
        0,
        0
      );
    } else {
      scheduledDate.setHours(12, 0, 0, 0);
    }

    // If Day 1's suggested time already passed, move it to tomorrow.
    if (scheduledDate.getTime() <= Date.now()) {
      scheduledDate.setDate(scheduledDate.getDate() + 1);
    }

    return scheduledDate;
  }

  function buildFullCaption(post: PlannedPost) {
    const hashtags = post.hashtags
      .map((hashtag) =>
        hashtag.startsWith("#") ? hashtag : `#${hashtag}`
      )
      .join(" ");

    return [
      post.caption.trim(),
      post.call_to_action.trim(),
      hashtags,
    ]
      .filter(Boolean)
      .join("\n\n");
  }

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
    setSuccess("");
    setPosts([]);
    setSavedPostKeys([]);

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

      const responseText = await response.text();

      let data: any;

      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error(
          `The planner returned an invalid response: ${responseText.slice(
            0,
            150
          )}`
        );
      }

      if (!response.ok || data.error) {
        throw new Error(
          data.error || "Could not generate the content plan."
        );
      }

      if (!Array.isArray(data.posts)) {
        throw new Error("The AI returned an invalid content plan.");
      }

      setPosts(data.posts);
      setSuccess(
        `${data.posts.length} content ideas generated successfully.`
      );
    } catch (caughtError) {
      console.error("Planner generation failed:", caughtError);

      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "The content plan could not be generated."
      );
    } finally {
      setGenerating(false);
    }
  }

  async function savePlannerPost(
    post: PlannedPost,
    index: number,
    showMessage = true
  ) {
    const key = postKey(post, index);

    if (savedPostKeys.includes(key)) {
      if (showMessage) {
        setSuccess("That planner post has already been saved.");
      }

      return;
    }

    setSchedulingPostKey(key);
    setError("");

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        throw new Error(authError.message);
      }

      if (!user) {
        throw new Error("Please sign in before saving planner posts.");
      }

      const scheduledDate = createScheduledDate(post);
      const scheduledIso = scheduledDate.toISOString();

      const { error: insertError } = await supabase
        .from("scheduled_posts")
        .insert({
          user_id: user.id,
          user_email: user.email || null,
          platform,
          title: post.title,
          caption: buildFullCaption(post),
          description:
            "AI planner draft. Add media before moving this post to the scheduled queue.",
          scheduled_time: scheduledIso,
          scheduled_for: scheduledIso,
          status: "draft",
          media_url: null,
          retry_count: 0,
          last_error: null,
          locked_at: null,
          locked_by: null,
          external_post_id: null,
        });

      if (insertError) {
        throw new Error(insertError.message);
      }

      setSavedPostKeys((current) =>
        current.includes(key) ? current : [...current, key]
      );

      if (showMessage) {
        setSuccess(
          `"${post.title}" was saved as a draft for ${scheduledDate.toLocaleString()}. Add media in Publishing before scheduling it.`
        );
      }
    } catch (caughtError) {
      console.error("Could not save planner post:", caughtError);

      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "The planner post could not be saved."
      );

      throw caughtError;
    } finally {
      setSchedulingPostKey(null);
    }
  }

  async function saveAllPosts() {
    if (posts.length === 0) {
      setError("Generate a content plan first.");
      return;
    }

    setSchedulingAll(true);
    setError("");
    setSuccess("");

    try {
      const unsavedPosts = posts
        .map((post, index) => ({ post, index }))
        .filter(
          ({ post, index }) =>
            !savedPostKeys.includes(postKey(post, index))
        );

      if (unsavedPosts.length === 0) {
        setSuccess("Every planner post has already been saved.");
        return;
      }

      for (const item of unsavedPosts) {
        await savePlannerPost(item.post, item.index, false);
      }

      setSuccess(
        `${unsavedPosts.length} planner posts were saved as drafts. Add media in Publishing before scheduling them.`
      );
    } catch (caughtError) {
      console.error("Could not save all planner posts:", caughtError);

      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Not all planner posts could be saved."
      );
    } finally {
      setSchedulingAll(false);
      setSchedulingPostKey(null);
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
              href="/publishing"
              className="bg-blue-500/20 border border-blue-400/30 text-blue-300 px-4 py-2 rounded-xl text-sm font-bold"
            >
              Publishing
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
                disabled={generating || schedulingAll}
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
                disabled={generating || schedulingAll}
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
                disabled={generating || schedulingAll}
                onChange={(event) => {
                  const value = Number(event.target.value);

                  setDays(
                    Math.min(Math.max(Number.isNaN(value) ? 1 : value, 1), 30)
                  );
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
                disabled={generating || schedulingAll}
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
                disabled={generating || schedulingAll}
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

          {success && (
            <div className="mt-6 bg-green-500/10 border border-green-400/20 rounded-xl p-4 text-green-300">
              {success}
            </div>
          )}

          <button
            type="button"
            onClick={generatePlan}
            disabled={generating || schedulingAll || !niche.trim()}
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

                <p className="text-yellow-300/80 text-sm mt-2">
                  Planner posts are saved as drafts. Add a video in Publishing
                  before moving them into the scheduled queue.
                </p>
              </div>

              <button
                type="button"
                onClick={saveAllPosts}
                disabled={schedulingAll || posts.length === 0}
                className="bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 px-6 py-3 rounded-xl font-bold disabled:opacity-50"
              >
                {schedulingAll ? "Saving Drafts..." : "Save All as Drafts"}
              </button>
            </section>

            <section className="space-y-5">
              {posts.map((post, index) => {
                const key = postKey(post, index);
                const isSaving = schedulingPostKey === key;
                const isSaved = savedPostKeys.includes(key);

                return (
                  <article
                    key={key}
                    className="bg-white/5 border border-white/10 rounded-2xl p-6"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <p className="text-purple-300 text-sm font-bold">
                            Day {post.day}
                          </p>

                          {isSaved && (
                            <span className="bg-green-500/15 border border-green-400/20 text-green-300 px-3 py-1 rounded-full text-xs font-bold">
                              Draft saved
                            </span>
                          )}
                        </div>

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

                  <div className="mt-6 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => savePlannerPost(post, index)}
                      disabled={isSaving || isSaved}
                      className={`px-5 py-3 rounded-xl font-bold transition ${
                        isSaved
                          ? "bg-green-500/20 border border-green-400/30 text-green-300 cursor-default"
                          : "bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90"
                      }`}
                    >
                      {isSaving
                        ? "Saving..."
                        : isSaved
                        ? "✓ Saved as Draft"
                        : "Save as Draft"}
                    </button>

                    <a
                      href="/publishing"
                      className="bg-white/10 border border-white/10 px-5 py-3 rounded-xl font-bold hover:bg-white/20 transition"
                    >
                      Open Publishing →
                    </a>

                    <a
                      href="/calendar"
                      className="bg-blue-500/20 border border-blue-400/30 text-blue-300 px-5 py-3 rounded-xl font-bold hover:bg-blue-500/30 transition"
                    >
                      View Calendar
                    </a>
                  </div>
                               </article>
              );
            })}
          </section>
        </>
      )}
    </div>
  </main>
);
} 
  async function savePlannerPost(
    post: PlannedPost,
    index: number,
    showMessage = true
  ) {
    const key = postKey(post, index);

    if (savedPostKeys.includes(key)) {
      if (showMessage) {
        setSuccess(t.alreadySaved);
      }

      return;
    }

    setSchedulingPostKey(key);
    setError("");

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        throw new Error(authError.message);
      }

      if (!user) {
        throw new Error(t.signInFirst);
      }

      const scheduledDate = createScheduledDate(post);
      const scheduledIso = scheduledDate.toISOString();

      const { error: insertError } = await supabase
        .from("scheduled_posts")
        .insert({
          user_id: user.id,
          user_email: user.email || null,
          platform,
          title: post.title,
          caption: buildFullCaption(post),
          description: t.draftDescription,
          scheduled_time: scheduledIso,
          scheduled_for: scheduledIso,
          status: "draft",
          media_url: null,
          retry_count: 0,
          last_error: null,
          locked_at: null,
          locked_by: null,
          external_post_id: null,
        });

      if (insertError) {
        throw new Error(insertError.message);
      }

      setSavedPostKeys((current) =>
        current.includes(key) ? current : [...current, key]
      );

      if (showMessage) {
        setSuccess(
          t.savedFor(
            post.title,
            scheduledDate.toLocaleString(
              language === "es" ? "es-ES" : "en-US"
            )
          )
        );
      }
    } catch (caughtError) {
      console.error("Could not save planner post:", caughtError);

      setError(
        caughtError instanceof Error
          ? caughtError.message
          : t.couldNotSave
      );

      throw caughtError;
    } finally {
      setSchedulingPostKey(null);
    }
  }

  async function saveAllPosts() {
    if (posts.length === 0) {
      setError(t.generateFirst);
      return;
    }

    setSchedulingAll(true);
    setError("");
    setSuccess("");

    try {
      const unsavedPosts = posts
        .map((post, index) => ({ post, index }))
        .filter(
          ({ post, index }) =>
            !savedPostKeys.includes(postKey(post, index))
        );

      if (unsavedPosts.length === 0) {
        setSuccess(t.allAlreadySaved);
        return;
      }

      for (const item of unsavedPosts) {
        await savePlannerPost(item.post, item.index, false);
      }

      setSuccess(t.allSaved(unsavedPosts.length));
    } catch (caughtError) {
      console.error("Could not save all planner posts:", caughtError);

      setError(
        caughtError instanceof Error
          ? caughtError.message
          : t.notAllSaved
      );
    } finally {
      setSchedulingAll(false);
      setSchedulingPostKey(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#050816] p-5 text-white md:p-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-300 bg-clip-text text-4xl font-bold text-transparent md:text-5xl">
              {t.title}
            </h1>

            <p className="mt-2 text-gray-400">{t.subtitle}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <LanguageSwitcher />

            <a
              href="/dashboard"
              className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-bold"
            >
              {t.dashboard}
            </a>

            <a
              href="/publishing"
              className="rounded-xl border border-blue-400/30 bg-blue-500/20 px-4 py-2 text-sm font-bold text-blue-300"
            >
              {t.publishing}
            </a>

            <a
              href="/calendar"
              className="rounded-xl border border-purple-400/30 bg-purple-500/20 px-4 py-2 text-sm font-bold text-purple-300"
            >
              {t.calendar}
            </a>
          </div>
        </header>

        <section className="mb-8 rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="grid gap-6 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block font-semibold">{t.platform}</span>

              <select
                value={platform}
                onChange={(event) => setPlatform(event.target.value)}
                disabled={generating || schedulingAll}
                className="w-full rounded-xl border border-white/10 bg-black/30 p-3 disabled:opacity-50"
              >
                <option value="instagram">Instagram</option>
                <option value="facebook">Facebook</option>
                <option value="tiktok">TikTok</option>
                <option value="youtube">YouTube Shorts</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block font-semibold">{t.niche}</span>

              <input
                value={niche}
                onChange={(event) => setNiche(event.target.value)}
                disabled={generating || schedulingAll}
                placeholder={t.nichePlaceholder}
                className="w-full rounded-xl border border-white/10 bg-black/30 p-3 disabled:opacity-50"
              />
            </label>

            <label className="block">
              <span className="mb-2 block font-semibold">{t.days}</span>

              <input
                type="number"
                value={days}
                min={1}
                max={30}
                disabled={generating || schedulingAll}
                onChange={(event) => {
                  const value = Number(event.target.value);

                  setDays(
                    Math.min(
                      Math.max(Number.isNaN(value) ? 1 : value, 1),
                      30
                    )
                  );
                }}
                className="w-full rounded-xl border border-white/10 bg-black/30 p-3 disabled:opacity-50"
              />

              <span className="mt-2 block text-xs text-gray-500">
                {t.daysHelp}
              </span>
            </label>

            <label className="block">
              <span className="mb-2 block font-semibold">{t.tone}</span>

              <select
                value={tone}
                onChange={(event) => setTone(event.target.value)}
                disabled={generating || schedulingAll}
                className="w-full rounded-xl border border-white/10 bg-black/30 p-3 disabled:opacity-50"
              >
                <option value="Educational">{t.educational}</option>
                <option value="Funny">{t.funny}</option>
                <option value="Luxury">{t.luxury}</option>
                <option value="Professional">{t.professional}</option>
                <option value="Motivational">{t.motivational}</option>
                <option value="Conversational">{t.conversational}</option>
              </select>
            </label>

            <label className="block md:col-span-2">
              <span className="mb-2 block font-semibold">{t.goal}</span>

              <select
                value={goal}
                onChange={(event) => setGoal(event.target.value)}
                disabled={generating || schedulingAll}
                className="w-full rounded-xl border border-white/10 bg-black/30 p-3 disabled:opacity-50"
              >
                <option value="Grow followers">{t.growFollowers}</option>
                <option value="Generate leads">{t.generateLeads}</option>
                <option value="Increase engagement">
                  {t.increaseEngagement}
                </option>
                <option value="Sell products">{t.sellProducts}</option>
                <option value="Build brand awareness">
                  {t.buildAwareness}
                </option>
              </select>
            </label>
          </div>

          {error && (
            <div className="mt-6 rounded-xl border border-red-400/20 bg-red-500/10 p-4 text-red-300">
              {error}
            </div>
          )}

          {success && (
            <div className="mt-6 rounded-xl border border-green-400/20 bg-green-500/10 p-4 text-green-300">
              {success}
            </div>
          )}

          <button
            type="button"
            onClick={generatePlan}
            disabled={generating || schedulingAll || !niche.trim()}
            className="mt-6 w-full rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 py-4 text-lg font-bold disabled:opacity-50"
          >
            {generating ? t.generatingPosts(days) : t.generatePlan}
          </button>
        </section>
                {generating && (
          <section className="mb-8 rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-purple-400" />

            <h2 className="mt-5 text-xl font-bold">{t.creatingPlan}</h2>

            <p className="mt-2 text-gray-400">{t.creatingDescription}</p>
          </section>
        )}

        {!generating && posts.length > 0 && (
          <>
            <section className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold">
                  {t.yourPlan(posts.length)}
                </h2>

                <p className="mt-1 text-gray-400">
                  {platformLabel(platform)} · {niche} · {toneLabel(tone)}
                </p>

                <p className="mt-2 text-sm text-yellow-300/80">
                  {t.draftNotice}
                </p>
              </div>

              <button
                type="button"
                onClick={saveAllPosts}
                disabled={schedulingAll || posts.length === 0}
                className="rounded-xl bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 px-6 py-3 font-bold disabled:opacity-50"
              >
                {schedulingAll ? t.savingDrafts : t.saveAll}
              </button>
            </section>

            <section className="space-y-5">
              {posts.map((post, index) => {
                const key = postKey(post, index);
                const isSaving = schedulingPostKey === key;
                const isSaved = savedPostKeys.includes(key);

                return (
                  <article
                    key={key}
                    className="rounded-2xl border border-white/10 bg-white/5 p-6"
                  >
                    <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <p className="text-sm font-bold text-purple-300">
                            {t.day} {post.day}
                          </p>

                          {isSaved && (
                            <span className="rounded-full border border-green-400/20 bg-green-500/15 px-3 py-1 text-xs font-bold text-green-300">
                              {t.draftSaved}
                            </span>
                          )}
                        </div>

                        <h3 className="mt-1 text-2xl font-bold">
                          {post.title}
                        </h3>
                      </div>

                      <div className="text-right">
                        <p className="text-xs uppercase tracking-wide text-gray-500">
                          {t.suggestedTime}
                        </p>

                        <p className="mt-1 text-lg font-bold">
                          {post.suggested_time}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-2">
                      <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                        <p className="mb-2 text-xs uppercase tracking-wide text-gray-500">
                          {t.hook}
                        </p>

                        <p className="font-medium text-white">{post.hook}</p>
                      </div>

                      <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                        <p className="mb-2 text-xs uppercase tracking-wide text-gray-500">
                          {t.contentType}
                        </p>

                        <p className="font-medium text-white">
                          {post.content_type}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-4">
                      <p className="mb-2 text-xs uppercase tracking-wide text-gray-500">
                        {t.caption}
                      </p>

                      <p className="whitespace-pre-line text-gray-200">
                        {post.caption}
                      </p>
                    </div>

                    <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-4">
                      <p className="mb-2 text-xs uppercase tracking-wide text-gray-500">
                        {t.callToAction}
                      </p>

                      <p className="text-gray-200">{post.call_to_action}</p>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {post.hashtags.map((hashtag, hashtagIndex) => {
                        const formattedHashtag = hashtag.startsWith("#")
                          ? hashtag
                          : `#${hashtag}`;

                        return (
                          <span
                            key={`${formattedHashtag}-${hashtagIndex}`}
                            className="rounded-full border border-purple-400/20 bg-purple-500/15 px-3 py-1 text-sm text-purple-300"
                          >
                            {formattedHashtag}
                          </span>
                        );
                      })}
                    </div>
                                        <div className="mt-6 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => savePlannerPost(post, index)}
                        disabled={isSaving || isSaved}
                        className={`rounded-xl px-5 py-3 font-bold transition ${
                          isSaved
                            ? "cursor-default border border-green-400/30 bg-green-500/20 text-green-300"
                            : "bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90"
                        }`}
                      >
                        {isSaving
                          ? t.saving
                          : isSaved
                          ? t.savedAsDraft
                          : t.saveAsDraft}
                      </button>

                      <a
                        href="/publishing"
                        className="rounded-xl border border-white/10 bg-white/10 px-5 py-3 font-bold transition hover:bg-white/20"
                      >
                        {t.openPublishing}
                      </a>

                      <a
                        href="/calendar"
                        className="rounded-xl border border-blue-400/30 bg-blue-500/20 px-5 py-3 font-bold text-blue-300 transition hover:bg-blue-500/30"
                      >
                        {t.viewCalendar}
                      </a>
                    </div>
                  </article>
                );
              })}
            </section>
          </>
        )}
      </div>
    </main>
  );
}