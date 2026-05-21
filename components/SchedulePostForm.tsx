"use client";

import { useState } from "react";

export default function SchedulePostForm() {
  const [platform, setPlatform] = useState("instagram");
  const [caption, setCaption] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [scheduledFor, setScheduledFor] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setSuccess("");

    try {
      const res = await fetch("/api/schedule-post", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          platform,
          caption,
          media_url: mediaUrl,
          scheduled_for: scheduledFor,
        }),
      });

      const data = await res.json();

      if (data.post) {
        setSuccess("Post scheduled successfully ✅");
        setCaption("");
        setMediaUrl("");
        setScheduledFor("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
      <h2 className="text-2xl font-bold mb-6">
        Schedule a Post
      </h2>

      <form
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        <select
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          className="w-full bg-black/30 border border-white/10 rounded-xl p-4"
        >
          <option value="instagram">Instagram</option>
          <option value="facebook">Facebook</option>
          <option value="tiktok">TikTok</option>
          <option value="youtube">YouTube</option>
        </select>

        <textarea
          placeholder="Write your caption..."
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className="w-full bg-black/30 border border-white/10 rounded-xl p-4 min-h-[120px]"
        />

        <input
          type="text"
          placeholder="Media URL"
          value={mediaUrl}
          onChange={(e) => setMediaUrl(e.target.value)}
          className="w-full bg-black/30 border border-white/10 rounded-xl p-4"
        />

        <input
          type="datetime-local"
          value={scheduledFor}
          onChange={(e) => setScheduledFor(e.target.value)}
          className="w-full bg-black/30 border border-white/10 rounded-xl p-4"
        />

        <button
          type="submit"
          disabled={loading}
          className="bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 px-6 py-3 rounded-xl font-bold"
        >
          {loading ? "Scheduling..." : "Schedule Post"}
        </button>

        {success && (
          <p className="text-green-400 font-medium">
            {success}
          </p>
        )}
      </form>
    </div>
  );
}